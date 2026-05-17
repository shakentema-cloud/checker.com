import type { AIDifficulty, Board, Move, PlayerColor } from "./types";
import { applyMove, checkGameOver, getAllValidMoves, scoreBoard } from "./engine";

export const DIFFICULTY_CONFIG: Record<
  AIDifficulty,
  { depth: number; randomness: number; thinkTime: number; name: string; description: string; elo: number }
> = {
  0: { depth: 1, randomness: 0.85, thinkTime: 200, name: "Apprentice", description: "Plays mostly at random — perfect first opponent.", elo: 400 },
  1: { depth: 2, randomness: 0.3,  thinkTime: 400, name: "Cadet",      description: "Knows captures and basic structure.",            elo: 800 },
  2: { depth: 4, randomness: 0.08, thinkTime: 700, name: "Club Player",description: "Thinks four moves ahead.",                       elo: 1200 },
  3: { depth: 6, randomness: 0.02, thinkTime: 1200,name: "Expert",     description: "Strategic, positionally aware.",                 elo: 1600 },
  4: { depth: 8, randomness: 0,    thinkTime: 1800,name: "Grandmaster",description: "Near-optimal alpha-beta search.",                elo: 1950 },
};

export function getDifficultyConfig(d: AIDifficulty) {
  return DIFFICULTY_CONFIG[d];
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
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

export async function getBestMove(
  board: Board,
  color: PlayerColor,
  difficulty: AIDifficulty,
): Promise<Move | null> {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const moves = getAllValidMoves(board, color);
  if (!moves.length) return null;
  if (moves.length === 1) {
    await new Promise((r) => setTimeout(r, cfg.thinkTime / 2));
    return moves[0];
  }
  if (Math.random() < cfg.randomness) {
    await new Promise((r) => setTimeout(r, cfg.thinkTime / 2));
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const ordered = orderMoves(moves);
  const isMax = color === "black";
  let best = ordered[0];
  let bestScore = isMax ? -Infinity : Infinity;
  for (const m of ordered) {
    const s = minimax(applyMove(board, m), cfg.depth - 1, -Infinity, Infinity, !isMax);
    if (isMax ? s > bestScore : s < bestScore) {
      bestScore = s;
      best = m;
    }
  }
  await new Promise((r) => setTimeout(r, cfg.thinkTime));
  return best;
}
