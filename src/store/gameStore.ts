import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  AIDifficulty,
  Board,
  GameMode,
  GameState,
  Move,
  PlayerColor,
  TimeControl,
} from "@/lib/game/types";
import {
  applyMove,
  calculateMoveAccuracy,
  checkGameOver,
  classifyMove,
  cloneBoard,
  createInitialGameState,
  getAllValidMoves,
  getValidMovesForPiece,
  moveToNotation,
} from "@/lib/game/engine";
import { getBestMove } from "@/lib/game/ai";

function getTimeSeconds(tc: TimeControl): number {
  const map: Record<TimeControl, number> = {
    "blitz-3": 180,
    "blitz-5": 300,
    "rapid-10": 600,
    "rapid-30": 1800,
    daily: 86400,
    unlimited: 0,
  };
  return map[tc];
}

interface GameStore {
  state: GameState;
  mode: GameMode;
  timeControl: TimeControl;
  aiDifficulty: AIDifficulty;
  playerColor: PlayerColor;
  isAIThinking: boolean;
  timeRed: number;
  timeBlack: number;
  gameId: string | null;

  initGame: (mode: GameMode, difficulty?: AIDifficulty, timeControl?: TimeControl, playerColor?: PlayerColor) => void;
  selectPiece: (row: number, col: number) => void;
  makeMove: (move: Move) => Promise<void>;
  triggerAIMove: () => Promise<void>;
  resign: () => void;
  offerDraw: () => void;
  tickTimer: () => void;
  resetGame: () => void;
  setPlayerColor: (color: PlayerColor) => void;
  loadBoard: (board: Board, currentTurn: PlayerColor) => void;
  applyRemoteState: (board: Board, currentTurn: PlayerColor, moveHistory: any[]) => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    state: createInitialGameState(),
    mode: "vs-ai",
    timeControl: "rapid-10",
    aiDifficulty: 2,
    playerColor: "red",
    isAIThinking: false,
    timeRed: 600,
    timeBlack: 600,
    gameId: null,

    initGame: (mode, difficulty = 2, timeControl = "rapid-10", playerColor = "red") => {
      const t = getTimeSeconds(timeControl);
      set((s) => {
        s.state = createInitialGameState();
        s.mode = mode;
        s.aiDifficulty = difficulty;
        s.timeControl = timeControl;
        s.playerColor = playerColor;
        s.isAIThinking = false;
        s.timeRed = t;
        s.timeBlack = t;
        s.gameId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `g-${Date.now()}`;
      });
      // If AI starts (player chose black), trigger AI move
      if (mode === "vs-ai" && playerColor === "black") {
        void get().triggerAIMove();
      }
    },

    selectPiece: (row, col) => {
      const { state, playerColor, mode, isAIThinking } = get();
      if (state.status !== "playing" || isAIThinking) return;
      const piece = state.board[row][col];
      const isPlayerTurn = mode !== "vs-ai" || state.currentTurn === playerColor;
      // Tap on highlighted destination = make the move
      if (state.selectedPiece && state.validMoves.find((m) => m.to.row === row && m.to.col === col)) {
        const move = state.validMoves.find((m) => m.to.row === row && m.to.col === col)!;
        void get().makeMove(move);
        return;
      }
      if (!piece || !isPlayerTurn || piece.color !== state.currentTurn) {
        set((s) => {
          s.state.selectedPiece = null;
          s.state.validMoves = [];
        });
        return;
      }
      const allMoves = getAllValidMoves(state.board, state.currentTurn);
      const hasMandatory = allMoves.some((m) => m.captures.length > 0);
      let moves = getValidMovesForPiece(state.board, { row, col }, state.currentTurn);
      if (hasMandatory) moves = moves.filter((m) => m.captures.length > 0);
      set((s) => {
        s.state.selectedPiece = { row, col };
        s.state.validMoves = moves;
      });
    },

