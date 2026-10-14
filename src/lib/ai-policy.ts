export type AiOperation = "draft" | "specs" | "transcribe";

export class AiAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AiAccessError";
  }
}

export function bearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer ([A-Za-z0-9._~-]+)$/i);
  if (!match || match[1].length > 8192) {
    throw new AiAccessError("Entre na sua conta para usar a assistência de IA.", 401);
  }
  return match[1];
}

export type AiAuthorizationBackend = {
  user: (token: string) => Promise<{ id: string } | null>;
  approvedCompany: (userId: string) => Promise<boolean>;
  reserve: (userId: string, operation: AiOperation) => Promise<string>;
};

// Ordering is part of the security boundary: no quota reservation or paid call before identity
// and company approval have been checked. The database also checks approval when reserving.
export async function authorizeAiOperation(
  header: string | undefined,
  operation: AiOperation,
  backend: AiAuthorizationBackend,
) {
  const user = await backend.user(bearerToken(header));
  if (!user) throw new AiAccessError("Sua sessão expirou. Entre novamente.", 401);
  if (!(await backend.approvedCompany(user.id))) {
    throw new AiAccessError("A assistência de IA está disponível para empresas aprovadas.", 403);
  }
  const requestId = await backend.reserve(user.id, operation);
  return { userId: user.id, requestId };
}

export type AiUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  audioSeconds: number;
};

export type AiPrice = {
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion?: number;
  outputUsdPerMillion: number;
  audioUsdPerMinute?: number;
};

export function estimateAiCost(usage: AiUsage, price: AiPrice | undefined): number | null {
  if (!price) return null;
  if (usage.audioSeconds > 0 && price.audioUsdPerMinute === undefined) return null;
  return (
    ((usage.inputTokens - usage.cachedInputTokens) * price.inputUsdPerMillion +
      usage.cachedInputTokens * (price.cachedInputUsdPerMillion ?? price.inputUsdPerMillion) +
      usage.outputTokens * price.outputUsdPerMillion) /
      1_000_000 +
    (usage.audioSeconds / 60) * (price.audioUsdPerMinute ?? 0)
  );
}

export function providerUsage(response: unknown): AiUsage | null {
  const value = response as {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      input_tokens_details?: { cached_tokens?: number };
      type?: string;
      seconds?: number;
    };
  };
  const usage = value.usage;
  if (!usage) return null;
  return {
    inputTokens: usage?.input_tokens ?? 0,
    cachedInputTokens: usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    audioSeconds: usage?.type === "duration" ? (usage.seconds ?? 0) : 0,
  };
}
