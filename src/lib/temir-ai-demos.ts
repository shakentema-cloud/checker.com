import { createEmptyBoard, getAllValidMoves, getValidMovesForPiece } from "@/lib/game/engine";
import type { Board, Move, PlayerColor, Piece, Position } from "@/lib/game/types";
import type { TemirBoardDemoId, TemirVisualBoard } from "@/lib/temir-ai-types";

type DemoBuilder = {
  caption: string;
  currentTurn: PlayerColor;
  board: Board;
  focusFrom: Position;
  focusTo: Position;
};

function setPiece(board: Board, row: number, col: number, piece: Piece) {
  board[row][col] = piece;
}

function highlightsFromMove(move: Move): Position[] {
  return [...move.captures.map((p) => ({ row: p.row, col: p.col })), { row: move.to.row, col: move.to.col }];
}

function buildVisualBoard(definition: DemoBuilder): TemirVisualBoard {
  const validMoves = getValidMovesForPiece(
    definition.board,
    definition.focusFrom,
    definition.currentTurn,
  );
  const focusMove =
    validMoves.find(
      (move) =>
        move.to.row === definition.focusTo.row && move.to.col === definition.focusTo.col,
    ) ?? validMoves[0];

  // Detect forced capture across the whole side to move.
  const allMoves = getAllValidMoves(definition.board, definition.currentTurn);
  const forcedCapture = allMoves.some((m) => m.captures.length > 0);

  const chosen = focusMove ? [focusMove] : [];
  const alternatives = allMoves.filter(
    (m) =>
      m.captures.length > 0 &&
      !(focusMove && m.from.row === focusMove.from.row && m.from.col === focusMove.from.col && m.to.row === focusMove.to.row && m.to.col === focusMove.to.col),
  );

  return {
    board: definition.board,
    currentTurn: definition.currentTurn,
    selectedPiece: definition.focusFrom,
    validMoves: chosen,
    lastMove: null,
    caption: definition.caption,
    forcedCapture,
    highlightedSquares: focusMove ? highlightsFromMove(focusMove) : [],
    alternativeMoves: alternatives,
  };
}

function mandatoryCaptureDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 5, 2, { color: "red", type: "man", id: "mc-red-1" });
  setPiece(board, 4, 3, { color: "black", type: "man", id: "mc-black-1" });
  setPiece(board, 6, 5, { color: "red", type: "man", id: "mc-red-2" });
  return {
    caption: "Captures are mandatory. Red MUST jump from c3 to e5 — quiet moves are illegal while a capture exists.",
    currentTurn: "red",
    board,
    focusFrom: { row: 5, col: 2 },
    focusTo: { row: 3, col: 4 },
  };
}

function backwardCaptureDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 4, 3, { color: "red", type: "man", id: "bc-red-1" });
  setPiece(board, 5, 4, { color: "black", type: "man", id: "bc-black-1" });
  setPiece(board, 7, 6, { color: "red", type: "man", id: "bc-red-2" });
  return {
    caption: "In the CIS / Kazakhstan ruleset men capture backward too. Red jumps backward from d4 to f2.",
    currentTurn: "red",
    board,
    focusFrom: { row: 4, col: 3 },
    focusTo: { row: 6, col: 5 },
  };
}

function doubleJumpDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 6, 1, { color: "red", type: "man", id: "dj-red-1" });
  setPiece(board, 5, 2, { color: "black", type: "man", id: "dj-black-1" });
  setPiece(board, 3, 4, { color: "black", type: "man", id: "dj-black-2" });
  return {
    caption: "The landing square decides whether the chain continues. Red starts a two-jump sequence from b2 to f6.",
    currentTurn: "red",
    board,
    focusFrom: { row: 6, col: 1 },
    focusTo: { row: 2, col: 5 },
  };
}

function flyingKingDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 7, 0, { color: "red", type: "king", id: "fk-red-1" });
  setPiece(board, 4, 3, { color: "black", type: "man", id: "fk-black-1" });
  return {
    caption: "Flying kings travel along open diagonals and may land on any empty square beyond the captured piece.",
    currentTurn: "red",
    board,
    focusFrom: { row: 7, col: 0 },
    focusTo: { row: 3, col: 4 },
  };
}

function promotionRaceDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 1, 2, { color: "red", type: "man", id: "pr-red-1" });
  setPiece(board, 6, 5, { color: "black", type: "man", id: "pr-black-1" });
  return {
    caption: "Count tempi in a promotion race. Red is one move from crowning on the back rank.",
    currentTurn: "red",
    board,
    focusFrom: { row: 1, col: 2 },
    focusTo: { row: 0, col: 1 },
  };
}

function backRankDefenseDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 7, 2, { color: "red", type: "man", id: "br-red-1" });
  setPiece(board, 7, 4, { color: "red", type: "man", id: "br-red-2" });
  setPiece(board, 2, 1, { color: "black", type: "man", id: "br-black-1" });
  setPiece(board, 4, 3, { color: "black", type: "man", id: "br-black-2" });
  return {
    caption: "Hold the back rank while promotion threats are still on the board.",
    currentTurn: "red",
    board,
    focusFrom: { row: 7, col: 4 },
    focusTo: { row: 6, col: 3 },
  };
}

const demoFactories: Record<TemirBoardDemoId, () => DemoBuilder> = {
  "mandatory-capture": mandatoryCaptureDemo,
  "backward-capture": backwardCaptureDemo,
  "double-jump": doubleJumpDemo,
  "flying-king": flyingKingDemo,
  "promotion-race": promotionRaceDemo,
  "back-rank-defense": backRankDefenseDemo,
};

export function getTemirBoardDemo(id: TemirBoardDemoId): TemirVisualBoard {
  return buildVisualBoard(demoFactories[id]());
}
