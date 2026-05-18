import { handleTemirAiRequest } from "../src/lib/temir-ai-server";
import type { TemirAssistantRequest } from "../src/lib/temir-ai-types";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({
      answer: "Temir AI only accepts POST requests on this endpoint.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: null,
    });
    return;
  }

  try {
    const body =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as TemirAssistantRequest)
        : (req.body as TemirAssistantRequest);

    const result = await handleTemirAiRequest(body, process.env);
    res.status(200).json(result);
  } catch (error) {
    console.error("[Temir AI API] Unhandled error:", error);
    res.status(500).json({
      answer:
        "Temir AI hit a server error before it could answer. Check the deployment logs and verify OPENAI_API_KEY is configured on Vercel.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: null,
    });
  }
}
