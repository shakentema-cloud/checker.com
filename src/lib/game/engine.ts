import type { Board, GameState, Move, Piece, PlayerColor, Position } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// CHECKER.COM — KAZAKHSTAN / CIS RULESET
//
// Simple piece (man):
//   • Moves  : diagonally FORWARD only (1 square to an empty square)
//   • Captures: diagonally FORWARD and BACKWARD (mandatory multi-jump)
//
// King (dame):
//   • Moves & captures in ALL four diagonals
//   • Flying king: can travel multiple squares per move, capture over 1 enemy
//     then land on any empty square beyond it on the same diagonal
//
// Mandatory capture: if any capture exists, only captures are legal this turn.
// Multi-capture: after a capture, if the same piece has another capture,
//   the turn does NOT switch — only that piece may continue capturing.
// Promotion: man reaching the last rank immediately becomes a king.
// ─────────────────────────────────────────────────────────────────────────────

export function createEmptyBoard(): Board {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row][col] = { color: "black", type: "man", id: `b-${row}-${col}` };
        else if (row > 4) board[row][col] = { color: "red", type: "man", id: `r-${row}-${col}` };
      }
    }
  }
  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: "red",
    status: "playing",
    winner: null,
    reason: null,
    moveHistory: [],
    capturedRed: 0,
    capturedBlack: 0,
    selectedPiece: null,
    validMoves: [],
    moveCount: 0,
    startTime: Date.now(),
    lastMoveTime: Date.now(),
  };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/** Returns the diagonal move directions for a piece.
 *  IMPORTANT: simple men can capture in ALL 4 directions but only MOVE forward.
 *  This function returns directions for MOVEMENT (not capture).
 */
export function getForwardDirections(piece: Piece): [number, number][] {
  if (piece.type === "king") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  // Red moves "up" (decreasing row index), black moves "down"
  if (piece.color === "red") return [[-1, -1], [-1, 1]];
  return [[1, -1], [1, 1]];
}

/** ALL four diagonals — used for captures (men can capture backward). */
const ALL_DIRECTIONS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export function shouldPromote(piece: Piece, row: number): boolean {
  if (piece.type === "king") return false;
  return (piece.color === "red" && row === 0) || (piece.color === "black" && row === 7);
}

