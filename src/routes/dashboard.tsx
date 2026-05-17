import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { store, type SavedGame, type CoachSession } from "@/lib/storage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dossier — Checker.com" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { displayName, isAuthed, guest } = useAuth();
  const [games, setGames] = useState<SavedGame[]>([]);
  const [coach, setCoach] = useState<CoachSession[]>([]);
  useEffect(() => { setGames(store.getGames()); setCoach(store.getCoach()); }, []);

  const wins = games.filter(g => g.result === "win").length;
  const losses = games.filter(g => g.result === "loss").length;
  const draws = games.filter(g => g.result === "draw").length;
  const total = games.length;
  const winrate = total ? Math.round((wins / total) * 100) : 0;
  const avgAcc = total ? Math.round(games.reduce((a, g) => a + g.accuracy, 0) / total) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Player Dossier</div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-5xl text-ink">{displayName}</h1>
            <div className="font-mono text-sm text-ink-muted mt-1">
              {isAuthed ? "Member" : "Guest"} · {guest?.city ?? "Almaty"}, {guest?.country ?? "KZ"}
            </div>
          </div>
          {!isAuthed && <Link to="/register" className="px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">Create Account</Link>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            ["Games", total], ["Wins", wins], ["Losses", losses], ["Win rate", `${winrate}%`], ["Avg accuracy", `${avgAcc}%`],
          ].map(([l, v]) => (
            <div key={l as string} className="dossier p-4">
              <div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted">{l}</div>
              <div className="font-display text-3xl text-forest mt-1">{v}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="dossier">
            <div className="dossier-header flex justify-between">Recent matches <Link to="/analysis" className="text-gold hover:text-forest normal-case tracking-normal">All →</Link></div>
            {games.length === 0 ? (
              <p className="p-6 font-serif text-ink-muted italic">No matches yet. <Link to="/play/ai" className="text-forest">Open the board</Link>.</p>
            ) : (
              <ul>
                {games.slice(0, 8).map(g => (
                  <li key={g.id} className="ledger-row flex justify-between">
                    <span>{g.mode} vs {g.opponent}</span>
                    <span className={g.result === "win" ? "text-forest" : g.result === "loss" ? "text-oxblood" : "text-ink-muted"}>{g.result}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="dossier">
            <div className="dossier-header">Coach sessions</div>
            {coach.length === 0 ? (
              <p className="p-6 font-serif text-ink-muted italic">No coach reviews yet. After a match, the coach annotates your key moments.</p>
            ) : (
              <ul>
                {coach.slice(0, 8).map(c => (
                  <li key={c.id} className="ledger-row block">
                    <div className="text-ink">{c.summary}</div>
                    <div className="text-[11px] text-ink-muted">{new Date(c.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
