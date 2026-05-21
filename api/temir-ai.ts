// Vercel serverless route for Temir AI.
// Standalone — does NOT import from src/ so Vercel's bundler cannot miss files.
// Local-first: always produces a useful checkers answer even with no key /
// invalid key / 401 / 429 quota. OpenAI is an optional enhancement.

// ---------- Types (mirror src/lib/temir-ai-types) ----------

const TEMIR_ROUTE_TARGETS = [
  "/play",
  "/play/ai",
  "/play/friend",
  "/learn",
  "/train",
  "/puzzles",
  "/puzzles/rush",
  "/analysis",
  "/dashboard",
  "/help",
] as const;
type TemirRouteTarget = (typeof TEMIR_ROUTE_TARGETS)[number];

const TEMIR_BOARD_DEMO_IDS = [
  "mandatory-capture",
  "backward-capture",
  "double-jump",
  "flying-king",
  "promotion-race",
  "back-rank-defense",
] as const;
type TemirBoardDemoId = (typeof TEMIR_BOARD_DEMO_IDS)[number];

type Cell = { color: "red" | "black"; type: "man" | "king" } | null;
type TemirCurrentBoardMove = {
  index: number;
  notation: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  captures: number;
  promotesToKing: boolean;
};
type TemirCurrentBoardContext = {
  board: Cell[][];
  currentTurn: "red" | "black";
  moves: TemirCurrentBoardMove[];
};
type TemirAssistantRequest = {
  message: string;
  history: Array<{ role: "user" | "ai"; content: string }>;
  currentPath: string;
  currentBoard: TemirCurrentBoardContext | null;
};
type TemirNavigateAction = {
  path: TemirRouteTarget;
  label: string;
  reason: string;
  autoOpen: boolean;
};
type TemirAssistantResponse = {
  answer: string;
  navigate: TemirNavigateAction | null;
  boardDemoId: TemirBoardDemoId | null;
  recommendedMoveIndex: number | null;
  followUpPrompt: string | null;
};

// ---------- App knowledge ----------

const APP_PAGES: Array<{ path: TemirRouteTarget; label: string; purpose: string; triggers: string[] }> = [
  { path: "/play", label: "Play lobby", purpose: "Choose between AI, local, or friend matches.", triggers: ["play", "lobby", "match", "game lobby", "start playing", "new game"] },
  { path: "/play/ai", label: "Play vs AI", purpose: "Play against the built-in checkers engine and get post-game coaching.", triggers: ["ai", "engine", "bot", "computer", "play ai", "vs ai", "play computer"] },
  { path: "/play/friend", label: "Friend rooms", purpose: "Create or join an online friend room and share an invite link.", triggers: ["friend", "friends", "room", "rooms", "online", "multiplayer", "invite"] },
  { path: "/learn", label: "Learn", purpose: "Interactive checkers lessons and rule walkthroughs.", triggers: ["learn", "lesson", "lessons", "lecture", "library", "guide", "tutorial"] },
  { path: "/train", label: "Train", purpose: "Focused drills and tactical training.", triggers: ["train", "training", "drill", "drills", "practice"] },
  { path: "/puzzles", label: "Puzzles", purpose: "Daily checkers puzzles and the puzzle archive.", triggers: ["puzzle", "puzzles", "tactic", "tactics"] },
  { path: "/puzzles/rush", label: "Puzzle Rush", purpose: "Fast tactic solving against the clock.", triggers: ["rush", "puzzle rush", "fast puzzles", "timed puzzles"] },
  { path: "/analysis", label: "Analysis", purpose: "Move-by-move match archive and review.", triggers: ["analysis", "review", "archive", "analyse", "analyze"] },
  { path: "/dashboard", label: "Dashboard", purpose: "Player dossier, game history, and coach summaries.", triggers: ["dashboard", "dossier", "stats", "profile", "summary", "history"] },
  { path: "/help", label: "Help", purpose: "Rules reference, troubleshooting, and feature explanations.", triggers: ["help", "rules", "support", "faq", "how does"] },
];

