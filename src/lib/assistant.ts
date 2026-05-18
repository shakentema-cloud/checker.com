export interface AssistantChatMessage {
  role: "user" | "ai";
  content: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function lastUserTopic(history: AssistantChatMessage[]): string | null {
  const previousUserMessages = history.filter((message) => message.role === "user");
  if (previousUserMessages.length < 2) return null;
  return previousUserMessages[previousUserMessages.length - 2]?.content ?? null;
}

export function getGrandmasterAssistantReply(
  question: string,
  history: AssistantChatMessage[] = [],
): string {
  const q = normalize(question);
  const previousTopic = lastUserTopic(history);

  if (!q) {
    return "Ask me anything about checkers, tactics, rules, openings, endgames, or how to use Checker.com, and I will break it down clearly.";
  }

  if (includesAny(q, ["hello", "hi", "hey", "greetings", "good morning", "good evening"])) {
    return "Hello. Ask me about a position, a rule, an opening plan, an endgame, or any feature on Checker.com, and I will help step by step.";
  }

  if (includesAny(q, ["who are you", "what are you", "what can you do", "help me", "capabilities"])) {
    return "I am your Grandmaster AI guide for Checker.com. I can explain rules, analyze tactical ideas, give training advice, suggest plans in openings and endgames, and point you to the right section of the site for practice.";
  }

  if (includesAny(q, ["how to play", "how do i play", "teach me", "beginner", "new player"])) {
    return "Start with four checks on every move: 1. Is a capture mandatory? 2. Can my opponent capture back? 3. Am I moving toward promotion? 4. Am I weakening my back rank? If you are new, begin with Learn for lessons, Train for drills, then Puzzles for tactical pattern practice.";
  }

  if (includesAny(q, ["rule", "rules", "legal move", "illegal", "mandatory capture", "must capture"])) {
    return "On this app, captures are mandatory. Before any quiet move, check whether one of your pieces can jump. If a capture exists, you must take it, and if the same piece can keep capturing after it lands, that multi-jump sequence must continue.";
  }

  if (includesAny(q, ["backward", "cis", "kazakhstan", "can men capture backwards"])) {
    return "Yes. In this Checker.com ruleset, regular men can capture backward, not just forward. That means you should scan all four diagonal capture directions before every move because a square that looks safe in standard English play may still be vulnerable here.";
  }

  if (includesAny(q, ["king", "kings", "promotion", "promote", "crown", "flying king"])) {
    return "Promotion changes the game. A man becomes a king on the far rank, and kings are strongest when they control long diagonals. On this app, kings are flying kings, so they can travel across empty diagonal squares and attack from distance. In practice, protect your path to promotion and do not let your own back rank collapse too early.";
  }

  if (includesAny(q, ["opening", "openings", "first moves", "start of game"])) {
    return "In the opening, fight for the center, develop without overextending, and keep enough back-rank defenders so you do not gift an easy king later. A good simple rule is: improve piece activity first, avoid edge congestion, and never ignore a tactical capture just to follow a plan.";
  }

  if (includesAny(q, ["middlegame", "strategy", "plan", "positional"])) {
    return "In the middlegame, compare three things: material, mobility, and promotion threats. Strong plans usually come from restricting the opponent's best piece, forcing them toward the edge, and keeping your own pieces connected so any trade leaves you with the more active formation.";
  }

  if (includesAny(q, ["tactic", "tactics", "combination", "sacrifice", "trap", "fork", "double jump", "multi jump"])) {
    return "Most winning tactics in checkers come from forcing a bad landing square. Look for captures that open a second jump, sacrifices that clear a diagonal, and moves that leave the opponent with only one legal reply. If you want, describe the position and I can help you calculate it move by move.";
  }

  if (includesAny(q, ["endgame", "endgames", "late game", "one king", "two kings"])) {
    return "In the endgame, tempi and diagonals matter more than flashy tactics. Keep your king on the long diagonal when possible, cut off the opponent's escape squares, and do not rush trades unless the resulting king race is clearly favorable.";
  }

  if (includesAny(q, ["why did i lose", "why am i losing", "why am i blundering", "mistake", "blunder"])) {
    return "Most losses at club level come from one of four causes: missing a mandatory capture, allowing a backward counter-capture, breaking the back rank too early, or entering a king race one tempo behind. If you share the move or position, I can isolate the exact mistake.";
  }

  if (includesAny(q, ["improve", "get better", "training", "practice", "drill", "study plan"])) {
    return "For fastest improvement, use this loop: Learn one concept, solve 5 to 10 puzzles on that theme, play a game, then review the critical mistake. On Checker.com, the best order is Learn -> Train -> Puzzles -> Play AI -> Analysis.";
  }

  if (includesAny(q, ["puzzle", "puzzles", "rush"])) {
    return "Use Daily Puzzles when you want careful calculation and Puzzle Rush when you want pattern speed. If a puzzle feels unclear, first ask: which capture is forced, where does the piece land, and what continuation becomes available from that landing square?";
  }

  if (includesAny(q, ["analysis", "archive", "review", "coach"])) {
    return "The Analysis and Dossier views are best after a finished game. They help you review key moments, biggest mistakes, and training ideas. If you want live advice during study, give me the position or move number and I will explain the idea in plain language.";
  }

  if (includesAny(q, ["friend room", "invite", "online", "multiplayer", "play friend"])) {
    return "For a friend match, open Play -> Friend Match, create a room, and send the code or link. The host takes red, the guest takes black, and once the second player joins the room becomes a live shared board.";
  }

  if (includesAny(q, ["ai level", "engine", "bot", "computer", "difficulty"])) {
    return "The AI levels mainly differ in search depth, randomness, and think time. Lower levels are good for tactical confidence, while the stronger levels punish loose moves much faster. If you want training value, choose the lowest level that still forces you to calculate every move.";
  }

  if (includesAny(q, ["where", "how do i find", "which page", "dashboard", "dossier", "learn", "train", "settings", "help"])) {
    return "Quick map: Play is for games, Puzzles is for tactics, Learn is for lessons, Train is for drills, Dossier is your archive and reviews, Rankings is leaderboard data, and Help covers rules and troubleshooting.";
  }

  if (includesAny(q, ["account", "login", "register", "guest mode", "guest"])) {
    return "Guest mode is fine for quick play, but an account is better if you want your archive and progress to follow you across devices. If something keeps sending you to login, open the room or play link directly rather than a protected account page.";
  }

  if (includesAny(q, ["off topic", "weather", "politics", "movie", "music", "programming"])) {
    return "I can try to keep it brief, but my strongest help here is checkers and Checker.com. If you want practical value right now, send me a rule question, position, move sequence, or training goal and I will be much more precise.";
  }

  if (includesAny(q, ["why", "how", "what about that", "can you explain more"])) {
    if (previousTopic) {
      return `Sure. Building on your earlier question about "${previousTopic}", the key is to compare forced captures, promotion tempo, and whether the move improves or weakens your diagonal control. If you want a sharper answer, send the board details or the exact move you are unsure about.`;
    }
    return "Sure. The safest way to understand almost any checkers position is: identify forced captures first, then compare king threats, then judge whether exchanging pieces helps you or your opponent. If you share the exact position, I can make that concrete.";
  }

  return "I can answer that, but I will be most useful if we anchor it to the board. Tell me the position, the move you are considering, or the theme you want help with, and I will break it into rules, candidate moves, risks, and the best practical plan.";
}
