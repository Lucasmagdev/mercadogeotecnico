import OpenAI from "openai";

export type AiCapability = "vision" | "text" | "audio";

export type AiProvider = {
  name: "gemini" | "groq" | "openai";
  client: OpenAI;
  model: string;
};

/** Runs one provider stage, moving to the next provider only when the previous did not serve it. */
export type AiCall = <R>(stage: string, run: (provider: AiProvider) => Promise<R>) => Promise<R>;

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TIMEOUT_MS = 20_000;

type Env = Record<string, string | undefined>;

/**
 * Ordered provider chain per capability. Free tiers first (Gemini for vision/text, Groq for
 * audio); OpenAI is only reached when no free key is configured or every free option failed
 * with a not-served error (see shouldTryNextProvider).
 */
export function aiProviders(
  capability: AiCapability,
  env: Env = process.env,
  timeout = 45_000,
): AiProvider[] {
  const options = { timeout, maxRetries: 0 };
  const providers: AiProvider[] = [];
  if (capability === "audio") {
    if (env.GROQ_API_KEY)
      providers.push({
        name: "groq",
        client: new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: GROQ_BASE_URL, ...options }),
        model: env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo",
      });
    if (env.OPENAI_API_KEY)
      providers.push({
        name: "openai",
        client: new OpenAI({ apiKey: env.OPENAI_API_KEY, ...options }),
        model: env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
      });
    return providers;
  }
  if (env.GEMINI_API_KEY) {
    // Free-tier Gemini often answers 503 "high demand" or stalls; a second model has its own
    // capacity pool, so it is tried before any paid provider. Short timeout keeps room for it.
    const client = new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: GEMINI_BASE_URL,
      ...options,
      timeout: Math.min(timeout, GEMINI_TIMEOUT_MS),
    });
    const primary =
      (capability === "vision" ? env.GEMINI_VISION_MODEL : env.GEMINI_TEXT_MODEL) ||
      DEFAULT_GEMINI_MODEL;
    const secondary = env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL;
    providers.push({ name: "gemini", client, model: primary });
    if (secondary !== primary) providers.push({ name: "gemini", client, model: secondary });
  }
  if (env.OPENAI_API_KEY)
    providers.push({
      name: "openai",
      client: new OpenAI({ apiKey: env.OPENAI_API_KEY, ...options }),
      model:
        capability === "vision"
          ? env.OPENAI_LISTING_MODEL || "gpt-5.6-terra"
          : env.OPENAI_SPECS_MODEL || "gpt-5.6-luna",
    });
  return providers;
}

/**
 * Errors where the request was not served (quota, overload, stall), so moving to the next
 * provider never double-charges. Other failures (e.g. 500, bad request) end the operation.
 */
export function shouldTryNextProvider(error: unknown) {
  if (error instanceof OpenAI.APIConnectionTimeoutError) return true;
  return error instanceof OpenAI.APIError && (error.status === 429 || error.status === 503);
}
