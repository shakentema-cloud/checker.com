import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";
import { DIFFICULTY_CONFIG } from "@/lib/game/ai";
import type { AIDifficulty, PlayerColor, TimeControl } from "@/lib/game/types";

export const Route = createFileRoute("/play/ai")({
  head: () => ({
    meta: [
      { title: "Play AI — Checker.com" },
      { name: "description", content: "Play against five AI tiers, from Apprentice (random) to Grandmaster (depth-8 alpha-beta). Mandatory captures, multi-jumps, king promotions." },
    ],
  }),
  component: PlayAI,
});

function formatTime(s: number) {
  if (s >= 86400) return "∞";
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function PlayAI() {
  const state = useGameStore((s) => s.state);
  const initGame = useGameStore((s) => s.initGame);
  const resign = useGameStore((s) => s.resign);
  const resetGame = useGameStore((s) => s.resetGame);
  const difficulty = useGameStore((s) => s.aiDifficulty);
  const playerColor = useGameStore((s) => s.playerColor);
  const isAIThinking = useGameStore((s) => s.isAIThinking);
  const timeRed = useGameStore((s) => s.timeRed);
  const timeBlack = useGameStore((s) => s.timeBlack);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const timeControl = useGameStore((s) => s.timeControl);

  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) {
      initGame("vs-ai", 2, "rapid-10", "red");
      setStarted(true);
    }
  }, [started, initGame]);

  useEffect(() => {
    if (state.status !== "playing" || timeControl === "unlimited") return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [state.status, timeControl, tickTimer]);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const gameOver = state.status === "finished";

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[260px_1fr_300px] gap-5">
        {/* LEFT — dossier */}
        <aside className="space-y-4">
          <div className="dossier">
            <div className="dossier-header">Opponent</div>
            <div className="p-4">
              <div className="font-display text-2xl text-ink">{cfg.name}</div>
              <div className="font-mono text-[11px] text-ink-muted mt-1">ELO {cfg.elo} · depth {cfg.depth}</div>
              <p className="font-serif text-sm text-ink-muted mt-3 leading-relaxed">{cfg.description}</p>
              {isAIThinking && (
                <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.2em] text-gold animate-pulse">
                  Thinking…
                </div>
              )}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Difficulty</div>
            <div className="p-3 grid grid-cols-5 gap-1">
              {(Object.keys(DIFFICULTY_CONFIG) as unknown as AIDifficulty[]).map((k) => {
                const d = Number(k) as AIDifficulty;
                return (
                  <button
                    key={d}
                    onClick={() => initGame("vs-ai", d, timeControl, playerColor)}
                    disabled={state.status === "playing" && state.moveCount > 0}
                    className={`py-2 text-xs font-mono border transition ${
                      d === difficulty
                        ? "bg-forest text-primary-foreground border-forest"
                        : "border-border text-ink-muted hover:border-forest"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {d + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Time Control</div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {([
                ["blitz-3", "3 min"],
                ["blitz-5", "5 min"],
                ["rapid-10", "10 min"],
                ["unlimited", "∞"],
              ] as [TimeControl, string][]).map(([tc, lbl]) => (
                <button
                  key={tc}
                  onClick={() => initGame("vs-ai", difficulty, tc, playerColor)}
                  disabled={state.moveCount > 0}
                  className={`py-2 text-xs font-mono border transition ${
                    tc === timeControl
                      ? "bg-forest text-primary-foreground border-forest"
                      : "border-border text-ink-muted hover:border-forest"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Your Color</div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {(["red", "black"] as PlayerColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => initGame("vs-ai", difficulty, timeControl, c)}
                  disabled={state.moveCount > 0}
                  className={`py-2 text-xs font-sans uppercase tracking-[0.15em] border transition ${
                    c === playerColor
                      ? "bg-forest text-primary-foreground border-forest"
                      : "border-border text-ink-muted hover:border-forest"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {c === "red" ? "Oxblood" : "Forest"}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER — board */}
        <div>
          <div className="flex items-center justify-between mb-3 font-mono text-sm">
            <div className={`px-3 py-1 ${state.currentTurn === "black" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
              {cfg.name} · {formatTime(timeBlack)}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Move {state.moveCount}
              {state.status === "playing" && (
                <span className="ml-2 text-forest">· {state.currentTurn === "red" ? "Oxblood" : "Forest"} to move</span>
              )}
            </div>
            <div className={`px-3 py-1 ${state.currentTurn === "red" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
              You · {formatTime(timeRed)}
            </div>
          </div>

          <Board flipped={playerColor === "black"} />

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => resetGame()}
              className="px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep"
            >
              New Match
            </button>
            <button
              onClick={() => resign()}
              disabled={state.status !== "playing"}
              className="px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-[0.18em] font-sans hover:bg-oxblood hover:text-destructive-foreground disabled:opacity-40"
            >
              Resign
            </button>
            <Link to="/play" className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-[0.18em] font-sans hover:border-forest hover:text-forest">
              Lobby
            </Link>
          </div>

          {gameOver && (
            <div className="mt-6 dossier p-6 text-center animate-ledger-in">
              <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Concluded</div>
              <div className="font-display text-3xl text-ink">
                {state.winner === null
                  ? "Draw agreed"
                  : state.winner === playerColor
                  ? "Victory"
                  : "Defeat"}
              </div>
              <div className="font-mono text-xs text-ink-muted mt-2">
                Reason: {state.reason ?? "–"} · {state.moveCount} moves
              </div>
              <button
                onClick={() => resetGame()}
                className="mt-4 px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — ledger */}
        <aside className="dossier">
          <div className="dossier-header">Move Ledger</div>
          <div className="max-h-[560px] overflow-y-auto">
            {state.moveHistory.length === 0 && (
              <div className="p-4 font-serif text-sm text-ink-muted italic">
                The board awaits the first move.
              </div>
            )}
            <ol>
              {state.moveHistory.map((h, i) => {
                const pair = Math.floor(i / 2) + 1;
                const isWhite = h.player === "red";
                return (
                  <li
                    key={i}
                    className="ledger-row flex items-baseline justify-between gap-2"
                  >
                    <span className="text-ink-muted w-7">{isWhite ? `${pair}.` : ""}</span>
                    <span className="flex-1 text-ink">{h.notation}</span>
                    {h.quality && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-sans"
                        style={{
                          color:
                            h.quality === "brilliant" || h.quality === "great"
                              ? "var(--gold)"
                              : h.quality === "blunder" || h.quality === "mistake"
                              ? "var(--oxblood)"
                              : "var(--ink-muted)",
                        }}
                      >
                        {h.quality[0]}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
