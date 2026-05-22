import { createFileRoute } from "@tanstack/react-router";

import { handleTemirAiRequest } from "@/lib/temir-ai-server";
import type { TemirAssistantRequest } from "@/lib/temir-ai-types";

export const Route = createFileRoute("/api/temir-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: TemirAssistantRequest;
        try {
          body = (await request.json()) as TemirAssistantRequest;
        } catch {
          return new Response(
            JSON.stringify({
              answer: "Temir AI could not read your message. Please try again.",
              navigate: null,
              boardDemoId: null,
              recommendedMoveIndex: null,
              followUpPrompt: null,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        const response = await handleTemirAiRequest(body, process.env);
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
    },
  },
});
