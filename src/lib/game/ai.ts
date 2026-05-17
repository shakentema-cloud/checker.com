import type { AIDifficulty, Board, HistoricalMove, Move, PlayerColor } from "./types";
import { applyMove, checkGameOver, getAllValidMoves, scoreBoard, hasBackwardCapture } from "./engine";
import type { CoachSession } from "../storage";

// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const DIFFICULTY_CONFIG: Record<
  AIDifficulty,
  { depth: number; randomness: number; thinkTime: number; name: string; description: string; elo: number }
> = {
  0: { depth: 1,  randomness: 0.85, thinkTime: 200,  name: "Apprentice",  description: "Plays mostly at random — perfect first opponent.", elo: 400  },
  1: { depth: 2,  randomness: 0.30, thinkTime: 400,  name: "Cadet",       description: "Knows captures and basic structure.",            elo: 800  },
  2: { depth: 4,  randomness: 0.08, thinkTime: 700,  name: "Club Player", description: "Thinks four moves ahead.",                       elo: 1200 },
  3: { depth: 6,  randomness: 0.02, thinkTime: 1200, name: "Expert",      description: "Strategic, positionally aware.",                 elo: 1600 },
  4: { depth: 8,  randomness: 0,    thinkTime: 1800, name: "Grandmaster", description: "Near-optimal alpha-beta search.",                elo: 1950 },
};

export function getDifficultyConfig(d: AIDifficulty) {
  return DIFFICULTY_CONFIG[d];
}

// ─────────────────────────────────────────────────────────────────────────────
// MINIMAX  (alpha-beta)
// ─────────────────────────────────────────────────────────────────────────────

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0) return scoreBoard(board);
  const color: PlayerColor = maximizing ? "black" : "red";
  const over = checkGameOver(board, color);
  if (over.isOver) return over.winner === "black" ? 1000 : over.winner === "red" ? -1000 : 0;
  const moves = getAllValidMoves(board, color);
  if (!moves.length) return maximizing ? -1000 : 1000;
  if (maximizing) {
    let max = -Infinity;
    for (const m of orderMoves(moves)) {
      const v = minimax(applyMove(board, m), depth - 1, alpha, beta, false);
      max = Math.max(max, v);
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return max;
  } else {
    let min = Infinity;
    for (const m of orderMoves(moves)) {
      const v = minimax(applyMove(board, m), depth - 1, alpha, beta, true);
      min = Math.min(min, v);
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return min;
  }
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const sa = a.captures.length * 10 + (a.promotesToKing ? 8 : 0);
    const sb = b.captures.length * 10 + (b.promotesToKing ? 8 : 0);
    return sb - sa;
  });
}

