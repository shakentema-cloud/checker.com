import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/puzzles/rush")({
  head: () => ({ meta: [{ title: "Puzzle Rush — Checker.com" }] }),
  component: Rush,
});

function Rush() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(180);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [best, setBest] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => { setBest(store.getRushBest()); }, []);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if ((time === 0 || mistakes >= 3) && running) {
      setRunning(false); setDone(true);
      if (score > best) { store.setRushBest(score); setBest(score); }
    }
  }, [time, mistakes, running, score, best]);

  const start = () => { setRunning(true); setTime(180); setScore(0); setMistakes(0); setDone(false); };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Tactical Sprint</div>
        <h1 className="font-display text-5xl text-ink mb-2">Puzzle Rush</h1>
        <p className="font-serif text-ink-muted mb-8">Three minutes. Three mistakes. Score as many positions as your nerve allows.</p>

        <div className="dossier p-8 text-center">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div><div className="font-mono text-3xl text-forest">{Math.floor(time/60)}:{String(time%60).padStart(2,"0")}</div><div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mt-1">Time</div></div>
            <div><div className="font-mono text-3xl text-gold">{score}</div><div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mt-1">Solved</div></div>
            <div><div className="font-mono text-3xl text-oxblood">{mistakes}/3</div><div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mt-1">Mistakes</div></div>
          </div>
          <div className="font-mono text-sm text-ink-muted mb-4">Best score: {best}</div>
          {!running && !done && (
            <button onClick={start} className="px-8 py-3 bg-forest text-primary-foreground text-sm uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">Begin Sprint</button>
          )}
          {running && (
            <div className="space-y-3">
              <p className="font-serif text-ink-muted">Position {score + 1}</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setScore(s => s + 1)} className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-wider font-sans">✓ Solved</button>
                <button onClick={() => setMistakes(m => m + 1)} className="px-6 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-wider font-sans">✗ Missed</button>
              </div>
            </div>
          )}
          {done && (
            <div className="animate-ledger-in">
              <div className="font-display text-3xl text-ink mb-2">Sprint complete</div>
              <div className="font-mono text-ink-muted mb-4">{score} positions · {mistakes} mistakes</div>
              <div className="flex gap-2 justify-center">
                <button onClick={start} className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-wider font-sans">Run Again</button>
                <Link to="/learn" className="px-6 py-2 border border-forest text-forest text-xs uppercase tracking-wider font-sans">Train Weaknesses</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
