import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Game Analysis — Checker.com" }] }),
  component: Analysis,
});

function Analysis() {
  const games = typeof window !== "undefined" ? store.getGames() : [];
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Archive</div>
        <h1 className="font-display text-4xl text-ink mb-6">Game Review</h1>
        {games.length === 0 ? (
          <div className="dossier p-10 text-center">
            <p className="font-serif text-lg text-ink-muted mb-5">The shelf is empty. Play a match and the ledger will fill itself.</p>
            <Link to="/play/ai" className="inline-block px-5 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">Open the Board</Link>
          </div>
        ) : (
          <div className="dossier">
            <div className="dossier-header">Recent matches</div>
            <table className="w-full font-mono text-sm">
              <thead className="text-ink-muted text-[11px] uppercase tracking-wider">
                <tr className="border-b border-border"><th className="text-left p-3">Mode</th><th className="text-left p-3">Opponent</th><th className="text-left p-3">Result</th><th className="text-right p-3">Moves</th><th className="text-right p-3">Acc.</th><th></th></tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-dashed border-border hover:bg-paper">
                    <td className="p-3">{g.mode}</td>
                    <td className="p-3">{g.opponent}</td>
                    <td className={`p-3 ${g.result === "win" ? "text-forest" : g.result === "loss" ? "text-oxblood" : "text-ink-muted"}`}>{g.result}</td>
                    <td className="p-3 text-right">{g.moves}</td>
                    <td className="p-3 text-right">{g.accuracy.toFixed(0)}%</td>
                    <td className="p-3 text-right"><span className="text-ink-muted text-xs">{new Date(g.createdAt).toLocaleDateString()}</span></td>
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
