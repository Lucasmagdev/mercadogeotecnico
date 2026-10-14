import { describe, expect, test } from "bun:test";
import {
  authorizeAiOperation,
  bearerToken,
  estimateAiCost,
  providerUsage,
  type AiAuthorizationBackend,
} from "../src/lib/ai-policy";

describe("AI server authorization", () => {
  function backend(overrides: Partial<AiAuthorizationBackend> = {}) {
    const calls: string[] = [];
    const service: AiAuthorizationBackend = {
      user: async () => {
        calls.push("user");
        return { id: "company-owner" };
      },
      approvedCompany: async () => {
        calls.push("company");
        return true;
      },
      reserve: async () => {
        calls.push("reserve");
        return "request-id";
      },
      ...overrides,
    };
    return { calls, service };
  }

  test("anonymous or malformed credentials never reach auth, quota or provider", async () => {
    for (const header of [undefined, "", "Basic secret", "Bearer token extra", "Bearer a\nb"]) {
      const { calls, service } = backend();
      await expect(authorizeAiOperation(header, "draft", service)).rejects.toMatchObject({
        status: 401,
      });
      expect(calls).toEqual([]);
    }
    expect(() => bearerToken("Bearer " + "a".repeat(8193))).toThrow();
  });

  test("a forged or expired token cannot reserve usage", async () => {
    const { calls, service } = backend({ user: async () => null });
    await expect(
      authorizeAiOperation("Bearer forged.jwt.token", "specs", service),
    ).rejects.toMatchObject({ status: 401 });
    expect(calls).toEqual([]);
  });

  test("pending, rejected and non-company accounts cannot reserve usage", async () => {
    const { calls, service } = backend({ approvedCompany: async () => false });
    await expect(
      authorizeAiOperation("Bearer valid.token", "transcribe", service),
    ).rejects.toMatchObject({ status: 403 });
    expect(calls).toEqual(["user"]);
  });

  test("approved identity is used for the quota, never a caller-supplied user id", async () => {
    let reserved: unknown;
    const { calls, service } = backend({
      reserve: async (userId, operation) => {
        reserved = { userId, operation };
        return "reservation";
      },
    });
    expect(await authorizeAiOperation("Bearer valid.token", "draft", service)).toEqual({
      userId: "company-owner",
      requestId: "reservation",
    });
    expect(calls).toEqual(["user", "company"]);
    expect(reserved).toEqual({ userId: "company-owner", operation: "draft" });
  });

  test("quota/database failures fail closed before caller can invoke paid provider", async () => {
    const { service } = backend({
      reserve: async () => {
        throw new Error("quota exceeded");
      },
    });
    let paidCall = false;
    await expect(
      (async () => {
        await authorizeAiOperation("Bearer valid.token", "draft", service);
        paidCall = true;
      })(),
    ).rejects.toThrow("quota exceeded");
    expect(paidCall).toBe(false);
  });
});

describe("AI usage and cost reporting", () => {
  test("accounts for cached input and output with explicitly configured rates", () => {
    expect(
      estimateAiCost(
        { inputTokens: 1000, cachedInputTokens: 200, outputTokens: 100, audioSeconds: 0 },
        { inputUsdPerMillion: 2, cachedInputUsdPerMillion: 0.5, outputUsdPerMillion: 8 },
      ),
    ).toBeCloseTo(0.0025, 8);
  });

  test("unknown prices and unknown provider usage are not reported as zero cost", () => {
    expect(
      estimateAiCost(
        { inputTokens: 10, cachedInputTokens: 0, outputTokens: 5, audioSeconds: 0 },
        undefined,
      ),
    ).toBeNull();
    expect(providerUsage({ text: "unreported transcription" })).toBeNull();
    expect(
      estimateAiCost(
        { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, audioSeconds: 30 },
        { inputUsdPerMillion: 0, outputUsdPerMillion: 0 },
      ),
    ).toBeNull();
  });

  test("extracts both Responses token usage and duration-based transcription usage", () => {
    expect(
      providerUsage({
        usage: {
          input_tokens: 120,
          output_tokens: 20,
          input_tokens_details: { cached_tokens: 30 },
        },
      }),
    ).toEqual({ inputTokens: 120, cachedInputTokens: 30, outputTokens: 20, audioSeconds: 0 });
    const usage = providerUsage({ usage: { type: "duration", seconds: 30 } })!;
    expect(
      estimateAiCost(usage, {
        inputUsdPerMillion: 0,
        outputUsdPerMillion: 0,
        audioUsdPerMinute: 0.006,
      }),
    ).toBeCloseTo(0.003, 8);
  });
});
