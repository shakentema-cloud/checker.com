import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  AIDifficulty,
  Board,
  GameMode,
  GameState,
  HistoricalMove,
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
  countPieces,
  createInitialGameState,
  getAllValidMoves,
  getValidMovesForPiece,
  moveToNotation,
} from "@/lib/game/engine";
import { getBestMove, generateCoachSession } from "@/lib/game/ai";
import { store, userStore } from "@/lib/storage";

function getTimeSeconds(tc: TimeControl): number {
  return ({
    "blitz-3": 180, "blitz-5": 300, "rapid-10": 600,
    "rapid-30": 1800, daily: 86400, unlimited: 0,
  } as Record<TimeControl, number>)[tc];
}

function isHistoricalMove(value: unknown): value is HistoricalMove {
  if (!value || typeof value !== "object") return false;
  const maybeMove = (value as HistoricalMove).move;
  return !!maybeMove &&
    typeof maybeMove.from?.row === "number" &&
    typeof maybeMove.from?.col === "number" &&
    typeof maybeMove.to?.row === "number" &&
    typeof maybeMove.to?.col === "number" &&
    Array.isArray(maybeMove.captures);
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
  hasSaved: boolean;

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
    hasSaved: false,

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
        s.hasSaved = false;
        s.gameId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `g-${Date.now()}`;
      });
      if (mode === "vs-ai" && playerColor === "black") {
        void get().triggerAIMove();
      }
    },

    selectPiece: (row, col) => {
      const { state, playerColor, mode, isAIThinking } = get();
      if (state.status !== "playing" || isAIThinking) return;
      const piece = state.board[row][col];
      const isPlayerTurn = mode === "vs-human-local" ? true : state.currentTurn === playerColor;

      // Tap on a highlighted destination = make the move
      if (
        state.selectedPiece &&
        state.validMoves.find((m) => m.to.row === row && m.to.col === col)
      ) {
        const move = state.validMoves.find((m) => m.to.row === row && m.to.col === col)!;
        void get().makeMove(move);
        return;
      }

      if (!piece || !isPlayerTurn || piece.color !== state.currentTurn) {
        set((s) => { s.state.selectedPiece = null; s.state.validMoves = []; });
        return;
      }

      const allMoves = getAllValidMoves(state.board, state.currentTurn);
      const hasMandatory = allMoves.some((m) => m.captures.length > 0);
      let moves = getValidMovesForPiece(state.board, { row, col }, state.currentTurn);
      if (hasMandatory) moves = moves.filter((m) => m.captures.length > 0);

      set((s) => { s.state.selectedPiece = { row, col }; s.state.validMoves = moves; });
    },

    makeMove: async (move) => {
      const { state, mode, playerColor, gameId, hasSaved } = get();
      if (state.status !== "playing") return;

      const accuracy = calculateMoveAccuracy(state.board, move, state.currentTurn);
      const quality = classifyMove(accuracy);
      const boardBefore = cloneBoard(state.board);
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

      // Auto-save when game ends (exactly once)
      if (over.isOver && !hasSaved) {
        set((s) => { s.hasSaved = true; });
        const finalState = get().state;
        const playerMoves = finalState.moveHistory.filter((h) => h.player === playerColor);
        const avgAcc = playerMoves.length
          ? playerMoves.reduce((a, c) => a + (c.accuracy || 0), 0) / playerMoves.length
          : 0;
        const result: "win" | "loss" | "draw" =
          over.winner === null ? "draw"
          : over.winner === playerColor ? "win"
          : "loss";

        const gid = gameId || `g-${Date.now()}`;

        // Save game record
        store.addGame({
          id: gid,
          mode: get().mode,
          opponent: get().mode === "vs-ai" ? `Engine Tier ${get().aiDifficulty + 1}` : "Local Player",
          playerColor,
          result,
          reason: over.reason,
          moves: finalState.moveCount,
          accuracy: avgAcc,
          notation: finalState.moveHistory.map((h) => h.notation || ""),
          boardSnapshots: finalState.moveHistory.map((h) => h.boardSnapshot),
          duration: Date.now() - finalState.startTime,
          createdAt: Date.now(),
        });

        // Update user stats
        userStore.updateStats(result, avgAcc);

        // Generate coach session
        const coach = generateCoachSession(gid, finalState.moveHistory, playerColor, result);
        store.saveCoach(coach);

        // Update game record with coach reference
        const games = store.getGames();
        const gi = games.findIndex((g) => g.id === gid);
        if (gi >= 0) {
          games[gi].coachSessionId = coach.id;
          // Write back (use addGame logic — it deduplicates by id, so update directly)
          localStorage.setItem("checker.games", JSON.stringify(games));
        }

        // Achievements
        if (result === "win") userStore.addAchievement("first-win");
        if (finalState.moveHistory.some((h) => h.move.captures.length > 1)) {
          userStore.addAchievement("double-jump");
        }
        if (finalState.moveHistory.some((h) => h.move.promotesToKing)) {
          userStore.addAchievement("first-king");
        }
        userStore.addAchievement("first-game");
      }

      if (!over.isOver && mode === "vs-ai" && get().state.currentTurn !== playerColor) {
        await get().triggerAIMove();
      }
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

    resign: () => {
      set((s) => {
        if (s.state.status !== "playing") return;
        s.state.status = "finished";
        s.state.winner = s.state.currentTurn === "red" ? "black" : "red";
        s.state.reason = "resignation";
      });
      // Trigger save
      const { state, playerColor, gameId, hasSaved } = get();
      if (!hasSaved) {
        set((s) => { s.hasSaved = true; });
        store.addGame({
          id: gameId || `g-${Date.now()}`,
          mode: get().mode,
          opponent: get().mode === "vs-ai" ? `Engine Tier ${get().aiDifficulty + 1}` : "Local Player",
          playerColor,
          result: "loss",
          reason: "resignation",
          moves: state.moveCount,
          accuracy: 0,
          notation: state.moveHistory.map((h) => h.notation || ""),
          boardSnapshots: state.moveHistory.map((h) => h.boardSnapshot),
          duration: Date.now() - state.startTime,
          createdAt: Date.now(),
        });
        userStore.updateStats("loss", 0);
      }
    },

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
          if (s.timeRed === 0) { s.state.status = "finished"; s.state.winner = "black"; s.state.reason = "timeout"; }
        } else {
          s.timeBlack = Math.max(0, s.timeBlack - 1);
          if (s.timeBlack === 0) { s.state.status = "finished"; s.state.winner = "red"; s.state.reason = "timeout"; }
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
      const remoteLength = Array.isArray(moveHistory) ? moveHistory.length : 0;
      if (s.state.moveHistory.length > remoteLength) return;

      const normalizedHistory = Array.isArray(moveHistory)
        ? moveHistory.filter(isHistoricalMove)
        : [];
      const pieceCount = countPieces(board);

      s.state.board = cloneBoard(board);
      s.state.currentTurn = currentTurn;
      if (normalizedHistory.length === remoteLength || remoteLength === 0) {
        s.state.moveHistory = normalizedHistory;
      }
      s.state.moveCount = remoteLength;
      s.state.capturedRed = Math.max(0, 12 - pieceCount.red);
      s.state.capturedBlack = Math.max(0, 12 - pieceCount.black);
      s.state.selectedPiece = null;
      s.state.validMoves = [];
    }),
  })),
);
