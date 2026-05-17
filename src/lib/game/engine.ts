import type { Board, GameState, Move, Piece, PlayerColor, Position } from "./types";

export function createInitialBoard(): Board {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
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

export function getDirections(piece: Piece): [number, number][] {
  if (piece.type === "king") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (piece.color === "red") return [[-1, -1], [-1, 1]];
  return [[1, -1], [1, 1]];
}

export function shouldPromote(piece: Piece, row: number): boolean {
  if (piece.type === "king") return false;
  return (piece.color === "red" && row === 0) || (piece.color === "black" && row === 7);
}

export function countPieces(board: Board) {
  let red = 0,
    black = 0,
    redKings = 0,
    blackKings = 0;
  for (const row of board)
    for (const cell of row) {
      if (cell?.color === "red") {
        red++;
        if (cell.type === "king") redKings++;
      } else if (cell?.color === "black") {
        black++;
        if (cell.type === "king") blackKings++;
      }
    }
  return { red, black, redKings, blackKings };
}

function getSimpleMovesForPiece(board: Board, pos: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  for (const [dr, dc] of getDirections(piece)) {
    const nr = pos.row + dr,
      nc = pos.col + dc;
    if (isInBounds(nr, nc) && !board[nr][nc]) {
      moves.push({
        from: pos,
        to: { row: nr, col: nc },
        captures: [],
        isKingMove: piece.type === "king",
        promotesToKing: shouldPromote(piece, nr),
      });
    }
  }
  return moves;
}

function getCapturesForPiece(
  board: Board,
  pos: Position,
  piece: Piece,
  alreadyCaptured: Position[],
): Move[] {
  const captures: Move[] = [];
  for (const [dr, dc] of getDirections(piece)) {
    const enemyRow = pos.row + dr,
      enemyCol = pos.col + dc;
    const landRow = pos.row + dr * 2,
      landCol = pos.col + dc * 2;
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
    const moved = tempBoard[landRow][landCol]!;
    if (shouldPromote(moved, landRow)) tempBoard[landRow][landCol] = { ...moved, type: "king" };
    const chains = getCapturesForPiece(
      tempBoard,
      { row: landRow, col: landCol },
      tempBoard[landRow][landCol]!,
      [...alreadyCaptured, capturePos],
    );
    if (!chains.length) {
      captures.push({
        from: pos,
        to: { row: landRow, col: landCol },
        captures: [capturePos],
        isKingMove: piece.type === "king",
        promotesToKing: shouldPromote(piece, landRow),
      });
    } else {
      for (const chain of chains) {
        captures.push({
          from: pos,
          to: chain.to,
          captures: [capturePos, ...chain.captures],
          isKingMove: piece.type === "king",
          promotesToKing: chain.promotesToKing || shouldPromote(piece, landRow),
        });
      }
    }
  }
  return captures;
}

export function getValidMovesForPiece(
  board: Board,
  pos: Position,
  color: PlayerColor,
): Move[] {
  const piece = board[pos.row][pos.col];
  if (!piece || piece.color !== color) return [];
  const captures = getCapturesForPiece(board, pos, piece, []);
  return captures.length ? captures : getSimpleMovesForPiece(board, pos, piece);
}

export function getAllValidMoves(board: Board, color: PlayerColor): Move[] {
  const allCaptures: Move[] = [],
    allSimple: Move[] = [];
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

export function checkGameOver(
  board: Board,
  currentTurn: PlayerColor,
): { isOver: boolean; winner: PlayerColor | null; reason: string | null } {
  const counts = countPieces(board);
  if (counts.red === 0) return { isOver: true, winner: "black", reason: "no-pieces" };
  if (counts.black === 0) return { isOver: true, winner: "red", reason: "no-pieces" };
  const moves = getAllValidMoves(board, currentTurn);
  if (!moves.length)
    return {
      isOver: true,
      winner: currentTurn === "red" ? "black" : "red",
      reason: "no-moves",
    };
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
      const total =
        pieceVal +
        centerBonus[r][c] * 0.1 +
        (isBlack ? (r === 0 ? 0.3 : r * 0.05) : r === 7 ? 0.3 : (7 - r) * 0.05);
      score += isBlack ? total : -total;
    }
  score += (getAllValidMoves(board, "black").length - getAllValidMoves(board, "red").length) * 0.08;
  return score;
}

export function calculateMoveAccuracy(
  board: Board,
  move: Move,
  color: PlayerColor,
): number {
  const allMoves = getAllValidMoves(board, color);
  if (allMoves.length <= 1) return 100;
  const scores = allMoves.map((m) => scoreBoard(applyMove(board, m)));
  scores.sort((a, b) => (color === "black" ? b - a : a - b));
  const best = scores[0],
    worst = scores[scores.length - 1];
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

// Standard checkers algebraic notation (1-32)
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
