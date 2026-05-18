import type { Board, Move, PlayerColor, Position } from "./game/types";

export const TEMIR_ROUTE_TARGETS = [
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

export type TemirRouteTarget = (typeof TEMIR_ROUTE_TARGETS)[number];

export const TEMIR_BOARD_DEMO_IDS = [
  "mandatory-capture",
  "backward-capture",
  "double-jump",
  "flying-king",
  "promotion-race",
  "back-rank-defense",
] as const;

export type TemirBoardDemoId = (typeof TEMIR_BOARD_DEMO_IDS)[number];

export interface TemirNavigateAction {
  path: TemirRouteTarget;
  label: string;
  reason: string;
  autoOpen: boolean;
}

export interface TemirCurrentBoardMove {
  index: number;
  notation: string;
  from: Position;
  to: Position;
  captures: number;
  promotesToKing: boolean;
}

export interface TemirCurrentBoardContext {
  board: Board;
  currentTurn: PlayerColor;
  moves: TemirCurrentBoardMove[];
}

export interface TemirAssistantRequest {
  message: string;
  history: Array<{ role: "user" | "ai"; content: string }>;
  currentPath: string;
  currentBoard: TemirCurrentBoardContext | null;
}

export interface TemirAssistantResponse {
  answer: string;
  navigate: TemirNavigateAction | null;
  boardDemoId: TemirBoardDemoId | null;
  recommendedMoveIndex: number | null;
  followUpPrompt: string | null;
}

export interface TemirVisualBoard {
  board: Board;
  currentTurn: PlayerColor;
  selectedPiece: Position | null;
  validMoves: Move[];
  lastMove: Move | null;
  caption: string;
}
