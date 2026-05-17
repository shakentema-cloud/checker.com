import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Game Analysis — Checker.com" }] }),
  component: Analysis,
});

function Analysis() {
  const games = typeof window !== "undefined" ? store.getGames() : [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = games.find((g) => g.id === selectedId);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Archive</div>
        <h1 className="font-display text-4xl text-ink mb-6">Game Review</h1>
        {selected ? (
          <div className="dossier grid md:grid-cols-[1fr_300px]">
            <div className="p-8 border-r border-border flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="font-sans text-[10px] uppercase tracking-widest text-gold mb-2">{selected.mode} • {new Date(selected.createdAt).toLocaleDateString()}</div>
                  <div className="font-display text-4xl">vs {selected.opponent}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-[11px] uppercase tracking-wider font-sans border border-border px-3 py-1.5 hover:border-forest text-ink-muted hover:text-forest transition">← Back</button>
              </div>
              <div className="flex-1 bg-paper border border-border flex items-center justify-center min-h-[400px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-10 mix-blend-overlay group-hover:opacity-20 transition duration-1000" />
                <div className="text-center relative z-10 p-6">
                  <div className="text-5xl mb-4 opacity-50">♚</div>
                  <p className="font-serif text-ink-muted text-sm max-w-xs mx-auto leading-relaxed">Engine reconstruction of this notation sequence is pending analysis.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-paper/30">
              <div className="dossier-header border-b-0 border-l border-t-0 border-r-0">Match Stats</div>
              <div className="grid grid-cols-2 gap-px bg-border border-b border-border">
                <div className="bg-paper p-4"><div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Result</div><div className={`font-display text-2xl ${selected.result === "win" ? "text-forest" : "text-oxblood"}`}>{selected.result}</div></div>
                <div className="bg-paper p-4"><div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Accuracy</div><div className="font-display text-2xl text-gold">{selected.accuracy.toFixed(0)}%</div></div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                <div className="font-sans text-[11px] uppercase tracking-widest text-gold mb-4">Official Notation</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm">
                  {Array.from({ length: Math.ceil(selected.notation.length / 2) }).map((_, i) => (
                    <div key={i} className="col-span-2 grid grid-cols-[30px_1fr_1fr] border-b border-dashed border-border/50 pb-2">
                       <span className="text-ink-muted text-xs pt-0.5">{i + 1}.</span>
                       <span className="text-ink">{selected.notation[i * 2] || "—"}</span>
                       <span className="text-ink">{selected.notation[i * 2 + 1] || "—"}</span>
                    </div>
                  ))}
                  {selected.notation.length === 0 && <div className="col-span-2 text-ink-muted italic font-serif">No moves recorded in this match.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="dossier flex items-center justify-center p-24 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-5 mix-blend-overlay group-hover:opacity-10 transition duration-1000" />
            <div className="relative z-10 w-full max-w-sm">
               <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-forest/10 flex items-center justify-center border border-forest/30 border-dashed">
                 <span className="text-2xl opacity-50">♖</span>
               </div>
               <p className="font-serif text-lg text-ink mb-3 tracking-wide">The shelf is empty.</p>
               <p className="font-sans text-xs text-ink-muted mb-8 leading-relaxed">Play a match against the engine or a friend. The ledger will fill itself with your games.</p>
               <Link to="/play/ai" className="inline-block px-6 py-2.5 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep transition">Open the Board</Link>
            </div>
          </div>
        ) : (
          <div className="dossier">
            <div className="dossier-header flex justify-between">
              <span>Match Ledger</span>
              <span className="font-mono text-xs normal-case tracking-normal">{games.length} records</span>
            </div>
            <table className="w-full font-mono text-sm">
              <thead className="bg-paper text-ink-muted text-[10px] uppercase tracking-wider">
                <tr className="border-b border-border"><th className="text-left p-4">Mode</th><th className="text-left p-4">Opponent</th><th className="text-left p-4">Result</th><th className="text-right p-4">Moves</th><th className="text-right p-4">Acc.</th><th></th></tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-dashed border-border hover:bg-paper transition-colors group cursor-pointer" onClick={() => setSelectedId(g.id)}>
                    <td className="p-4">{g.mode}</td>
                    <td className="p-4 text-ink font-medium">{g.opponent}</td>
                    <td className={`p-4 ${g.result === "win" ? "text-forest" : g.result === "loss" ? "text-oxblood" : "text-ink-muted"}`}>{g.result}</td>
                    <td className="p-4 text-right">{g.moves}</td>
                    <td className="p-4 text-right">{g.accuracy.toFixed(0)}%</td>
                    <td className="p-4 text-right">
                       <button className="text-[10px] uppercase tracking-wider text-gold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end ml-auto">Review <span>→</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