interface RuleArticle {
  keywords: string[];
  demoId?: TemirBoardDemoId;
  answer: string;
  followUp?: string;
}
const RULE_ARTICLES: RuleArticle[] = [
  { keywords: ["mandatory", "forced", "must capture", "have to capture", "obligatory"], demoId: "mandatory-capture",
    answer: "In Checker.com captures are mandatory. If any of your pieces can jump an opponent, you must play a capture instead of a quiet move. When several captures are available you may pick any of them, but you cannot ignore a capture in favor of a developing move.",
    followUp: "Want me to show a position where a quiet move is illegal because a capture exists?" },
  { keywords: ["backward", "back capture", "men capture back", "men jump back"], demoId: "backward-capture",
    answer: "Men in this ruleset (CIS / Kazakhstan-style) can capture both forward AND backward, even though they can only MOVE forward. A pawn on d4 can jump back to f2 if there is an opponent piece on e3 and f2 is empty. This is one of the most common rule surprises if you come from English draughts.",
    followUp: "Try the demo or ask me to highlight a backward capture in your current game." },
  { keywords: ["double", "multi", "chain", "multiple jump", "combo"], demoId: "double-jump",
    answer: "When you start a capture, you must keep capturing if the landing square allows another jump. Plan the LANDING square, not just the first jump — it decides whether the chain continues. Try to land on squares that either continue a chain for you or stop a chain for your opponent." },
  { keywords: ["king", "flying", "queen", "dame", "long diagonal"], demoId: "flying-king",
    answer: "Kings are flying kings here. A king travels any distance along an open diagonal and, when it captures, it can land on any empty square behind the captured piece on the same diagonal. That is why open long diagonals are extremely valuable once you have a king.",
    followUp: "Want me to show how a single king can pick off an undefended man across the board?" },
  { keywords: ["promote", "promotion", "crown", "king me", "becoming a king", "race"], demoId: "promotion-race",
    answer: "A man becomes a king the moment it stops on the opponent's back rank. In a promotion race, count tempi: who crowns first usually wins, because a fresh king dominates lone men. If you can force your opponent to spend a move blocking or capturing, you often win the race even when you look 'behind'." },
  { keywords: ["back rank", "back row", "defense", "double corner", "guard"], demoId: "back-rank-defense",
    answer: "Keep a back-rank guard as long as you can. Two pieces holding your back rank stop the opponent from quietly promoting, and they create capture threats against any king that lands behind your line. Only break the back rank when you have a concrete plan." },
  { keywords: ["rule", "rules", "how to play", "how does it work", "basics"],
    answer: "Checker.com uses CIS / Kazakhstan-style checkers on an 8x8 board, dark squares only. Men move one square diagonally forward and capture in any diagonal direction. Captures are mandatory and chain. A man crowns on the back rank into a flying king, which slides any distance along an open diagonal.",
    followUp: "Ask me about a specific rule: mandatory captures, backward capture, flying king, or promotion." },
  { keywords: ["opening", "openings", "start", "first move", "principles"],
    answer: "There is no opening theory to memorize. The healthy principles are: develop pieces toward the center, keep your back rank intact, avoid lone men on the edge, and never give the opponent a free capture that wins a tempo. Trade only when it improves YOUR structure." },
  { keywords: ["tactic", "tactics", "combination", "trap", "shot"],
    answer: "Almost every tactic in checkers comes from a forced capture you can predict. Before every move, scan: 'if I move here, what capture must my opponent make? After their forced capture, do I have another forced capture that wins material or a king?' That two-ply scan finds 80% of practical tactics.",
    followUp: "Want me to walk you through a chain-capture example on the board?" },
  { keywords: ["endgame", "ending", "kings vs", "king vs man", "few pieces"],
    answer: "In the endgame, king activity and long diagonals decide everything. A king on the long diagonal is usually worth more than two passive men. Trade men down only when you already have superior king activity." },
];

// ---------- Intent detection ----------

const ANALYSIS_PHRASES = ["best move","what should i play","what do i play","what to play","analyze","analyse","analysis of this","evaluate","recommend","suggest a move","your move","hint","help me move","what now","best line","what's the move","whats the move","what is the best"];
const POSTGAME_PHRASES = ["i won","i lost","we drew","review my game","review the game","post game","post-game","how did i play","what went wrong"];
const NAV_VERBS = ["open","go to","take me","show","navigate","switch to","where is","bring me","jump to"];

function detectIntent(message: string, currentBoard: TemirCurrentBoardContext | null) {
  const m = message.toLowerCase().trim();
  const greeting = /^(hi|hello|hey|yo|hola|salam|salem|привет|здравствуй)\b/.test(m);
  const smalltalk = /^(thanks|thank you|cool|nice|ok|okay)\b/.test(m);
  const helpRequest = /\b(help|what can you do|what do you do|who are you|capabilities)\b/.test(m);
  const wantsMoveAnalysis = !!currentBoard && ANALYSIS_PHRASES.some((p) => m.includes(p));
  const wantsPostGameCoach = POSTGAME_PHRASES.some((p) => m.includes(p));

  const hasNavVerb = NAV_VERBS.some((v) => m.includes(v));
  let best: { page: (typeof APP_PAGES)[number]; score: number } | null = null;
  for (const page of APP_PAGES) {
    for (const trigger of page.triggers) {
      if (!m.includes(trigger)) continue;
      const score = trigger.length + (hasNavVerb ? 5 : 0);
      if (!best || score > best.score) best = { page, score };
    }
  }
  const navigateTo = best && (hasNavVerb || best.score >= 7) ? { page: best.page, autoOpen: hasNavVerb } : null;

  let rule: RuleArticle | null = null;
  let ruleScore = 0;
  for (const a of RULE_ARTICLES) for (const kw of a.keywords) if (m.includes(kw) && kw.length > ruleScore) { rule = a; ruleScore = kw.length; }

  return { greeting, smalltalk, helpRequest, wantsMoveAnalysis, wantsPostGameCoach, navigateTo, rule };
}

