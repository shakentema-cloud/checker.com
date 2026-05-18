// Temir AI — local-first checkers brain.
// Pure, dependency-free reasoning that always works, even with no OpenAI key,
// no quota, or no network. The server endpoints use this as the primary brain
// and may optionally enrich the `answer` field via an external model.

import {
  TEMIR_BOARD_DEMO_IDS,
  TEMIR_ROUTE_TARGETS,
  type TemirAssistantRequest,
  type TemirAssistantResponse,
  type TemirBoardDemoId,
  type TemirCurrentBoardContext,
  type TemirCurrentBoardMove,
  type TemirNavigateAction,
  type TemirRouteTarget,
} from "./temir-ai-types";

// ---------- App knowledge ----------

interface PageInfo {
  path: TemirRouteTarget;
  label: string;
  purpose: string;
  triggers: string[];
}

const APP_PAGES: PageInfo[] = [
  {
    path: "/play",
    label: "Play lobby",
    purpose: "Choose between AI, local, or friend matches.",
    triggers: ["play", "lobby", "match", "game lobby", "start playing", "new game"],
  },
  {
    path: "/play/ai",
    label: "Play vs AI",
    purpose: "Play against the built-in checkers engine and get post-game coaching.",
    triggers: ["ai", "engine", "bot", "computer", "play ai", "vs ai", "play computer"],
  },
  {
    path: "/play/friend",
    label: "Friend rooms",
    purpose: "Create or join an online friend room and share an invite link.",
    triggers: ["friend", "friends", "room", "rooms", "online", "multiplayer", "invite"],
  },
  {
    path: "/learn",
    label: "Learn",
    purpose: "Interactive checkers lessons and rule walkthroughs.",
    triggers: ["learn", "lesson", "lessons", "lecture", "library", "guide", "tutorial"],
  },
  {
    path: "/train",
    label: "Train",
    purpose: "Focused drills and tactical training.",
    triggers: ["train", "training", "drill", "drills", "practice"],
  },
  {
    path: "/puzzles",
    label: "Puzzles",
    purpose: "Daily checkers puzzles and the puzzle archive.",
    triggers: ["puzzle", "puzzles", "tactic", "tactics"],
  },
  {
    path: "/puzzles/rush",
    label: "Puzzle Rush",
    purpose: "Fast tactic solving against the clock.",
    triggers: ["rush", "puzzle rush", "fast puzzles", "timed puzzles"],
  },
  {
    path: "/analysis",
    label: "Analysis",
    purpose: "Move-by-move match archive and review.",
    triggers: ["analysis", "review", "archive", "analyse", "analyze"],
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    purpose: "Player dossier, game history, and coach summaries.",
    triggers: ["dashboard", "dossier", "stats", "profile", "summary", "history"],
  },
  {
    path: "/help",
    label: "Help",
    purpose: "Rules reference, troubleshooting, and feature explanations.",
    triggers: ["help", "rules", "support", "faq", "how does"],
  },
];

// ---------- Knowledge base ----------

interface RuleArticle {
  id: string;
  keywords: string[];
  demoId?: TemirBoardDemoId;
  answer: string;
  followUp?: string;
}

