import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Checker.com" }] }),
  component: Leaderboard,
});

const SCOPES = ["Global", "Country", "City", "Friends"] as const;
const MODES = ["blitz", "rapid", "daily", "puzzle", "rush"] as const;

function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [scope, setScope] = useState<typeof SCOPES[number]>("Global");
  const [mode, setMode] = useState<typeof MODES[number]>("rapid");

  useEffect(() => {
    let q = supabase.from("leaderboard_entries")
      .select("*")
      .eq("category", mode)
      .order("score", { ascending: false }) // use score
      .limit(50);
      
    if (scope === "City") q = q.eq("city", "Almaty");
    if (scope === "Country") q = q.eq("country", "Kazakhstan");

    q.then(({ data }) => {
      setRows(data ?? []);
    });
  }, [scope, mode]);

  const handleChallenge = async () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await supabase.from("rooms").insert({
      code,
      host_guest_name: "Challenger",
      time_control: mode === "blitz" ? "blitz-3" : "rapid-10",
      status: "waiting",
    });
    navigate({ to: "/play/$roomId", params: { roomId: code } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Archive Standing</div>
        <h1 className="font-display text-4xl text-ink mb-6">Leaderboard</h1>

        <div className="flex flex-wrap gap-2 mb-2">
          {SCOPES.map(s => (
            <button key={s} onClick={() => setScope(s)} className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-sans border ${s === scope ? "bg-forest text-primary-foreground border-forest" : "border-border text-ink-muted hover:border-forest"}`}>{s}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {MODES.map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono border ${m === mode ? "bg-gold text-ink border-gold" : "border-border text-ink-muted hover:border-gold"}`}>{m}</button>
          ))}
        </div>

        <div className="dossier overflow-hidden">
          <table className="w-full font-mono text-sm">
            <thead className="bg-paper text-ink-muted text-[11px] uppercase tracking-wider">
              <tr><th className="text-left p-3 w-12">#</th><th className="text-left p-3">Player</th><th className="text-left p-3">City</th><th className="text-right p-3">Rating</th><th className="text-right p-3">W/L</th><th className="text-right p-3">Streak</th><th></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-ink-muted font-serif">Loading rankings…</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-dashed border-border hover:bg-paper">
                  <td className="p-3 text-gold">{i + 1}</td>
                  <td className="p-3 text-ink font-medium">{r.username}</td>
                  <td className="p-3 text-ink-muted">{r.city ?? "—"}</td>
                  <td className="p-3 text-right text-forest">{r.score}</td>
                  <td className="p-3 text-right">{r.wins}/{r.losses}</td>
                  <td className="p-3 text-right">{r.streak}</td>
                  <td className="p-3 text-right"><button onClick={handleChallenge} className="text-[10px] uppercase tracking-wider text-gold hover:text-forest">Challenge</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
