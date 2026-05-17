import type { GameMode } from "./game/types";

// ─────────────────────────────────────────────────────────────────────────────
// CHECKER.COM  ·  Persistent storage — localStorage with typed helpers
// Supabase sync is layered on top in individual features that import `supabase`.
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  city: string;
  country: string;
  is_guest: boolean;
  is_pro: boolean;
  avatar?: string;
  createdAt: number;
  selectedBoardSkin: string;
  selectedPieceSkin: string;
  ratings: { blitz: number; rapid: number; daily: number; puzzle: number; rush: number };
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  averageAccuracy: number;
  bestAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  puzzleStreak: number;
  rushBest: number;
  lessonProgress: Record<string, boolean>;
  trainingProgress: Record<string, number>;
  achievements: string[];
  joinedClubs: string[];
}

export interface SavedGame {
  id: string;
  userId?: string;
  mode: GameMode;
  opponent: string;
  playerColor: "red" | "black";
  result: "win" | "loss" | "draw" | "ongoing";
  reason: string | null;
  moves: number;
  accuracy: number;
  opponentAccuracy?: number;
  notation: string[];
  boardSnapshots?: any[];
  duration: number;
  createdAt: number;
  coachSessionId?: string;
}

export interface CoachSession {
  id: string;
  gameId: string;
  userId?: string;
  createdAt: number;
  overview: string;
  result: string;
  accuracy: number;
  totalMoves: number;
  bestMoment: { moveNumber: number; notation: string; why: string };
  biggestMistake: { moveNumber: number; notation: string; why: string; betterIdea: string };
  missedTactics: string[];
  keyMoments: { move: number; note: string }[];
  trainingPlan: { lesson: string; drill: string; puzzle: string };
  suggestedLessons: string[];
  suggestedDrills: string[];
  summary: string;
  best: string;
  mistake: string;
  moveAnalysis: { step: number; text: string; quality: string }[];
  messages: { role: "user" | "coach"; content: string; ts: number }[];
}

export interface PuzzleRecord {
  solved: boolean;
  attempts: number;
  time: number;
  lastSolvedAt?: number;
}

export interface LessonRecord {
  completed: boolean;
  attempts: number;
  score: number;
  completedAt?: number;
}

const KEYS = {
  user:      "checker.user",
  games:     "checker.games",
  coach:     "checker.coach",
  puzzles:   "checker.puzzles",
  rush:      "checker.rush",
  settings:  "checker.settings",
  clubs:     "checker.clubs",
  lessons:   "checker.lessons",
  training:  "checker.training",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ─── User Profile ────────────────────────────────────────────────────────────

export const DEFAULT_USER: LocalUser = {
  id: "", username: "", display_name: "", email: "",
  city: "Almaty", country: "KZ",
  is_guest: false, is_pro: false,
  createdAt: Date.now(),
  selectedBoardSkin: "Grandmaster Archive",
  selectedPieceSkin: "Forest Grandmaster",
  ratings: { blitz: 1000, rapid: 1000, daily: 1000, puzzle: 0, rush: 0 },
  gamesPlayed: 0, wins: 0, losses: 0, draws: 0,
  averageAccuracy: 0, bestAccuracy: 0,
  currentStreak: 0, bestStreak: 0,
  puzzleStreak: 0, rushBest: 0,
  lessonProgress: {}, trainingProgress: {},
  achievements: [], joinedClubs: [],
};

export const userStore = {
  get: (): LocalUser | null => {
    const u = read<LocalUser | null>(KEYS.user, null);
    if (!u) return null;
    // Merge with defaults to handle new fields in older records
    return { ...DEFAULT_USER, ...u };
  },
  save: (u: LocalUser) => write(KEYS.user, u),
  patch: (patch: Partial<LocalUser>): LocalUser | null => {
    const u = userStore.get();
    if (!u) return null;
    const updated = { ...u, ...patch };
    write(KEYS.user, updated);
    return updated;
  },
  updateStats: (result: "win" | "loss" | "draw", accuracy: number) => {
    const u = userStore.get();
    if (!u) return;
    u.gamesPlayed++;
    if (result === "win") { u.wins++; u.currentStreak++; u.bestStreak = Math.max(u.bestStreak, u.currentStreak); }
    else if (result === "loss") { u.losses++; u.currentStreak = 0; }
    else { u.draws++; }
    const totalGames = u.gamesPlayed;
    u.averageAccuracy = Math.round(((u.averageAccuracy * (totalGames - 1)) + accuracy) / totalGames);
    u.bestAccuracy = Math.max(u.bestAccuracy, Math.round(accuracy));
    write(KEYS.user, u);
  },
  addAchievement: (id: string) => {
    const u = userStore.get();
    if (!u || u.achievements.includes(id)) return;
    u.achievements.push(id);
    write(KEYS.user, u);
  },
  clear: () => localStorage.removeItem(KEYS.user),
};

// ─── Games ───────────────────────────────────────────────────────────────────

export const store = {
  getGames: () => read<SavedGame[]>(KEYS.games, []),
  addGame: (g: SavedGame) => {
    const existing = store.getGames();
    if (existing.some(e => e.id === g.id)) return; // dedup
    write(KEYS.games, [g, ...existing].slice(0, 100));
  },
  getGame: (id: string) => store.getGames().find(g => g.id === id) || null,

  getCoach: () => read<CoachSession[]>(KEYS.coach, []),
  saveCoach: (c: CoachSession) => {
    const all = store.getCoach().filter((x) => x.id !== c.id);
    write(KEYS.coach, [c, ...all].slice(0, 50));
  },
  getCoachForGame: (gameId: string) => store.getCoach().find(c => c.gameId === gameId) || null,

  getPuzzles: () => read<Record<string, PuzzleRecord>>(KEYS.puzzles, {}),
  setPuzzle: (id: string, r: PuzzleRecord) => {
    const all = store.getPuzzles();
    all[id] = r;
    write(KEYS.puzzles, all);
  },

  getRushBest: () => read<number>(KEYS.rush, 0),
  setRushBest: (v: number) => write(KEYS.rush, Math.max(v, store.getRushBest())),

  getSettings: () => read(KEYS.settings, {
    boardTheme: "archive", pieceStyle: "forest-oxblood",
    showCoords: true, showLegal: true, sound: true, animations: true,
    autoFlip: false, language: "en", confirmResign: true,
  }),
  setSettings: (s: any) => write(KEYS.settings, s),

  getJoinedClubs: () => read<string[]>(KEYS.clubs, []),
  toggleClub: (id: string) => {
    const all = store.getJoinedClubs();
    const updated = all.includes(id) ? all.filter((x) => x !== id) : [...all, id];
    write(KEYS.clubs, updated);
    // Also persist to user profile
    const u = userStore.get();
    if (u) { u.joinedClubs = updated; userStore.save(u); }
  },

  getLessons: () => read<Record<string, LessonRecord>>(KEYS.lessons, {}),
  setLesson: (id: string, r: LessonRecord) => {
    const all = store.getLessons();
    all[id] = r;
    write(KEYS.lessons, all);
  },

  getTraining: () => read<Record<string, number>>(KEYS.training, {}),
  setTrainingScore: (id: string, score: number) => {
    const all = store.getTraining();
    all[id] = Math.max(score, all[id] || 0);
    write(KEYS.training, all);
  },

  exportAll: () => {
    return JSON.stringify({
      profile: userStore.get(),
      games: store.getGames(),
      coach: store.getCoach(),
      puzzles: store.getPuzzles(),
      lessons: store.getLessons(),
      training: store.getTraining(),
      settings: store.getSettings(),
    }, null, 2);
  },

  resetAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
