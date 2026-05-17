import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/clubs")({
  head: () => ({ meta: [{ title: "Clubs — Checker.com" }] }),
  component: Clubs,
});

const SEED = [
  { id: "almaty", name: "Almaty Checkers Club", city: "Almaty", country: "KZ", description: "The original tavern club. Weekly blitz nights, monthly rapid tournament.", member_count: 142, average_rating: 1480, weekly_games: 312, top_player: "GMSerikov" },
  { id: "astana", name: "Astana Strategy Board", city: "Astana", country: "KZ", description: "Capital chapter focused on classical play and study circles.", member_count: 98, average_rating: 1520, weekly_games: 184, top_player: "NurbolatK" },
  { id: "kz-league", name: "Kazakhstan Draughts League", city: "—", country: "KZ", description: "National federation. Rated tournaments, FIDE-aligned ratings.", member_count: 540, average_rating: 1610, weekly_games: 980, top_player: "OldMasterT" },
  { id: "rapid-kings", name: "Rapid Kings Club", city: "Almaty", country: "KZ", description: "5-minute rapid only. Sharp openings, ruthless endgames.", member_count: 67, average_rating: 1390, weekly_games: 410, top_player: "BlitzAibek" },
  { id: "students", name: "Student Checkers Arena", city: "Almaty", country: "KZ", description: "University circuit. Free to join with student ID.", member_count: 220, average_rating: 1240, weekly_games: 290, top_player: "DiKhan" },
  { id: "grandmaster", name: "Grandmaster Archive Circle", city: "—", country: "—", description: "Invite-only. Master-level analysis sessions. Apply with three rated games.", member_count: 24, average_rating: 1980, weekly_games: 48, top_player: "IronDaria" },
];

function Clubs() {
  const [clubs, setClubs] = useState(SEED);
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    setJoined(store.getJoinedClubs());
    supabase.from("clubs").select("*").then(({ data }) => {
      if (data?.length) setClubs(data as any);
    });
  }, []);

  const toggle = (id: string) => {
    store.toggleClub(id);
    setJoined(store.getJoinedClubs());
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Member Chapters</div>
        <h1 className="font-display text-4xl text-ink mb-8">Clubs &amp; Communities</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map(c => {
            const isJoined = joined.includes(c.id);
            return (
              <div key={c.id} className="dossier p-5">
                <div className="font-display text-xl text-ink mb-1">{c.name}</div>
                <div className="font-mono text-[11px] text-ink-muted mb-3">{c.city}{c.country ? `, ${c.country}` : ""}</div>
                <p className="font-serif text-sm text-ink-muted mb-4 leading-relaxed">{c.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div><div className="font-mono text-forest">{c.member_count}</div><div className="text-[9px] uppercase tracking-wider text-ink-muted">Members</div></div>
                  <div><div className="font-mono text-gold">{c.average_rating}</div><div className="text-[9px] uppercase tracking-wider text-ink-muted">Avg ELO</div></div>
                  <div><div className="font-mono text-ink">{c.weekly_games}</div><div className="text-[9px] uppercase tracking-wider text-ink-muted">Weekly</div></div>
                </div>
                <div className="text-[11px] font-mono text-ink-muted mb-3">Top: <span className="text-forest">{c.top_player}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(c.id)} className={`flex-1 px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans border ${isJoined ? "bg-forest text-primary-foreground border-forest" : "border-forest text-forest hover:bg-forest hover:text-primary-foreground"}`}>{isJoined ? "Member" : "Join"}</button>
                  <button className="flex-1 px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans border border-border text-ink-muted hover:border-gold">Challenge</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
