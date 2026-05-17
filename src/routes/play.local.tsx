import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";

export const Route = createFileRoute("/play/local")({
  head: () => ({ meta: [{ title: "Local 2-Player — Checker.com" }] }),
  component: PlayLocal,
});

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function PlayLocal() {
  const state = useGameStore((s) => s.state);
  const initGame = useGameStore((s) => s.initGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const resign = useGameStore((s) => s.resign);
  const timeRed = useGameStore((s) => s.timeRed);
  const timeBlack = useGameStore((s) => s.timeBlack);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const tc = useGameStore((s) => s.timeControl);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) { initGame("vs-human-local", 0, "rapid-10", "red"); setStarted(true); }
  }, [started, initGame]);

  useEffect(() => {
    if (state.status !== "playing" || tc === "unlimited") return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [state.status, tc, tickTimer]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Pass &amp; Play</div>
        <h1 className="font-display text-3xl text-ink mb-6">Local Two-Player</h1>
        <div className="flex items-center justify-between mb-3 font-mono text-sm">
          <div className={`px-3 py-1 ${state.currentTurn === "black" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
            Player 2 (Forest) · {fmt(timeBlack)}
          </div>
          <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted">Move {state.moveCount}</div>
          <div className={`px-3 py-1 ${state.currentTurn === "red" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
            Player 1 (Oxblood) · {fmt(timeRed)}
          </div>
        </div>
        <Board />
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <button onClick={() => resetGame()} className="px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">New Match</button>
          <button onClick={() => resign()} disabled={state.status !== "playing"} className="px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-[0.18em] font-sans disabled:opacity-40">Resign</button>
          <Link to="/play" className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-[0.18em] font-sans hover:border-forest hover:text-forest">Lobby</Link>
        </div>
        {state.status === "finished" && (
          <div className="mt-6 dossier p-6 text-center animate-ledger-in">
            <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Concluded</div>
            <div className="font-display text-3xl text-ink">
              {state.winner === null ? "Draw" : state.winner === "red" ? "Player 1 wins" : "Player 2 wins"}
            </div>
            <div className="font-mono text-xs text-ink-muted mt-2">{state.reason} · {state.moveCount} moves</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
