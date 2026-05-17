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
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [coachTab, setCoachTab] = useState<"summary" | "moments" | "plan">("summary");

  useEffect(() => { setGames(store.getGames()); setCoach(store.getCoach()); }, []);
  const selectedCoach = coach.find(c => c.id === selectedCoachId);

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
                  <li key={c.id} className="ledger-row block cursor-pointer hover:bg-paper/50" onClick={() => { setSelectedCoachId(c.id); setCoachTab("summary"); }}>
                    <div className="text-ink">{c.summary.length > 50 ? c.summary.slice(0, 50) + "..." : c.summary}</div>
                    <div className="text-[11px] text-ink-muted">{new Date(c.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-paper border border-border w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-border flex justify-between items-center bg-paper/50">
                 <div>
                   <div className="font-sans text-[10px] uppercase tracking-widest text-gold mb-1">Post-Match Review</div>
                   <div className="font-display text-2xl text-ink">Coach Annotation</div>
                 </div>
                 <button onClick={() => setSelectedCoachId(null)} className="text-2xl text-ink-muted hover:text-ink leading-none mt-[-10px]">&times;</button>
              </div>
              <div className="flex border-b border-border px-5 bg-paper/30">
                 {[
                   { id: "summary", label: "Summary" },
                   { id: "moments", label: "Key Moments" },
                   { id: "plan", label: "Training Plan" }
                 ].map(t => (
                   <button key={t.id} onClick={() => setCoachTab(t.id as any)} className={`py-3 px-4 font-sans text-[11px] uppercase tracking-wider relative ${coachTab === t.id ? "text-forest font-medium" : "text-ink-muted hover:text-ink"}`}>
                      {t.label}
                      {coachTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-forest" />}
                   </button>
                 ))}
              </div>
              <div className="p-6 overflow-y-auto font-serif text-ink leading-relaxed">
                 {coachTab === "summary" && (
                   <div className="space-y-6">
                      <p>{selectedCoach.summary}</p>
                      <div>
                        <div className="font-sans text-[10px] uppercase tracking-widest text-gold mb-2">Best Move</div>
                        <p>{selectedCoach.best}</p>
                      </div>
                      <div>
                        <div className="font-sans text-[10px] uppercase tracking-widest text-oxblood mb-2">Biggest Mistake</div>
                        <p>{selectedCoach.mistake}</p>
                      </div>
                   </div>
                 )}
                 {coachTab === "moments" && (
                   <div className="space-y-4 font-mono text-sm">
                      {selectedCoach.keyMoments.length === 0 && <p className="text-ink-muted italic font-serif">No key moments flagged.</p>}
                      {selectedCoach.keyMoments.map((m, i) => (
                        <div key={i} className="flex gap-4 border-b border-dashed border-border pb-3">
                           <div className="text-gold mt-1">Move {Math.ceil(m.move / 2)}.</div>
                           <div className="font-serif">{m.note}</div>
                        </div>
                      ))}
                   </div>
                 )}
                 {coachTab === "plan" && (
                   <ul className="space-y-3">
                      {selectedCoach.trainingPlan.length === 0 && <p className="text-ink-muted italic">No action items.</p>}
                      {selectedCoach.trainingPlan.map((p, i) => (
                        <li key={i} className="flex gap-3 items-start">
                           <span className="text-forest mt-1">✓</span>
                           <span>{p}</span>
                        </li>
                      ))}
                   </ul>
                 )}
              </div>
           </div>
        </div>
      )}
    </AppShell>
  );
}
