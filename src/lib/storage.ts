// LocalStorage-backed persistence for guest mode and offline fallback.
export interface SavedGame {
  id: string;
  mode: "vs-ai" | "local" | "friend" | "puzzle";
  opponent: string;
  result: "win" | "loss" | "draw" | "ongoing";
  reason: string | null;
  moves: number;
  accuracy: number;
  notation: string[];
  duration: number;
  createdAt: number;
}
export interface CoachSession {
  id: string;
  gameId: string;
  summary: string;
  best: string;
  mistake: string;
  keyMoments: { move: number; note: string }[];
  trainingPlan: string[];
  messages: { role: "user" | "coach"; content: string; ts: number }[];
  createdAt: number;
}

const k = {
  games: "checker.games",
  coach: "checker.coach",
  puzzles: "checker.puzzles",
  rush: "checker.rush",
  settings: "checker.settings",
  clubs: "checker.clubs",
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

export const store = {
  getGames: () => read<SavedGame[]>(k.games, []),
  addGame: (g: SavedGame) => write(k.games, [g, ...store.getGames()].slice(0, 100)),
  getCoach: () => read<CoachSession[]>(k.coach, []),
  saveCoach: (c: CoachSession) => {
    const all = store.getCoach().filter((x) => x.id !== c.id);
    write(k.coach, [c, ...all].slice(0, 50));
  },
  getPuzzles: () => read<Record<string, { solved: boolean; attempts: number; time: number }>>(k.puzzles, {}),
  setPuzzle: (id: string, r: { solved: boolean; attempts: number; time: number }) => {
    const all = store.getPuzzles();
    all[id] = r;
    write(k.puzzles, all);
  },
  getRushBest: () => read<number>(k.rush, 0),
  setRushBest: (v: number) => write(k.rush, Math.max(v, store.getRushBest())),
  getSettings: () => read(k.settings, {
    boardTheme: "archive", pieceStyle: "forest-oxblood",
    showCoords: true, showLegal: true, sound: true, animations: true,
    autoFlip: false, language: "en",
  }),
  setSettings: (s: any) => write(k.settings, s),
  getJoinedClubs: () => read<string[]>(k.clubs, []),
  toggleClub: (id: string) => {
    const all = store.getJoinedClubs();
    write(k.clubs, all.includes(id) ? all.filter((x) => x !== id) : [...all, id]);
  },
};
