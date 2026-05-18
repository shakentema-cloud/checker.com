import {
  TEMIR_BOARD_DEMO_IDS,
  TEMIR_ROUTE_TARGETS,
  type TemirAssistantRequest,
  type TemirAssistantResponse,
  type TemirBoardDemoId,
  type TemirCurrentBoardContext,
  type TemirNavigateAction,
  type TemirRouteTarget,
} from "./temir-ai-types";

const APP_PAGES = [
  { path: "/play", purpose: "Play lobby for choosing AI, local, or friend matches." },
  { path: "/play/ai", purpose: "Play against the engine and get post-game coaching." },
  { path: "/play/friend", purpose: "Create and join friend rooms." },
  { path: "/learn", purpose: "Interactive checkers lessons." },
  { path: "/train", purpose: "Focused drills and tactical training." },
  { path: "/puzzles", purpose: "Daily checkers puzzles and puzzle archive." },
  { path: "/puzzles/rush", purpose: "Fast tactic solving against the clock." },
  { path: "/analysis", purpose: "Move-by-move match archive and review." },
  { path: "/dashboard", purpose: "Player dossier, game history, and coach summaries." },
  { path: "/help", purpose: "Rules, troubleshooting, and feature explanations." },
] as const;

const BOARD_DEMOS = [
  { id: "mandatory-capture", when: "When teaching forced captures and why quiet moves are illegal." },
  { id: "backward-capture", when: "When teaching the CIS backward-capture rule for men." },
  { id: "double-jump", when: "When teaching chain captures and landing-square planning." },
  { id: "flying-king", when: "When teaching king movement and long-diagonal capture." },
  { id: "promotion-race", when: "When teaching tempo and crowning races." },
  { id: "back-rank-defense", when: "When teaching why holding a back-rank guard matters." },
] as const;

const TEMIR_SYSTEM_PROMPT = `You are Temir AI, a live checkers-specific assistant inside Checker.com.

Your job:
- Answer like a strong checkers coach, not like a generic chatbot.
- Think carefully about rules, tactical ideas, candidate moves, piece activity, promotion races, and practical plans.
- Help users navigate Checker.com when they ask to open, go to, or show a feature.
- When useful, attach a board teaching aid:
  - If the user is asking about the CURRENT position and currentBoard is present, choose recommendedMoveIndex from currentBoard.moves.
  - If the user is asking about a concept and no current board is needed, choose boardDemoId.
- Keep answers grounded and actionable. Do not claim to see hidden board state that was not provided.

Navigation rules:
- Only set navigate when the user clearly wants to open, go to, start, or be taken to a page.
- Use only the allowed route targets.
- Set autoOpen=true only when the user is explicitly asking you to open or take them there now.

Board rules:
- Only use recommendedMoveIndex if currentBoard exists and the move index matches a current legal move.
- Only use boardDemoId from the allowed demo list.
- Do not invent routes, pages, moves, or demo ids.

Tone:
- Calm, smart, direct, and helpful.
- Prefer concrete plans over vague encouragement.
- Be concise but not robotic.
`;