export function countPieces(board: Board) {
  let red = 0, black = 0, redKings = 0, blackKings = 0;
  for (const row of board)
    for (const cell of row) {
      if (cell?.color === "red") { red++; if (cell.type === "king") redKings++; }
      else if (cell?.color === "black") { black++; if (cell.type === "king") blackKings++; }
    }
  return { red, black, redKings, blackKings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple (non-capture) moves — men move forward only; kings fly all directions
// ─────────────────────────────────────────────────────────────────────────────
function getSimpleMovesForPiece(board: Board, pos: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  const dirs = getForwardDirections(piece); // forward only for men; all 4 for kings

  for (const [dr, dc] of dirs) {
    if (piece.type === "king") {
      // Flying king: slide until blocked
      let nr = pos.row + dr, nc = pos.col + dc;
      while (isInBounds(nr, nc)) {
        if (board[nr][nc]) break;
        moves.push({ from: pos, to: { row: nr, col: nc }, captures: [], isKingMove: true, promotesToKing: false });
        nr += dr; nc += dc;
      }
    } else {
      const nr = pos.row + dr, nc = pos.col + dc;
      if (isInBounds(nr, nc) && !board[nr][nc]) {
        moves.push({
          from: pos, to: { row: nr, col: nc }, captures: [], isKingMove: false,
          promotesToKing: shouldPromote(piece, nr),
        });
      }
    }
  }
  return moves;
}

// ─────────────────────────────────────────────────────────────────────────────
// Captures — men capture in ALL 4 diagonals (CIS/Kazakhstan rule); kings fly
// ─────────────────────────────────────────────────────────────────────────────
function getCapturesForPiece(
  board: Board,
  pos: Position,
  piece: Piece,
  alreadyCaptured: Position[],
): Move[] {
  const captures: Move[] = [];
  // Men use ALL directions for captures; kings use all directions too
  const dirs = ALL_DIRECTIONS;

  for (const [dr, dc] of dirs) {
    if (piece.type === "king") {
      // Flying king: scan the diagonal, find first enemy, land beyond it
      let nr = pos.row + dr, nc = pos.col + dc;
      let foundEnemy: Position | null = null;
      while (isInBounds(nr, nc)) {
        const cell = board[nr][nc];
        if (cell) {
          if (cell.color === piece.color) break;
          if (alreadyCaptured.some((p) => p.row === nr && p.col === nc)) break;
          if (foundEnemy) break; // can't jump over 2
          foundEnemy = { row: nr, col: nc };
        } else if (foundEnemy) {
          const capturePos = foundEnemy;
          const landRow = nr, landCol = nc;
          const tempBoard = cloneBoard(board);
          tempBoard[landRow][landCol] = tempBoard[pos.row][pos.col];
          tempBoard[pos.row][pos.col] = null;
          tempBoard[capturePos.row][capturePos.col] = null;
          const moved = tempBoard[landRow][landCol]!;
          const chains = getCapturesForPiece(tempBoard, { row: landRow, col: landCol }, moved, [...alreadyCaptured, capturePos]);
          if (!chains.length) {
            captures.push({ from: pos, to: { row: landRow, col: landCol }, captures: [capturePos], isKingMove: true, promotesToKing: false });
          } else {
            for (const chain of chains) {
              captures.push({ from: pos, to: chain.to, captures: [capturePos, ...chain.captures], isKingMove: true, promotesToKing: false });
            }
          }
        }
        nr += dr; nc += dc;
      }
    } else {
      // Simple man: capture = jump over adjacent enemy to the square beyond
      // This works in ALL 4 diagonal directions (CIS backward capture rule)
      const enemyRow = pos.row + dr, enemyCol = pos.col + dc;
      const landRow = pos.row + dr * 2, landCol = pos.col + dc * 2;
      if (!isInBounds(landRow, landCol)) continue;
      const enemyCell = board[enemyRow][enemyCol];
      if (!enemyCell || enemyCell.color === piece.color) continue;
      if (alreadyCaptured.some((p) => p.row === enemyRow && p.col === enemyCol)) continue;
      if (board[landRow][landCol] !== null) continue;

      const capturePos = { row: enemyRow, col: enemyCol };
      const tempBoard = cloneBoard(board);
      tempBoard[landRow][landCol] = tempBoard[pos.row][pos.col];
      tempBoard[pos.row][pos.col] = null;
      tempBoard[enemyRow][enemyCol] = null;
      let moved = tempBoard[landRow][landCol]!;
      // Promotion during capture chain
      if (shouldPromote(moved, landRow)) {
        moved = { ...moved, type: "king" };
        tempBoard[landRow][landCol] = moved;
      }

      const chains = getCapturesForPiece(tempBoard, { row: landRow, col: landCol }, moved, [...alreadyCaptured, capturePos]);
      if (!chains.length) {
        captures.push({
          from: pos, to: { row: landRow, col: landCol }, captures: [capturePos],
          isKingMove: false, promotesToKing: shouldPromote(piece, landRow),
        });
      } else {
        for (const chain of chains) {
          captures.push({
            from: pos, to: chain.to, captures: [capturePos, ...chain.captures],
            isKingMove: false, promotesToKing: chain.promotesToKing || shouldPromote(piece, landRow),
          });
        }
      }
    }
  }
  return captures;
}

export function getValidMovesForPiece(board: Board, pos: Position, color: PlayerColor): Move[] {
  const piece = board[pos.row][pos.col];
  if (!piece || piece.color !== color) return [];
  const captures = getCapturesForPiece(board, pos, piece, []);
  return captures.length ? captures : getSimpleMovesForPiece(board, pos, piece);
}

export function getAllValidMoves(board: Board, color: PlayerColor): Move[] {
  const allCaptures: Move[] = [], allSimple: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color) continue;
      const pos = { row: r, col: c };
      const pc = getCapturesForPiece(board, pos, piece, []);
      if (pc.length) allCaptures.push(...pc);
      else allSimple.push(...getSimpleMovesForPiece(board, pos, piece));
    }
  return allCaptures.length ? allCaptures : allSimple;
}

/** Check if a position has any available backward capture for a man of the given color */
export function hasBackwardCapture(board: Board, color: PlayerColor): boolean {
  const forwardDirs = color === "red" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color || piece.type !== "man") continue;
      for (const [dr, dc] of ALL_DIRECTIONS) {
        const isForward = forwardDirs.some(([fdr, fdc]) => fdr === dr && fdc === dc);
        if (isForward) continue; // only check backward directions
        const er = r + dr, ec = c + dc;
        const lr = r + dr * 2, lc = c + dc * 2;
        if (!isInBounds(lr, lc)) continue;
        const enemy = board[er][ec];
        if (enemy && enemy.color !== color && !board[lr][lc]) return true;
      }
    }
  return false;
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.row][move.from.col]!;
  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;
  for (const cap of move.captures) newBoard[cap.row][cap.col] = null;
  if (move.promotesToKing || shouldPromote(piece, move.to.row)) {
    newBoard[move.to.row][move.to.col] = { ...piece, type: "king" };
  }
  return newBoard;
}