    makeMove: async (move) => {
      const { state, mode, playerColor } = get();
      if (state.status !== "playing") return;
      const accuracy = calculateMoveAccuracy(state.board, move, state.currentTurn);
      const quality = classifyMove(accuracy);
      const newBoard = applyMove(state.board, move);
      const nextTurn: PlayerColor = state.currentTurn === "red" ? "black" : "red";
      const over = checkGameOver(newBoard, nextTurn);
      const mover = state.currentTurn;

      set((s) => {
        s.state.moveHistory.push({
          move,
          boardSnapshot: cloneBoard(s.state.board),
          player: mover,
          timestamp: Date.now(),
          quality,
          accuracy,
          notation: moveToNotation(move),
        });
        s.state.board = newBoard;
        if (mover === "black") s.state.capturedRed += move.captures.length;
        else s.state.capturedBlack += move.captures.length;
        s.state.selectedPiece = null;
        s.state.validMoves = [];
        s.state.moveCount++;
        s.state.lastMoveTime = Date.now();
        if (over.isOver) {
          s.state.status = "finished";
          s.state.winner = over.winner;
          s.state.reason = over.reason;
        } else {
          s.state.currentTurn = nextTurn;
        }
      });

      if (!over.isOver && mode === "vs-ai" && get().state.currentTurn !== playerColor) {
        await get().triggerAIMove();
      }
      
      // If we are in an online room, we don't want to trigger AI. 
      // But we DO need to broadcast this move. We'll handle that from the component by 
      // listening to the store, or passing a callback to Board.
    },

    triggerAIMove: async () => {
      const { state, aiDifficulty } = get();
      if (state.status !== "playing") return;
      set((s) => { s.isAIThinking = true; });
      try {
        const move = await getBestMove(get().state.board, get().state.currentTurn, aiDifficulty);
        if (move && get().state.status === "playing") {
          await get().makeMove(move);
        }
      } finally {
        set((s) => { s.isAIThinking = false; });
      }
    },

    resign: () => set((s) => {
      if (s.state.status !== "playing") return;
      s.state.status = "finished";
      s.state.winner = s.state.currentTurn === "red" ? "black" : "red";
      s.state.reason = "resignation";
    }),

    offerDraw: () => set((s) => {
      s.state.status = "finished";
      s.state.winner = null;
      s.state.reason = "draw-agreed";
    }),

    tickTimer: () => {
      const { state, timeControl } = get();
      if (state.status !== "playing" || timeControl === "unlimited") return;
      set((s) => {
        if (s.state.currentTurn === "red") {
          s.timeRed = Math.max(0, s.timeRed - 1);
          if (s.timeRed === 0) {
            s.state.status = "finished";
            s.state.winner = "black";
            s.state.reason = "timeout";
          }
        } else {
          s.timeBlack = Math.max(0, s.timeBlack - 1);
          if (s.timeBlack === 0) {
            s.state.status = "finished";
            s.state.winner = "red";
            s.state.reason = "timeout";
          }
        }
      });
    },

    resetGame: () => {
      const { mode, aiDifficulty, timeControl, playerColor } = get();
      get().initGame(mode, aiDifficulty, timeControl, playerColor);
    },

    setPlayerColor: (color) => set((s) => { s.playerColor = color; }),

    loadBoard: (board, currentTurn) => set((s) => {
      s.state = createInitialGameState();
      s.state.board = cloneBoard(board);
      s.state.currentTurn = currentTurn;
    }),

    applyRemoteState: (board, currentTurn, moveHistory) => set((s) => {
      // Avoid overwriting if we're already ahead (local prediction)
      if (s.state.moveHistory.length > moveHistory.length) return;
      s.state.board = cloneBoard(board);
      s.state.currentTurn = currentTurn;
      // We overwrite move history roughly. Real app would do full hydration.
      // But for display purposes, just updating moveCount is enough.
      s.state.moveCount = moveHistory.length;
    }),
  })),
);
