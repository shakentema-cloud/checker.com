export type PlayerColor = "red" | "black";
export type PieceType = "man" | "king";
export type GameStatus = "waiting" | "playing" | "finished" | "draw";
export type GameMode = "vs-ai" | "vs-human-local" | "vs-human-online" | "puzzle" | "analysis";
export type TimeControl = "blitz-3" | "blitz-5" | "rapid-10" | "rapid-30" | "daily" | "unlimited";
export type MoveQuality = "brilliant" | "great" | "good" | "inaccuracy" | "mistake" | "blunder";
export type AIDifficulty = 0 | 1 | 2 | 3 | 4;

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isKingMove: boolean;
  promotesToKing: boolean;
}

export interface Piece {
  color: PlayerColor;
  type: PieceType;
  id: string;
}

export type Board = (Piece | null)[][];

export interface HistoricalMove {
  move: Move;
  boardSnapshot: Board;
  player: PlayerColor;
  timestamp: number;
  quality?: MoveQuality;
  accuracy?: number;
  notation?: string;
}

export interface GameState {
  board: Board;
  currentTurn: PlayerColor;
  status: GameStatus;
  winner: PlayerColor | null;
  reason: string | null;
  moveHistory: HistoricalMove[];
  capturedRed: number;
  capturedBlack: number;
  selectedPiece: Position | null;
  validMoves: Move[];
  moveCount: number;
  startTime: number;
  lastMoveTime: number;
}
