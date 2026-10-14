import { createClient } from "@supabase/supabase-js";
import {
  getRequestHeader,
  setResponseHeaders,
  setResponseStatus,
} from "@tanstack/react-start/server";
import OpenAI from "openai";
import { z } from "zod";
import {
  AiAccessError,
  bearerToken,
  authorizeAiOperation,
  estimateAiCost,
  providerUsage,
  type AiOperation,
  type AiUsage,
} from "./ai-policy";

const PriceSchema = z.record(
  z.object({
    inputUsdPerMillion: z.number().nonnegative().finite(),
    cachedInputUsdPerMillion: z.number().nonnegative().finite().optional(),
    outputUsdPerMillion: z.number().nonnegative().finite(),
    audioUsdPerMinute: z.number().nonnegative().finite().optional(),
  }),
);

// Includes authorization and both provider stages, leaving time within Netlify's
// 60s synchronous limit for bounded telemetry and the HTTP response.
const TOTAL_TIMEOUT_MS = 45_000;

export async function runAiOperation<T>(
  operation: AiOperation,
  execute: (context: {
    client: OpenAI;
    signal: AbortSignal;
    measure: <R>(stage: string, model: string, call: () => Promise<R>) => Promise<R>;
  }) => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const deadline = AbortSignal.timeout(TOTAL_TIMEOUT_MS);
  setResponseHeaders(new Headers({ "Cache-Control": "private, no-store" }));
  const header = getRequestHeader("authorization");
  try {
    bearerToken(header);
  } catch (error) {
    setResponseStatus(401);
    throw error;
  }
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!url || !anonKey || !serviceKey || !apiKey) {
    setResponseStatus(503);
    throw new Error("Assistência de IA indisponível. Você pode preencher o anúncio manualmente.");
  }

  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.any([
            deadline,
            AbortSignal.timeout(8_000),
            ...(init?.signal ? [init.signal] : []),
          ]),
        }),
    },
  };
  const admin = createClient(url, serviceKey, options);
  const auth = createClient(url, anonKey, options);
  let authorization: { userId: string; requestId: string };
  try {
    authorization = await authorizeAiOperation(header, operation, {
      user: async (token) => {
        const { data, error } = await auth.auth.getUser(token);
        return error ? null : data.user;
      },
      approvedCompany: async (userId) => {
        const { data, error } = await admin
          .from("companies")
          .select("id")
          .eq("owner_id", userId)
          .eq("status", "approved")
          .limit(1);
        if (error)
          throw new AiAccessError("Não foi possível verificar sua empresa. Tente novamente.", 503);
        return !!data?.length;
      },
      reserve: async (userId, action) => {
        const { data, error } = await admin.rpc("reserve_ai_request", {
          p_user_id: userId,
          p_operation: action,
        });
        if (error) {
          const limited = error.code === "P0001" && error.message.includes("AI_QUOTA");
          const disabled = error.code === "P0001" && error.message.includes("AI_DISABLED");
          console.warn(
            JSON.stringify({ event: "ai_reservation_denied", code: error.code, limited, disabled }),
          );
          throw new AiAccessError(
            limited
              ? "Limite de assistência de IA atingido. Aguarde ou continue preenchendo manualmente."
              : "Assistência de IA indisponível. Continue preenchendo manualmente.",
            limited ? 429 : 503,
          );
        }
        if (typeof data !== "string")
          throw new AiAccessError("Assistência de IA indisponível.", 503);
        return data;
      },
    });
  } catch (error) {
    setResponseStatus(error instanceof AiAccessError ? error.status : 503);
    throw error;
  }

  let prices: z.infer<typeof PriceSchema> = {};
  try {
    prices = PriceSchema.parse(JSON.parse(process.env.AI_MODEL_PRICES_JSON || "{}"));
  } catch {
    console.warn(JSON.stringify({ event: "ai_price_config_invalid" }));
  }
  const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
  const totals: AiUsage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    audioSeconds: 0,
  };
  let estimatedCostUsd: number | null = 0;
  let status = "failed";
  const measure = async <R>(stage: string, model: string, call: () => Promise<R>): Promise<R> => {
    const callStarted = Date.now();
    const response = await call();
    const usage = providerUsage(response);
    if (usage)
      for (const key of Object.keys(totals) as (keyof AiUsage)[]) totals[key] += usage[key];
    const cost = usage ? estimateAiCost(usage, prices[model]) : null;
    estimatedCostUsd = estimatedCostUsd === null || cost === null ? null : estimatedCostUsd + cost;
    console.info(
      JSON.stringify({
        event: "ai_provider_usage",
        requestId: authorization.requestId,
        operation,
        stage,
        model,
        durationMs: Date.now() - callStarted,
        usageReported: !!usage,
        ...usage,
        estimatedCostUsd: cost,
      }),
    );
    return response;
  };
  try {
    const result = await execute({ client, signal: deadline, measure });
    status = "succeeded";
    return result;
  } catch (error) {
    estimatedCostUsd = null;
    console.error(
      JSON.stringify({
        event: "ai_provider_error",
        requestId: authorization.requestId,
        operation,
        kind: error instanceof Error ? error.name : "unknown",
      }),
    );
    setResponseStatus(502);
    throw new Error(
      "Não foi possível concluir a assistência de IA. Tente novamente ou preencha manualmente.",
    );
  } finally {
    const durationMs = Date.now() - startedAt;
    console.info(
      JSON.stringify({
        event: "ai_operation",
        requestId: authorization.requestId,
        operation,
        status,
        durationMs,
        ...totals,
        estimatedCostUsd,
      }),
    );
    // No prompt, file, token or seller contact is written to telemetry. Reservations remain
    // consumed on timeout/failure: retrying must never bypass the distributed quota.
    try {
      const telemetry = createClient(url, serviceKey, {
        auth: options.auth,
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(5_000) }),
        },
      });
      const { error } = await telemetry.rpc("finish_ai_request", {
        p_request_id: authorization.requestId,
        p_status: status,
        p_duration_ms: durationMs,
        p_input_tokens: totals.inputTokens,
        p_output_tokens: totals.outputTokens,
        p_estimated_cost_usd: estimatedCostUsd,
      });
      if (error)
        console.error(JSON.stringify({ event: "ai_telemetry_write_failed", code: error.code }));
    } catch {
      console.error(JSON.stringify({ event: "ai_telemetry_write_failed" }));
    }
  }
}