export async function getBestMove(board: Board, color: PlayerColor, difficulty: AIDifficulty): Promise<Move | null> {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const moves = getAllValidMoves(board, color);
  if (!moves.length) return null;
  if (moves.length === 1) { await sleep(cfg.thinkTime / 2); return moves[0]; }
  if (Math.random() < cfg.randomness) { await sleep(cfg.thinkTime / 2); return moves[Math.floor(Math.random() * moves.length)]; }
  const ordered = orderMoves(moves);
  const isMax = color === "black";
  let best = ordered[0], bestScore = isMax ? -Infinity : Infinity;
  for (const m of ordered) {
    const s = minimax(applyMove(board, m), cfg.depth - 1, -Infinity, Infinity, !isMax);
    if (isMax ? s > bestScore : s < bestScore) { bestScore = s; best = m; }
  }
  await sleep(cfg.thinkTime);
  return best;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL HEURISTIC AI COACH  (works without any API key)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCoachSession(
  gameId: string,
  moveHistory: HistoricalMove[],
  playerColor: PlayerColor,
  result: "win" | "loss" | "draw",
): CoachSession {
  const playerMoves = moveHistory.filter((h) => h.player === playerColor);
  const opponentMoves = moveHistory.filter((h) => h.player !== playerColor);
  const accuracy = playerMoves.length
    ? Math.round(playerMoves.reduce((s, m) => s + (m.accuracy || 50), 0) / playerMoves.length)
    : 50;

  // ── Best Moment ───────────────────────────────────────────────────────────
  const bestMoveEntry = [...playerMoves].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0];
  const bestMoveIdx = bestMoveEntry ? moveHistory.indexOf(bestMoveEntry) : -1;
  const bestMoment = bestMoveEntry
    ? {
        moveNumber: Math.ceil((bestMoveIdx + 1) / 2),
        notation: bestMoveEntry.notation || "–",
        why: describeGoodMove(bestMoveEntry),
      }
    : { moveNumber: 0, notation: "–", why: "Your play was consistent throughout." };

  // ── Biggest Mistake ───────────────────────────────────────────────────────
  const blunders = playerMoves.filter((m) => (m.quality === "blunder" || m.quality === "mistake"));
  const worstEntry = blunders.sort((a, b) => (a.accuracy || 100) - (b.accuracy || 100))[0] || null;
  const worstIdx = worstEntry ? moveHistory.indexOf(worstEntry) : -1;
  const biggestMistake = worstEntry
    ? {
        moveNumber: Math.ceil((worstIdx + 1) / 2),
        notation: worstEntry.notation || "–",
        why: describeBadMove(worstEntry),
        betterIdea: suggestBetter(worstEntry),
      }
    : { moveNumber: 0, notation: "–", why: "No critical mistakes detected.", betterIdea: "" };

  // ── Missed Tactics ────────────────────────────────────────────────────────
  const missed: string[] = [];
  if (blunders.length > 0) missed.push("Missed mandatory backward capture");
  const hasMultiJumpMiss = playerMoves.some(m => (m.accuracy || 100) < 30 && (m.move?.captures?.length || 0) === 0);
  if (hasMultiJumpMiss) missed.push("Missed multi-capture sequence");
  if (opponentMoves.some(m => m.move?.promotesToKing)) missed.push("Allowed opponent promotion race");
  if (playerMoves.some(m => (m.accuracy || 100) < 20)) missed.push("Exposed back row to attack");
  if (missed.length === 0) missed.push("No major tactical oversights detected");

  // ── Key Moments ───────────────────────────────────────────────────────────
  const keyMoments: { move: number; note: string }[] = [];
  playerMoves.forEach((m, i) => {
    const moveNum = moveHistory.indexOf(m);
    if (m.quality === "brilliant" || m.quality === "great") {
      keyMoments.push({ move: moveNum + 1, note: `★ Excellent move ${m.notation}: ${describeGoodMove(m)}` });
    } else if (m.quality === "blunder") {
      keyMoments.push({ move: moveNum + 1, note: `✗ Critical error ${m.notation}: ${describeBadMove(m)}` });
    }
  });

  // ── Training Plan ─────────────────────────────────────────────────────────
  const lesson = selectLesson(blunders, playerMoves, result);
  const drill = selectDrill(blunders, playerMoves, result);
  const puzzle = selectPuzzle(blunders, opponentMoves, result);

  // ── Move Analysis ───────────────────────────────────────────────────────────
  const moveAnalysis = moveHistory.map((m, i) => {
    let text = "";
    if (m.player === playerColor) {
      if (m.quality === "brilliant" || m.quality === "great") {
        text = `Brilliant because: ${describeGoodMove(m)}`;
      } else if (m.quality === "blunder" || m.quality === "mistake") {
        text = `Poor because: ${describeBadMove(m)} ${suggestBetter(m)}`;
      } else {
        text = `Good because: Reliable move holding position.`;
      }
    } else {
      text = "Opponent's turn.";
    }
    return { step: i + 1, text, quality: m.quality || "good" };
  });

  // ── Overview ──────────────────────────────────────────────────────────────
  const resultWord = result === "win" ? "won" : result === "loss" ? "lost" : "drew";
  const strengthPhrase = accuracy >= 70 ? "Your positional awareness was solid." : "Your piece mobility needs improvement.";
  const weaknessPhrase = worstEntry
    ? `Your biggest vulnerability was at move ${biggestMistake.moveNumber} (${biggestMistake.notation}).`
    : "Your game was well-controlled.";

  const overview = `You ${resultWord} this game with ${accuracy}% accuracy over ${moveHistory.length} moves. ${strengthPhrase} ${weaknessPhrase} In Kazakhstan/CIS draughts, remember that simple pieces can capture backward — always scan all four diagonals before moving.`;

  const summary = overview;
  const best = `Move ${bestMoment.moveNumber} (${bestMoment.notation}): ${bestMoment.why}`;
  const mistake = worstEntry
    ? `Move ${biggestMistake.moveNumber} (${biggestMistake.notation}): ${biggestMistake.why}`
    : "No major mistakes — well played.";

  return {
    id: `coach-${gameId}-${Date.now()}`,
    gameId,
    createdAt: Date.now(),
    overview,
    result: result.charAt(0).toUpperCase() + result.slice(1),
    accuracy,
    totalMoves: moveHistory.length,
    bestMoment,
    biggestMistake,
    missedTactics: missed,
    keyMoments: keyMoments.slice(0, 6),
    trainingPlan: { lesson, drill, puzzle },
    suggestedLessons: [lesson],
    suggestedDrills: [drill],
    summary,
    best,
    mistake,
    moveAnalysis,
    messages: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Heuristic coach chat — answers questions from game data
// ─────────────────────────────────────────────────────────────────────────────

export function coachChatLocal(
  question: string,
  session: CoachSession,
): string {
  const q = question.toLowerCase();

  if (q.includes("backward") || q.includes("назад")) {
    return `In this CIS/Kazakhstan ruleset, simple pieces CAN capture backward. Move ${session.biggestMistake.moveNumber} (${session.biggestMistake.notation}) may have involved missing a backward capture. Always check all four diagonal directions before moving.`;
  }
  if (q.includes("best") || q.includes("лучший")) {
    return `Your best move was move ${session.bestMoment.moveNumber} (${session.bestMoment.notation}). ${session.bestMoment.why}`;
  }
  if (q.includes("mistake") || q.includes("wrong") || q.includes("ошибк")) {
    return `Your biggest mistake was move ${session.biggestMistake.moveNumber} (${session.biggestMistake.notation}). ${session.biggestMistake.why} Better idea: ${session.biggestMistake.betterIdea || "Scan all captures first."}`;
  }
  if (q.includes("double jump") || q.includes("multi")) {
    const hasMissed = session.missedTactics.some(t => t.includes("multi"));
    return hasMissed
      ? "You missed at least one multi-capture chain this game. After a capture, always check if the same piece can capture again before the turn ends."
      : "You handled multi-captures well in this game. Keep scanning after each jump.";
  }
  if (q.includes("back row") || q.includes("defend")) {
    return "Back row defense is crucial. Keep at least 2 pieces on your back rank early. Moving them too early gives your opponent a promotion path.";
  }
  if (q.includes("promot") || q.includes("king") || q.includes("дамк")) {
    const missed = session.missedTactics.some(t => t.includes("promotion"));
    return missed
      ? "You allowed the opponent to promote. Look for pieces on an open diagonal within 2–3 moves of the back rank and either block or race them."
      : "Your promotion awareness was adequate. Look for opportunities to sacrifice a man to create a clear promotion path.";
  }
  if (q.includes("plan") || q.includes("train") || q.includes("practice")) {
    const { lesson, drill, puzzle } = session.trainingPlan;
    return `Based on this game, your training plan is:\n1. Study: "${lesson}"\n2. Drill: "${drill}"\n3. Puzzle theme: "${puzzle}"\n\nComplete these in the Learn and Train sections.`;
  }
  if (q.includes("beginner") || q.includes("explain") || q.includes("simple")) {
    return `Here is the simple version: You played ${session.accuracy}% accurate. Your best move was ${session.bestMoment.notation}. Your biggest mistake was ${session.biggestMistake.notation}. In CIS rules, pieces can jump backward — always look in all four directions before deciding.`;
  }
  if (q.includes("accuracy") || q.includes("точность")) {
    return `Your accuracy this game was ${session.accuracy}%. ${session.accuracy >= 80 ? "That is excellent — above 80% puts you in the skilled bracket." : session.accuracy >= 60 ? "That is decent — focus on eliminating blunders to reach 80%+" : "Below 60% means several moves cost you significantly. Focus on always checking for mandatory captures first."}`;
  }

  // Fallback
  return `Based on this game (${session.accuracy}% accuracy, ${session.totalMoves} moves): ${session.overview} Ask me about your best move, biggest mistake, backward captures, promotion, or training plan.`;
}

// ── Private helpers ──────────────────────────────────────────────────────────

function describeGoodMove(m: HistoricalMove): string {
  if (m.move?.captures?.length && m.move.captures.length > 1) return `Multi-capture removing ${m.move.captures.length} pieces — excellent tactical vision.`;
  if (m.move?.captures?.length) return "Forced capture that maintained material advantage.";
  if (m.move?.promotesToKing) return "Promotion move — you created your first king!";
  return "Well-timed positional move that improved your piece activity.";
}

function describeBadMove(m: HistoricalMove): string {
  const acc = m.accuracy || 0;
  if (acc < 10) return "This was a blunder — it gave the opponent a decisive advantage.";
  if (acc < 30) return "This mistake allowed the opponent to gain material or positional dominance.";
  if (m.quality === "inaccuracy") return "A slight inaccuracy — a better move was available on this position.";
  return "This move weakened your position. Check if a capture was available in any direction first.";
}

function suggestBetter(m: HistoricalMove): string {
  if ((m.move?.captures?.length || 0) === 0) return "Look for a capture move first — remember backward captures are legal in CIS rules.";
  return "After capturing, scan again for chain captures before ending the turn.";
}

function selectLesson(blunders: HistoricalMove[], playerMoves: HistoricalMove[], result: string): string {
  if (blunders.some(b => (b.accuracy || 0) < 20)) return "Mandatory Captures";
  if (result === "loss") return "Back Row Defense";
  const hasPromotion = playerMoves.some(m => m.move?.promotesToKing);
  if (!hasPromotion) return "Promotion Races";
  return "Backward Captures";
}

function selectDrill(blunders: HistoricalMove[], playerMoves: HistoricalMove[], result: string): string {
  if (blunders.length > 2) return "Backward Capture Drill";
  if (result === "loss") return "Back Row Defense Drill";
  return "Capture Scan Drill";
}

function selectPuzzle(blunders: HistoricalMove[], opponentMoves: HistoricalMove[], result: string): string {
  if (blunders.length > 0) return "Mandatory Capture";
  if (opponentMoves.some(m => m.move?.promotesToKing)) return "Promotion Race";
  return "Double Jump";
}

// Legacy export for backward compatibility
export async function generateCoachReport(history: HistoricalMove[], playerColor: PlayerColor) {
  if (history.length === 0) return { title: "No data", text: "The board remained silent." };
  const playerMoves = history.filter((h) => h.player === playerColor);
  const blunders = playerMoves.filter((h) => h.quality === "blunder" || h.quality === "mistake");
  if (blunders.length === 0) {
    return {
      title: "Pristine Strategy",
      text: "Your tactical execution was exceptional. You maintained board tension without significant conceded ground. Remember: in CIS rules, always check backward captures before moving.",
      highlights: playerMoves.filter((h) => h.quality === "brilliant" || h.quality === "great").length,
    };
  }
  const worst = blunders.sort((a, b) => (a.accuracy || 100) - (b.accuracy || 100))[0];
  return {
    title: "Tactical Debrief",
    text: `Your play was generally sound, but move ${history.indexOf(worst) + 1} (${worst.notation}) opened a vulnerability. In Kazakhstan/CIS draughts, simple pieces can capture backward — always scan all four diagonals.`,
    advice: "Before every move, ask: is there a capture available? Check backward diagonals too.",
    keyMove: worst,
  };
}
