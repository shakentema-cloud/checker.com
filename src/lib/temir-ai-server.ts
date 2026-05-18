// Cloudflare Worker entrypoint for the Temir AI API.
// Strategy: local-first brain always runs and produces a valid response.
// OpenAI is an optional enhancement layer — any failure (missing key, 401,
// 429 quota, network error) is silently swallowed and the local answer is
// returned instead, so the user never sees a broken assistant.

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
    timeoutMs: 6000,
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
  const openAiConfig = buildOpenAiConfig(env);
  const enhanced = await maybeEnhanceWithOpenAi(safeBody, draft, openAiConfig);
  return sanitizeResponse(enhanced, safeBody.currentBoard);
}