const RULE_ARTICLES: RuleArticle[] = [
  {
    id: "mandatory-capture",
    keywords: ["mandatory", "forced", "must capture", "have to capture", "obligatory"],
    demoId: "mandatory-capture",
    answer:
      "In Checker.com captures are mandatory. If any of your pieces can jump an opponent, you must play a capture instead of a quiet move. When several captures are available you may pick any of them, but you cannot ignore a capture in favor of a developing move.",
    followUp: "Want me to show a position where a quiet move is illegal because a capture exists?",
  },
  {
    id: "backward-capture",
    keywords: ["backward", "back capture", "men capture back", "men jump back"],
    demoId: "backward-capture",
    answer:
      "Men in this ruleset (CIS / Kazakhstan-style) can capture both forward AND backward, even though they can only MOVE forward. A pawn standing on d4 can jump back to f2 if there is an opponent piece on e3 and f2 is empty. This is one of the most common rule surprises if you come from English draughts.",
    followUp: "Try the demo or ask me to highlight a backward capture in your current game.",
  },
  {
    id: "double-jump",
    keywords: ["double", "multi", "chain", "multiple jump", "combo"],
    demoId: "double-jump",
    answer:
      "When you start a capture, you must keep capturing if the landing square allows another jump. Plan the LANDING square, not just the first jump — that is what decides whether the chain continues. Try to land on squares that either continue a chain for you or stop a chain for your opponent.",
  },
  {
    id: "flying-king",
    keywords: ["king", "flying", "queen", "dame", "long diagonal"],
    demoId: "flying-king",
    answer:
      "Kings are flying kings here. A king travels any distance along an open diagonal and, when it captures, it can land on any empty square behind the captured piece on the same diagonal. That is why open long diagonals are extremely valuable once you have a king.",
    followUp: "Want me to show how a single king can pick off an undefended man across the board?",
  },
  {
    id: "promotion",
    keywords: ["promote", "promotion", "crown", "king me", "becoming a king", "race"],
    demoId: "promotion-race",
    answer:
      "A man becomes a king the moment it stops on the opponent's back rank. In a promotion race, count tempi: who crowns first usually wins, because a fresh king dominates lone men. If you can force your opponent to spend a move blocking or capturing, you often win the race even when you look 'behind'.",
  },
  {
    id: "back-rank",
    keywords: ["back rank", "back row", "defense", "double corner", "guard"],
    demoId: "back-rank-defense",
    answer:
      "Keep a back-rank guard as long as you can. Two pieces holding your back rank stop the opponent from quietly promoting, and they also create capture threats against any king that lands behind your line. Only break the back rank when you have a concrete plan, not just to advance.",
  },
  {
    id: "rules-general",
    keywords: ["rule", "rules", "how to play", "how does it work", "basics"],
    answer:
      "Checker.com uses CIS / Kazakhstan-style checkers on an 8x8 board, dark squares only. Men move one square diagonally forward and capture in any diagonal direction. Captures are mandatory and chain. A man crowns on the back rank into a flying king, which slides any distance along an open diagonal.",
    followUp: "Ask me about a specific rule: mandatory captures, backward capture, flying king, or promotion.",
  },
  {
    id: "openings",
    keywords: ["opening", "openings", "start", "first move", "principles"],
    answer:
      "There is no opening theory you need to memorize. The healthy principles are: develop pieces toward the center, keep your back rank intact, avoid making lone men on the edge, and never give the opponent a free capture that wins a tempo. Trade only when it improves YOUR structure.",
  },
  {
    id: "tactics",
    keywords: ["tactic", "tactics", "combination", "trap", "shot"],
    answer:
      "Almost every tactic in checkers comes from a forced capture you can predict. Before every move, scan: 'if I move here, what capture must my opponent make? After their forced capture, do I have another forced capture that wins material or a king?' That two-ply scan finds 80% of practical tactics.",
    followUp: "Want me to walk you through a chain-capture example on the board?",
  },
  {
    id: "endgame",
    keywords: ["endgame", "ending", "kings vs", "king vs man", "few pieces"],
    answer:
      "In the endgame, king activity and long diagonals decide everything. A king on the long diagonal is usually worth more than two passive men. With king vs king + man you usually need to push toward the corner the long diagonal points away from. Trade men down only when you already have superior king activity.",
  },
];

// ---------- Intent detection ----------

interface DetectedIntent {
  greeting: boolean;
  smalltalk: boolean;
  helpRequest: boolean;
  wantsMoveAnalysis: boolean;
  wantsPostGameCoach: boolean;
  navigateTo: { page: PageInfo; autoOpen: boolean } | null;
  rule: RuleArticle | null;
}

const ANALYSIS_PHRASES = [
  "best move",
  "what should i play",
  "what do i play",
  "what to play",
  "analyze",
  "analyse",
  "analysis of this",
  "evaluate",
  "recommend",
  "suggest a move",
  "your move",
  "hint",
  "help me move",
  "what now",
  "best line",
  "what's the move",
  "whats the move",
  "what is the best",
];

const POSTGAME_PHRASES = [
  "i won",
  "i lost",
  "we drew",
  "review my game",
  "review the game",
  "post game",
  "post-game",
  "how did i play",
  "what went wrong",
];

const NAV_VERBS = ["open", "go to", "take me", "show", "navigate", "switch to", "where is", "bring me", "jump to"];