function getOpenAiApiKey(env: unknown): string | null {
  if (env && typeof env === "object") {
    const value = (env as Record<string, unknown>).OPENAI_API_KEY;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  if (typeof process !== "undefined" && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  return null;
}

function getOpenAiModel(env: unknown): string {
  if (env && typeof env === "object") {
    const value = (env as Record<string, unknown>).OPENAI_MODEL;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  if (typeof process !== "undefined" && typeof process.env.OPENAI_MODEL === "string" && process.env.OPENAI_MODEL.trim()) {
    return process.env.OPENAI_MODEL.trim();
  }
  return "gpt-4.1-mini";
}

function buildCurrentBoardSummary(currentBoard: TemirCurrentBoardContext | null): string {
  if (!currentBoard) return "No current board context is available.";
  return JSON.stringify({
    currentTurn: currentBoard.currentTurn,
    moves: currentBoard.moves,
    board: currentBoard.board.map((row) =>
      row.map((cell) => (cell ? `${cell.color[0]}-${cell.type[0]}` : null)),
    ),
  });
}

function buildUserPrompt(body: TemirAssistantRequest): string {
  const trimmedHistory = body.history.slice(-8);
  return [
    `Current route: ${body.currentPath}`,
    `Available app pages: ${JSON.stringify(APP_PAGES)}`,
    `Allowed board demo ids: ${JSON.stringify(BOARD_DEMOS)}`,
    `Recent conversation: ${JSON.stringify(trimmedHistory)}`,
    `Current board context: ${buildCurrentBoardSummary(body.currentBoard)}`,
    `User request: ${body.message}`,
    `Return JSON only.`,
  ].join("\n\n");
}

function responseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: { type: "string" },
      navigate: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              path: { type: "string", enum: [...TEMIR_ROUTE_TARGETS] },
              label: { type: "string" },
              reason: { type: "string" },
              autoOpen: { type: "boolean" },
            },
            required: ["path", "label", "reason", "autoOpen"],
          },
        ],
      },
      boardDemoId: {
        anyOf: [
          { type: "null" },
          { type: "string", enum: [...TEMIR_BOARD_DEMO_IDS] },
        ],
      },
      recommendedMoveIndex: {
        anyOf: [
          { type: "null" },
          { type: "integer", minimum: 0 },
        ],
      },
      followUpPrompt: {
        anyOf: [
          { type: "null" },
          { type: "string" },
        ],
      },
    },
    required: ["answer", "navigate", "boardDemoId", "recommendedMoveIndex", "followUpPrompt"],
  };
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const textParts: string[] = [];
  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function sanitizeNavigateAction(value: unknown): TemirNavigateAction | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (!TEMIR_ROUTE_TARGETS.includes(candidate.path as TemirRouteTarget)) return null;
  return {
    path: candidate.path as TemirRouteTarget,
    label: typeof candidate.label === "string" ? candidate.label : "Open page",
    reason: typeof candidate.reason === "string" ? candidate.reason : "",
    autoOpen: candidate.autoOpen === true,
  };
}

function sanitizeAssistantResponse(
  payload: any,
  currentBoard: TemirCurrentBoardContext | null,
): TemirAssistantResponse {
  const navigate = sanitizeNavigateAction(payload?.navigate);
  const boardDemoId = TEMIR_BOARD_DEMO_IDS.includes(payload?.boardDemoId as TemirBoardDemoId)
    ? (payload.boardDemoId as TemirBoardDemoId)
    : null;
  const maxMoveIndex = currentBoard ? currentBoard.moves.length - 1 : -1;
  const recommendedMoveIndex =
    typeof payload?.recommendedMoveIndex === "number" &&
    Number.isInteger(payload.recommendedMoveIndex) &&
    payload.recommendedMoveIndex >= 0 &&
    payload.recommendedMoveIndex <= maxMoveIndex
      ? payload.recommendedMoveIndex
      : null;

  return {
    answer:
      typeof payload?.answer === "string" && payload.answer.trim()
        ? payload.answer.trim()
        : "I could not complete that analysis clearly. Try asking again with the position, theme, or page you want help with.",
    navigate,
    boardDemoId,
    recommendedMoveIndex,
    followUpPrompt:
      typeof payload?.followUpPrompt === "string" && payload.followUpPrompt.trim()
        ? payload.followUpPrompt.trim()
        : null,
  };
}

export async function handleTemirAiRequest(
  body: TemirAssistantRequest,
  env: unknown,
): Promise<TemirAssistantResponse> {
  const apiKey = getOpenAiApiKey(env);
  if (!apiKey) {
    return {
      answer:
        "Temir AI is not configured on this deployment yet. Add OPENAI_API_KEY on the server to enable live analysis, navigation help, and board teaching.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: "After the API key is configured, ask me about a position, tactic, or page to open.",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAiModel(env),
      instructions: TEMIR_SYSTEM_PROMPT,
      input: buildUserPrompt(body),
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "temir_ai_response",
          strict: true,
          schema: responseSchema(),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Temir AI] OpenAI error:", response.status, errorText);
    return {
      answer:
        "Temir AI hit a server problem while thinking through that. Please try again in a moment, or ask a slightly more specific checkers question.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: null,
    };
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) {
    return {
      answer:
        "Temir AI did not return a usable answer this time. Try asking again with a move, position, route, or concept.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: null,
    };
  }

  try {
    return sanitizeAssistantResponse(JSON.parse(outputText), body.currentBoard);
  } catch (error) {
    console.error("[Temir AI] Failed to parse structured output:", error, outputText);
    return {
      answer:
        "Temir AI thought about that, but the response format came back invalid. Please try again with a shorter request.",
      navigate: null,
      boardDemoId: null,
      recommendedMoveIndex: null,
      followUpPrompt: null,
    };
  }
}