// ---------- Heuristic move scoring ----------

const CENTER_COLS = [2, 3, 4, 5];

function scoreMove(move: TemirCurrentBoardMove, cb: TemirCurrentBoardContext) {
  const reasons: string[] = [];
  let score = 0;
  if (move.captures > 0) {
    score += 100 + move.captures * 60;
    reasons.push(move.captures === 1 ? "wins a piece with a forced jump" : `chains ${move.captures} captures in a row`);
  }
  if (move.promotesToKing) { score += 80; reasons.push("promotes to a flying king"); }
  const piece = cb.board[move.from.row]?.[move.from.col];
  if (piece && piece.type === "man") {
    const toward = piece.color === "red" ? move.from.row - move.to.row : move.to.row - move.from.row;
    if (toward > 0) { score += toward * 4; reasons.push("advances toward the crowning rank"); }
  } else if (piece && piece.type === "king") {
    if (move.to.col === move.to.row || move.to.col === 7 - move.to.row) { score += 8; reasons.push("keeps the king on a long diagonal"); }
  }
  if (CENTER_COLS.includes(move.to.col) && move.to.row >= 2 && move.to.row <= 5) { score += 6; reasons.push("fights for the center"); }
  if (move.to.col === 0 || move.to.col === 7) score -= 3;
  return { move, score, reasons };
}

function buildMoveAnalysisAnswer(cb: TemirCurrentBoardContext) {
  if (!cb.moves.length) return { answer: "There are no legal moves available — the side to move is stalemated or the game has ended. Open the analysis page to review what happened.", recommendedMoveIndex: null, followUp: null };
  const ranked = cb.moves.map((m) => scoreMove(m, cb)).sort((a, b) => b.score - a.score);
  const top = ranked[0], alt = ranked[1];
  const turn = cb.currentTurn === "red" ? "Red" : "Black";
  const isForced = ranked.filter((r) => r.move.captures > 0).length === 1 && top.move.captures > 0;
  const reasons = top.reasons.length ? top.reasons.join(", ") : "best practical balance of activity and tempo";
  const altText = alt && Math.abs(alt.score - top.score) <= 10 ? ` A reasonable alternative is ${alt.move.notation}, but I prefer ${top.move.notation} because it ${top.reasons[0] ?? "is slightly more active"}.` : "";
  const forced = isForced ? "This is a forced capture — under mandatory-capture rules you must play it." : top.move.captures > 0 ? "Captures are mandatory, so the choice is between the available jumps." : "No captures available, so you can play a developing move.";
  return { answer: `${turn} to move. I would play ${top.move.notation}: it ${reasons}. ${forced}${altText}`, recommendedMoveIndex: top.move.index, followUp: "Ask me 'why?' if you want me to walk through the candidate moves I rejected." };
}

function buildPostGameAnswer(message: string) {
  const m = message.toLowerCase();
  if (m.includes("won")) return "Nice win. Two questions: which of your moves created the decisive threat, and was there a moment your opponent could have escaped? Open Analysis to step through the game move by move — I can highlight the critical turning point.";
  if (m.includes("lost")) return "Losses are the fastest way to improve. Open Analysis and look for the first move where your evaluation flipped — usually it's a quiet move that gave the opponent a forced capture two plies later. That single moment is worth more than the whole rest of the game.";
  if (m.includes("drew")) return "Draws often come from passive king play. Next time, look for moments where you could have invaded the long diagonal instead of shuffling. Open Analysis and I'll point at the position where the game became a fortress.";
  return "Tell me the result and I will tailor the review — did you win, lose, or draw?";
}

// ---------- Local brain ----------