function detectIntent(message: string, currentBoard: TemirCurrentBoardContext | null): DetectedIntent {
  const m = message.toLowerCase().trim();

  const greeting = /^(hi|hello|hey|yo|hola|salam|salem|привет|здравствуй)\b/.test(m);
  const smalltalk = /^(thanks|thank you|cool|nice|ok|okay)\b/.test(m);
  const helpRequest = /\b(help|what can you do|what do you do|who are you|capabilities)\b/.test(m);

  const wantsMoveAnalysis =
    !!currentBoard && ANALYSIS_PHRASES.some((p) => m.includes(p));

  const wantsPostGameCoach = POSTGAME_PHRASES.some((p) => m.includes(p));

  // Navigation: explicit verb + trigger, or strong trigger alone.
  let navigateTo: DetectedIntent["navigateTo"] = null;
  const hasNavVerb = NAV_VERBS.some((v) => m.includes(v));
  let best: { page: PageInfo; score: number } | null = null;
  for (const page of APP_PAGES) {
    for (const trigger of page.triggers) {
      if (!m.includes(trigger)) continue;
      const score = trigger.length + (hasNavVerb ? 5 : 0);
      if (!best || score > best.score) best = { page, score };
    }
  }
  if (best && (hasNavVerb || best.score >= 7)) {
    navigateTo = { page: best.page, autoOpen: hasNavVerb };
  }

  // Rule lookup
  let rule: RuleArticle | null = null;
  let ruleScore = 0;
  for (const article of RULE_ARTICLES) {
    for (const kw of article.keywords) {
      if (m.includes(kw) && kw.length > ruleScore) {
        rule = article;
        ruleScore = kw.length;
      }
    }
  }

  return { greeting, smalltalk, helpRequest, wantsMoveAnalysis, wantsPostGameCoach, navigateTo, rule };
}

// ---------- Heuristic move evaluation ----------

interface ScoredMove {
  move: TemirCurrentBoardMove;
  score: number;
  reasons: string[];
}

const CENTER_COLS = [2, 3, 4, 5];

function scoreMove(
  move: TemirCurrentBoardMove,
  currentBoard: TemirCurrentBoardContext,
): ScoredMove {
  const reasons: string[] = [];
  let score = 0;

  // Captures are mandatory in this app, so all `moves` are either all captures or all quiet.
  if (move.captures > 0) {
    score += 100 + move.captures * 60;
    reasons.push(
      move.captures === 1
        ? "wins a piece with a forced jump"
        : `chains ${move.captures} captures in a row`,
    );
  }

  if (move.promotesToKing) {
    score += 80;
    reasons.push("promotes to a flying king");
  }

  // Tempo toward promotion (rows are 0 top, 7 bottom).
  const piece = currentBoard.board[move.from.row]?.[move.from.col];
  if (piece && piece.type === "man") {
    const towardCrown = piece.color === "red" ? move.from.row - move.to.row : move.to.row - move.from.row;
    if (towardCrown > 0) {
      score += towardCrown * 4;
      reasons.push("advances toward the crowning rank");
    }
  } else if (piece && piece.type === "king") {
    // King activity: prefer staying on long diagonals (col === row or col === 7 - row).
    if (move.to.col === move.to.row || move.to.col === 7 - move.to.row) {
      score += 8;
      reasons.push("keeps the king on a long diagonal");
    }
  }

  // Center control
  if (CENTER_COLS.includes(move.to.col) && move.to.row >= 2 && move.to.row <= 5) {
    score += 6;
    reasons.push("fights for the center");
  }

  // Edge penalty
  if (move.to.col === 0 || move.to.col === 7) {
    score -= 3;
  }

  return { move, score, reasons };
}

function rankMoves(currentBoard: TemirCurrentBoardContext): ScoredMove[] {
  return currentBoard.moves
    .map((m) => scoreMove(m, currentBoard))
    .sort((a, b) => b.score - a.score);
}

// ---------- Answer builders ----------

