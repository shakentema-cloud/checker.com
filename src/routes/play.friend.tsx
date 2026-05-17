import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/play/friend")({
  head: () => ({ meta: [{ title: "Friend Match — Checker.com" }] }),
  component: PlayFriend,
});

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function PlayFriend() {
  const navigate = useNavigate();
  const { user, guest } = useAuth();
  const [tc, setTc] = useState("rapid-10");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    const code = genCode();
    const hostName = user?.user_metadata?.display_name || guest?.display_name || "Host";
    try {
      const { error } = await supabase.from("rooms").insert({
        code,
        host_user_id: user?.id ?? null,
        host_guest_name: user ? null : hostName,
        time_control: tc,
        status: "waiting",
      });
      if (error) console.error(error);
    } catch (e) { console.error(e); }
    const link = `${window.location.origin}/play/${code}`;
    setCreatedLink(link);
    setCreatedCode(code);
    setCreating(false);
  };

  const join = () => {
    if (joinCode.trim()) navigate({ to: "/play/$roomId", params: { roomId: joinCode.trim().toUpperCase() } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Private Room</div>
        <h1 className="font-display text-4xl text-ink mb-2">Play a Friend</h1>
        <p className="font-serif text-ink-muted mb-8">Create a room, copy the link, send it to your friend. No login required for either side.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="dossier p-6">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Create Room</div>
            <label className="block font-sans text-xs text-ink-muted mb-2 uppercase tracking-wider">Time Control</label>
            <select value={tc} onChange={(e) => setTc(e.target.value)} className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm mb-4">
              <option value="blitz-3">Blitz · 3 min</option>
              <option value="blitz-5">Blitz · 5 min</option>
              <option value="rapid-10">Rapid · 10 min</option>
              <option value="unlimited">No clock</option>
            </select>
            <button onClick={create} disabled={creating} className="w-full px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep disabled:opacity-40">
              {creating ? "Creating…" : "Generate Invite Link"}
            </button>
            {createdLink && (
              <div className="mt-5 border-t border-border pt-4 animate-ledger-in">
                <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-1">Room Code</div>
                <div className="font-mono text-2xl text-forest mb-3">{createdCode}</div>
                <input readOnly value={createdLink} onClick={(e) => (e.target as HTMLInputElement).select()} className="w-full bg-paper border border-border px-3 py-2 font-mono text-xs mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(createdLink)} className="flex-1 px-3 py-2 border border-forest text-forest text-[11px] uppercase tracking-wider font-sans hover:bg-forest hover:text-primary-foreground">Copy Link</button>
                  <Link to="/play/$roomId" params={{ roomId: createdCode! }} className="flex-1 text-center px-3 py-2 bg-forest text-primary-foreground text-[11px] uppercase tracking-wider font-sans">Enter Room</Link>
                </div>
              </div>
            )}
          </div>

          <div className="dossier p-6">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Join Room</div>
            <label className="block font-sans text-xs text-ink-muted mb-2 uppercase tracking-wider">Room Code</label>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-full bg-paper border border-border px-3 py-2 font-mono text-lg uppercase tracking-widest mb-4" />
            <button onClick={join} className="w-full px-4 py-2 border border-forest text-forest text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest hover:text-primary-foreground">Enter Room</button>
            <p className="mt-6 font-serif text-sm text-ink-muted leading-relaxed">A room link looks like <span className="font-mono text-forest">/play/ABC123</span>. Anyone with the link can join — first to enter takes the open seat.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