export function checkGameOver(board: Board, currentTurn: PlayerColor): { isOver: boolean; winner: PlayerColor | null; reason: string | null } {
  const counts = countPieces(board);
  if (counts.red === 0) return { isOver: true, winner: "black", reason: "no-pieces" };
  if (counts.black === 0) return { isOver: true, winner: "red", reason: "no-pieces" };
  const moves = getAllValidMoves(board, currentTurn);
  if (!moves.length) return { isOver: true, winner: currentTurn === "red" ? "black" : "red", reason: "no-moves" };
  return { isOver: false, winner: null, reason: null };
}

export function scoreBoard(board: Board): number {
  let score = 0;
  const centerBonus = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const isBlack = piece.color === "black";
      const pieceVal = piece.type === "king" ? 3 : 1;
      const total = pieceVal + centerBonus[r][c] * 0.1 +
        (isBlack ? (r === 0 ? 0.3 : r * 0.05) : r === 7 ? 0.3 : (7 - r) * 0.05);
      score += isBlack ? total : -total;
    }
  score += (getAllValidMoves(board, "black").length - getAllValidMoves(board, "red").length) * 0.08;
  return score;
}

export function calculateMoveAccuracy(board: Board, move: Move, color: PlayerColor): number {
  const allMoves = getAllValidMoves(board, color);
  if (allMoves.length <= 1) return 100;
  const scores = allMoves.map((m) => scoreBoard(applyMove(board, m)));
  scores.sort((a, b) => (color === "black" ? b - a : a - b));
  const best = scores[0], worst = scores[scores.length - 1];
  const mine = scoreBoard(applyMove(board, move));
  if (Math.abs(best - worst) < 0.01) return 100;
  return Math.max(0, Math.min(100, ((mine - worst) / (best - worst)) * 100));
}

export function classifyMove(accuracy: number): import("./types").MoveQuality {
  if (accuracy >= 95) return "brilliant";
  if (accuracy >= 80) return "great";
  if (accuracy >= 60) return "good";
  if (accuracy >= 40) return "inaccuracy";
  if (accuracy >= 20) return "mistake";
  return "blunder";
}

// Standard checkers square numbers 1–32 (odd rows are dark)
const squareNumber = (r: number, c: number): number | null => {
  if ((r + c) % 2 === 0) return null;
  return r * 4 + Math.floor(c / 2) + 1;
};

export function moveToNotation(move: Move): string {
  const from = squareNumber(move.from.row, move.from.col);
  const to = squareNumber(move.to.row, move.to.col);
  const sep = move.captures.length ? "x" : "-";
  return `${from}${sep}${to}`;
}

export function parseNotation(notation: string): { from: number; to: number; isCapture: boolean } | null {
  const match = notation.match(/^(\d+)([x\-])(\d+)$/);
  if (!match) return null;
  return { from: parseInt(match[1]), to: parseInt(match[3]), isCapture: match[2] === "x" };
}

const posFromSquare = (n: number): Position => {
  const r = Math.floor((n - 1) / 4);
  const c = ((n - 1) % 4) * 2 + (r % 2 === 0 ? 1 : 0);
  return { row: r, col: c };
};

export function getHistoryFromNotation(notation: string[]): { board: Board; move: Move | null }[] {
  let currentBoard = createInitialBoard();
  const history: { board: Board; move: Move | null }[] = [{ board: currentBoard, move: null }];
  let turn: PlayerColor = "red";

  for (const n of notation) {
    const parsed = parseNotation(n);
    if (!parsed) break;
    const from = posFromSquare(parsed.from);
    const validMoves = getValidMovesForPiece(currentBoard, from, turn);
    const move = validMoves.find((m) => squareNumber(m.to.row, m.to.col) === parsed.to);
    if (move) {
      currentBoard = applyMove(currentBoard, move);
      history.push({ board: currentBoard, move });
      turn = turn === "red" ? "black" : "red";
    } else break;
  }
  return history;
}