function runTemirLocalBrain(body: TemirAssistantRequest): TemirAssistantResponse {
  const intent = detectIntent(body.message, body.currentBoard);
  let answer = "";
  let navigate: TemirNavigateAction | null = null;
  let boardDemoId: TemirBoardDemoId | null = null;
  let recommendedMoveIndex: number | null = null;
  let followUpPrompt: string | null = null;

  if (intent.wantsMoveAnalysis && body.currentBoard) {
    const a = buildMoveAnalysisAnswer(body.currentBoard);
    answer = a.answer; recommendedMoveIndex = a.recommendedMoveIndex; followUpPrompt = a.followUp;
  } else if (intent.wantsPostGameCoach) {
    answer = buildPostGameAnswer(body.message);
    if (!intent.navigateTo) navigate = { path: "/analysis", label: "Analysis", reason: "Step through the finished game move by move.", autoOpen: false };
  } else if (intent.rule) {
    answer = intent.rule.answer;
    if (intent.rule.demoId) boardDemoId = intent.rule.demoId;
    if (intent.rule.followUp) followUpPrompt = intent.rule.followUp;
  } else if (intent.greeting || intent.helpRequest || intent.smalltalk) {
    answer = "Hi — I'm Temir, the in-app checkers coach. I can analyze the position you are playing right now, explain rules with a teaching board, recommend candidate moves, and open any section of Checker.com for you. Try: 'best move?' on a game page, 'explain backward capture', or 'open friend rooms'.";
    followUpPrompt = "What would you like to do — play, learn, solve puzzles, or review a game?";
  } else if (intent.navigateTo) {
    const { page, autoOpen } = intent.navigateTo;
    answer = `${page.label}: ${page.purpose}${autoOpen ? " Opening it now." : " Tap the action below to open it."}`;
  } else {
    answer = "I am Temir, the checkers coach inside Checker.com. I didn't catch a specific position, rule, or page in your message — try 'best move?' while a game is open, 'explain flying king', 'open puzzles', or 'review my last game'.";
    followUpPrompt = "What part of your checkers game would you like to work on?";
  }

  if (!navigate && intent.navigateTo) {
    const { page, autoOpen } = intent.navigateTo;
    navigate = { path: page.path, label: page.label, reason: page.purpose, autoOpen };
  }
  return { answer, navigate, boardDemoId, recommendedMoveIndex, followUpPrompt };
}

// ---------- Optional OpenAI enhancement ----------

async function maybeEnhanceWithOpenAi(body: TemirAssistantRequest, draft: TemirAssistantResponse): Promise<TemirAssistantResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return draft;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const HARD_BUDGET_MS = 8000;
  const SOFT_TIMEOUT_MS = 5000;
  const call = async (): Promise<TemirAssistantResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOFT_TIMEOUT_MS);
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model, temperature: 0.4, response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are Temir AI, a built-in checkers coach inside Checker.com. Refine the draft answer so it sounds like a calm tutor. Do NOT change the move, route, or demo — only refine the 'answer' wording. Reply with JSON only: {\"answer\": string}." },
            { role: "user", content: `User asked: ${body.message}\nDraft answer: ${draft.answer}\nReturn JSON: {"answer": "..."}` },
          ],
        }),
      });
      if (!resp.ok) { console.info("[Temir AI] enhancement skipped (status)", resp.status); return draft; }
      const payload: any = await resp.json().catch(() => null);
      const text: string | undefined = payload?.choices?.[0]?.message?.content;
      if (!text) return draft;
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { return draft; }
      if (typeof parsed?.answer === "string" && parsed.answer.trim()) return { ...draft, answer: parsed.answer.trim() };
      return draft;
    } catch (error) {
      console.info("[Temir AI] enhancement skipped (threw)", (error as Error)?.name ?? "error");
      return draft;
    } finally {
      clearTimeout(timeout);
    }
  };
  const budget = new Promise<TemirAssistantResponse>((resolve) => setTimeout(() => resolve(draft), HARD_BUDGET_MS));
  try { return await Promise.race([call(), budget]); } catch { return draft; }
}

// ---------- Handler ----------

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") {
    res.status(405).json({ answer: "Temir AI only accepts POST requests on this endpoint.", navigate: null, boardDemoId: null, recommendedMoveIndex: null, followUpPrompt: null });
    return;
  }
  try {
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const body: TemirAssistantRequest = {
      message: typeof raw?.message === "string" ? raw.message : "",
      history: Array.isArray(raw?.history) ? raw.history : [],
      currentPath: typeof raw?.currentPath === "string" ? raw.currentPath : "/",
      currentBoard: raw?.currentBoard ?? null,
    };
    const draft = runTemirLocalBrain(body);
    const enhanced = await maybeEnhanceWithOpenAi(body, draft);
    res.status(200).json(enhanced);
  } catch (error) {
    console.error("[Temir AI API] Unhandled error, returning local fallback:", error);
    // Even on error, return a polite local answer instead of a 500.
    res.status(200).json({
      answer: "I had trouble reading that request, but I'm still here. Try asking 'best move?' on a game page, 'explain backward capture', or 'open friend rooms'.",
      navigate: null, boardDemoId: null, recommendedMoveIndex: null, followUpPrompt: null,
    });
  }
}