function buildMoveAnalysisAnswer(currentBoard: TemirCurrentBoardContext): {
  answer: string;
  recommendedMoveIndex: number | null;
  followUp: string | null;
} {
  if (!currentBoard.moves.length) {
    return {
      answer:
        "There are no legal moves available in the current position — the side to move is either stalemated or the game has ended. Open the analysis page if you want to review what happened.",
      recommendedMoveIndex: null,
      followUp: null,
    };
  }

  const ranked = rankMoves(currentBoard);
  const top = ranked[0];
  const alt = ranked[1];
  const turnLabel = currentBoard.currentTurn === "red" ? "Red" : "Black";
  const isForced = ranked.filter((r) => r.move.captures > 0).length === 1 && top.move.captures > 0;

  const reasons = top.reasons.length
    ? top.reasons.join(", ")
    : "best practical balance of activity and tempo";

  const altText =
    alt && Math.abs(alt.score - top.score) <= 10
      ? ` A reasonable alternative is ${alt.move.notation}, but I prefer ${top.move.notation} because it ${top.reasons[0] ?? "is slightly more active"}.`
      : "";

  const forcedText = isForced
    ? "This is a forced capture — under mandatory-capture rules you must play it."
    : top.move.captures > 0
      ? "Captures are mandatory, so the choice is between the available jumps."
      : "No captures are available, so you can play a developing move.";

  return {
    answer: `${turnLabel} to move. I would play ${top.move.notation}: it ${reasons}. ${forcedText}${altText}`,
    recommendedMoveIndex: top.move.index,
    followUp: "Ask me 'why?' if you want me to walk through the candidate moves I rejected.",
  };
}

function buildPostGameAnswer(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("won")) {
    return "Nice win. Two questions worth asking yourself: which of your moves created the decisive threat, and was there a moment your opponent could have escaped? Open Analysis to step through the game move by move — I can highlight the critical turning point.";
  }
  if (m.includes("lost")) {
    return "Losses are the fastest way to improve. Open Analysis and look for the first move where your evaluation flipped — usually it is a quiet move that gave the opponent a forced capture two plies later. That single moment is worth more practice than the whole rest of the game.";
  }
  if (m.includes("drew")) {
    return "Draws often come from passive king play. Next time, look for moments where you could have invaded the long diagonal instead of shuffling. Open Analysis and I can point at the position where the game became a fortress.";
  }
  return "Tell me the result and I will tailor the review — did you win, lose, or draw?";
}

// ---------- Public API: local brain ----------

export function runTemirLocalBrain(body: TemirAssistantRequest): TemirAssistantResponse {
  const intent = detectIntent(body.message, body.currentBoard);

  let answer = "";
  let navigate: TemirNavigateAction | null = null;
  let boardDemoId: TemirBoardDemoId | null = null;
  let recommendedMoveIndex: number | null = null;
  let followUpPrompt: string | null = null;

  // 1) Live move analysis takes priority when a board is on screen.
  if (intent.wantsMoveAnalysis && body.currentBoard) {
    const analysis = buildMoveAnalysisAnswer(body.currentBoard);
    answer = analysis.answer;
    recommendedMoveIndex = analysis.recommendedMoveIndex;
    followUpPrompt = analysis.followUp;
  }

  // 2) Post-game coach
  else if (intent.wantsPostGameCoach) {
    answer = buildPostGameAnswer(body.message);
    if (!intent.navigateTo) {
      navigate = {
        path: "/analysis",
        label: "Analysis",
        reason: "Step through the finished game move by move.",
        autoOpen: false,
      };
    }
  }

  // 3) Rule / concept explanation
  else if (intent.rule) {
    answer = intent.rule.answer;
    if (intent.rule.demoId) boardDemoId = intent.rule.demoId;
    if (intent.rule.followUp) followUpPrompt = intent.rule.followUp;
  }

  // 4) Greetings / help
  else if (intent.greeting || intent.helpRequest || intent.smalltalk) {
    answer =
      "Hi — I'm Temir, the in-app checkers coach. I can analyze the position you are playing right now, explain rules with a teaching board, recommend candidate moves, and open any section of Checker.com for you. Try: 'best move?' on a game page, 'explain backward capture', or 'open friend rooms'.";
    followUpPrompt = "What would you like to do — play, learn, solve puzzles, or review a game?";
  }

  // 5) Pure navigation request (no rule keyword)
  else if (intent.navigateTo) {
    const { page, autoOpen } = intent.navigateTo;
    answer = `${page.label}: ${page.purpose}${autoOpen ? " Opening it now." : " Tap the action below to open it."}`;
  } else {
    // 6) Generic fallback: still useful, still on-brand.
    answer =
      "I am Temir, the checkers coach inside Checker.com. I did not catch a specific position, rule, or page in your message — try asking 'best move?' while a game is open, 'explain flying king', 'open puzzles', or 'review my last game' and I will take it from there.";
    followUpPrompt = "What part of your checkers game would you like to work on?";
  }

  // Attach navigation if intent picked one and we did not already set it.
  if (!navigate && intent.navigateTo) {
    const { page, autoOpen } = intent.navigateTo;
    navigate = {
      path: page.path,
      label: page.label,
      reason: page.purpose,
      autoOpen,
    };
  }

  return { answer, navigate, boardDemoId, recommendedMoveIndex, followUpPrompt };
}

