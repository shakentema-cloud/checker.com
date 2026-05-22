import { createServerFn } from "@tanstack/react-start";

import { handleTemirAiRequest } from "./temir-ai-server";
import type { TemirAssistantRequest, TemirAssistantResponse } from "./temir-ai-types";

export const askTemirAi = createServerFn({ method: "POST" })
  .inputValidator((data: TemirAssistantRequest) => data)
  .handler(async ({ data }): Promise<TemirAssistantResponse> => {
    return handleTemirAiRequest(data, process.env);
  });
