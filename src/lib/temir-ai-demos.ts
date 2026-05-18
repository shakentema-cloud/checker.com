import { createEmptyBoard, getValidMovesForPiece } from "@/lib/game/engine";
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

function buildVisualBoard(definition: DemoBuilder): TemirVisualBoard {
  const validMoves = getValidMovesForPiece(
    definition.board,
    definition.focusFrom,
    definition.currentTurn,
  );
  const focusMove = validMoves.find(
    (move) =>
      move.to.row === definition.focusTo.row && move.to.col === definition.focusTo.col,
  );

  return {
    board: definition.board,
    currentTurn: definition.currentTurn,
    selectedPiece: definition.focusFrom,
    validMoves: focusMove ? [focusMove] : validMoves.slice(0, 1),
    lastMove: null,
    caption: definition.caption,
  };
}

function mandatoryCaptureDemo(): DemoBuilder {
  const board = createEmptyBoard();
  setPiece(board, 5, 2, { color: "red", type: "man", id: "mc-red-1" });
  setPiece(board, 4, 3, { color: "black", type: "man", id: "mc-black-1" });
  setPiece(board, 6, 5, { color: "red", type: "man", id: "mc-red-2" });
  return {
    caption: "Temir AI: captures are mandatory. Red must jump from c3 to e5 here.",
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
    caption: "Temir AI: in this app's CIS ruleset, men can capture backward. Red jumps backward from d4 to f2.",
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
    caption: "Temir AI: the landing square matters. This red piece starts a two-jump sequence from b2 to f6.",
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
    caption: "Temir AI: flying kings travel along open diagonals and can land beyond the captured piece.",
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
    caption: "Temir AI: count tempi in a promotion race. Red is one move from crowning on the back rank.",
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
    caption: "Temir AI: keep the back rank protected when promotion threats are coming down the board.",
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