// ---------- Optional OpenAI enhancement ----------

function buildSystemPrompt(): string {
  return `You are Temir AI, a built-in checkers coach inside Checker.com. Speak briefly, like a calm tutor. Improve the draft answer the local brain produced. Do NOT change the recommended move, route, or demo — only refine the wording of the "answer" field to feel more human and concrete. Reply with JSON only: {"answer": string}.`;
}

function buildEnhancePrompt(body: TemirAssistantRequest, draft: TemirAssistantResponse): string {
  const board = body.currentBoard
    ? `currentTurn=${body.currentBoard.currentTurn}, legalMoves=${body.currentBoard.moves.length}`
    : "no live board";
  return [
    `User asked: ${body.message}`,
    `Board: ${board}`,
    `Route: ${body.currentPath}`,
    `Draft answer: ${draft.answer}`,
    `Recommended move index: ${draft.recommendedMoveIndex ?? "none"}`,
    `Navigate target: ${draft.navigate?.path ?? "none"}`,
    `Demo: ${draft.boardDemoId ?? "none"}`,
    `Return JSON: {"answer": "..."}`,
  ].join("\n");
}

export interface OpenAiConfig {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}

export async function maybeEnhanceWithOpenAi(
  body: TemirAssistantRequest,
  draft: TemirAssistantResponse,
  config: OpenAiConfig | null,
): Promise<TemirAssistantResponse> {
  if (!config?.apiKey) return draft;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 6000);
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model ?? "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildEnhancePrompt(body, draft) },
        ],
      }),
    }).finally(() => clearTimeout(timeout));

    if (!resp.ok) {
      console.warn("[Temir AI] OpenAI enhancement failed:", resp.status);
      return draft;
    }
    const payload: any = await resp.json();
    const text: string | undefined = payload?.choices?.[0]?.message?.content;
    if (!text) return draft;
    const parsed = JSON.parse(text);
    if (typeof parsed?.answer === "string" && parsed.answer.trim()) {
      return { ...draft, answer: parsed.answer.trim() };
    }
    return draft;
  } catch (error) {
    console.warn("[Temir AI] OpenAI enhancement threw, using local answer:", error);
    return draft;
  }
}

// ---------- Sanitization helpers ----------

export function sanitizeResponse(
  raw: TemirAssistantResponse,
  currentBoard: TemirCurrentBoardContext | null,
): TemirAssistantResponse {
  const navigate =
    raw.navigate && TEMIR_ROUTE_TARGETS.includes(raw.navigate.path) ? raw.navigate : null;
  const boardDemoId =
    raw.boardDemoId && TEMIR_BOARD_DEMO_IDS.includes(raw.boardDemoId) ? raw.boardDemoId : null;
  const maxIdx = currentBoard ? currentBoard.moves.length - 1 : -1;
  const recommendedMoveIndex =
    typeof raw.recommendedMoveIndex === "number" &&
    raw.recommendedMoveIndex >= 0 &&
    raw.recommendedMoveIndex <= maxIdx
      ? raw.recommendedMoveIndex
      : null;
  return {
    answer: raw.answer?.trim() || "I am here and ready to help with your checkers question.",
    navigate,
    boardDemoId,
    recommendedMoveIndex,
    followUpPrompt: raw.followUpPrompt?.trim() ? raw.followUpPrompt.trim() : null,
  };
}
