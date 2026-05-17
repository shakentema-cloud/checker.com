import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/puzzles/")({
  head: () => ({ meta: [{ title: "Daily Puzzles — Checker.com" }] }),
  component: PuzzlesPage,
});

function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Record<string, any>>({});
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);

  useEffect(() => {
    supabase.from("puzzles").select("*").limit(20).then(({ data }) => {
      if (data?.length) setPuzzles(data);
    });
    setSolved(store.getPuzzles());
  }, []);

  const p = puzzles[idx];
  const submit = (correct: boolean) => {
    if (!p) return;
    const prev = solved[p.id] || { solved: false, attempts: 0, time: 0 };
    const next = { solved: correct || prev.solved, attempts: prev.attempts + 1, time: prev.time };
    store.setPuzzle(p.id, next);
    setSolved({ ...solved, [p.id]: next });
    setFeedback(correct ? "correct" : "wrong");
  };

  const streak = Object.values(solved).filter((x: any) => x.solved).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Tactical Archive</div>
            <h1 className="font-display text-4xl text-ink">Daily Puzzles</h1>
          </div>
          <Link to="/puzzles/rush" className="px-4 py-2 border border-forest text-forest text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest hover:text-primary-foreground">Puzzle Rush →</Link>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-6">
          <div className="dossier p-6">
            {!p ? (
              <p className="font-serif text-ink-muted text-center py-10">Loading positions…</p>
            ) : (
              <>
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="font-display text-2xl text-ink">{p.title}</div>
                    <div className="font-mono text-xs text-ink-muted">Theme: {p.theme} · {p.difficulty}</div>
                  </div>
                  <div className="font-sans text-[11px] uppercase tracking-wider text-gold">{p.side_to_move} to move</div>
                </div>
                <div className="aspect-square max-w-md mx-auto border border-border bg-paper grid grid-cols-8 grid-rows-8">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const r = Math.floor(i / 8), c = i % 8;
                    const dark = (r + c) % 2 === 1;
                    const piece = Array.isArray(p.board) ? p.board?.[r]?.[c] : null;
                    return (
                      <div key={i} className="flex items-center justify-center" style={{ background: dark ? "var(--board-dark)" : "var(--board-light)" }}>
                        {piece && (
                          <div className="w-3/4 aspect-square rounded-full" style={{ background: piece.color === "red" ? "var(--piece-red)" : "var(--piece-black)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {showHint && p.explanation && (
                  <div className="mt-4 p-3 bg-paper border-l-2 border-gold font-serif text-sm text-ink-muted">{p.explanation}</div>
                )}
                {feedback && (
                  <div className={`mt-4 text-center font-display text-2xl ${feedback === "correct" ? "text-forest" : "text-oxblood"}`}>
                    {feedback === "correct" ? "✓ Solved" : "✗ Try again"}
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button onClick={() => submit(true)} className="px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-wider font-sans">Mark Solved</button>
                  <button onClick={() => submit(false)} className="px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-wider font-sans">Failed</button>
                  <button onClick={() => setShowHint(true)} className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-wider font-sans">Hint</button>
                  <button onClick={() => { setIdx((idx + 1) % puzzles.length); setFeedback(null); setShowHint(false); }} className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-wider font-sans">Next →</button>
                </div>
              </>
            )}
          </div>
          <aside className="space-y-4">
            <div className="dossier p-4">
              <div className="font-sans text-[11px] uppercase tracking-wider text-gold mb-1">Streak</div>
              <div className="font-display text-4xl text-forest">{streak}</div>
              <div className="font-mono text-xs text-ink-muted">positions solved</div>
            </div>
            <div className="dossier">
              <div className="dossier-header">All positions</div>
              <ul className="max-h-80 overflow-auto">
                {puzzles.map((q, i) => (
                  <li key={q.id} className="ledger-row flex justify-between cursor-pointer hover:bg-paper" onClick={() => { setIdx(i); setFeedback(null); setShowHint(false); }}>
                    <span className="truncate">{q.title}</span>
                    <span>{solved[q.id]?.solved ? "✓" : "·"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
