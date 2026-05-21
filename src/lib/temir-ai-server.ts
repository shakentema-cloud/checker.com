// Cloudflare Worker entrypoint for the Temir AI API.
// Local-first brain always runs and produces a valid response.
// OpenAI is optional — any failure (missing key, 401, 429 quota,
// network) is silently swallowed and the local answer is returned.

import {
  maybeEnhanceWithOpenAi,
  runTemirLocalBrain,
  sanitizeResponse,
  type OpenAiConfig,
} from "./temir-ai-brain";
import type { TemirAssistantRequest, TemirAssistantResponse } from "./temir-ai-types";

function getEnvString(env: unknown, key: string): string | null {
  if (env && typeof env === "object") {
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (typeof process !== "undefined" && process.env && typeof process.env[key] === "string") {
    const value = process.env[key] as string;
    if (value.trim()) return value.trim();
  }
  return null;
}

function buildOpenAiConfig(env: unknown): OpenAiConfig | null {
  const apiKey = getEnvString(env, "OPENAI_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    model: getEnvString(env, "OPENAI_MODEL") ?? "gpt-4o-mini",
    timeoutMs: 5000,
  };
}

export async function handleTemirAiRequest(
  body: TemirAssistantRequest,
  env: unknown,
): Promise<TemirAssistantResponse> {
  const safeBody: TemirAssistantRequest = {
    message: typeof body?.message === "string" ? body.message : "",
    history: Array.isArray(body?.history) ? body.history : [],
    currentPath: typeof body?.currentPath === "string" ? body.currentPath : "/",
    currentBoard: body?.currentBoard ?? null,
  };

  const draft = runTemirLocalBrain(safeBody);
  let enhanced = draft;
  try {
    const openAiConfig = buildOpenAiConfig(env);
    enhanced = await maybeEnhanceWithOpenAi(safeBody, draft, openAiConfig);
  } catch {
    enhanced = draft;
  }
  try {
    return sanitizeResponse(enhanced, safeBody.currentBoard);
  } catch {
    return sanitizeResponse(draft, safeBody.currentBoard);
  }
}
