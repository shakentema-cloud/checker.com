import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/play/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Room ${params.roomId} — Checker.com` }] }),
  component: Room,
});

function Room() {
  const { roomId } = Route.useParams();
  const { user, localUser: guest } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "playing" | "not-found">("loading");
  const initGame = useGameStore((s) => s.initGame);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const state = useGameStore((s) => s.state);
  const [seat, setSeat] = useState<"host" | "guest" | "spectator">("spectator");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("rooms").select("*").eq("code", roomId).maybeSingle();
      if (!mounted) return;
      if (!data) {
        // Create on-the-fly so direct link never 404s
        const { data: created } = await supabase.from("rooms").insert({
          code: roomId,
          host_user_id: user?.id ?? null,
          host_guest_name: user ? null : (guest?.display_name ?? "Host"),
          time_control: "rapid-10",
          status: "waiting",
        }).select().maybeSingle();
        setRoom(created);
        setSeat("host");
        setStatus("waiting");
      } else {
        setRoom(data);
        if (data.host_user_id === user?.id || (data.host_guest_name && data.host_guest_name === guest?.display_name)) {
          setSeat("host");
        } else if (data.guest_user_id === user?.id || (data.guest_guest_name && data.guest_guest_name === guest?.display_name)) {
          setSeat("guest");
        } else if (!data.guest_user_id && !data.guest_guest_name) {
          setSeat("guest");
        } else {
          setSeat("spectator");
        }
        setStatus(data.status === "playing" ? "playing" : "waiting");
      }
    })();

    const channel = supabase.channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${roomId}` }, (payload: any) => {
        if (payload.new) {
          setRoom(payload.new);
          if (payload.new.status === "playing") setStatus("playing");
          if (payload.new.board) {
            useGameStore.getState().applyRemoteState(payload.new.board, payload.new.current_turn, payload.new.move_history ?? []);
          }
        }
      }).subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [roomId, user, guest]);

  // Handle color enforcement
  useEffect(() => {
    if (seat === "host") setPlayerColor("red");
    else if (seat === "guest") setPlayerColor("black");
    // Only init if we are hosting, the guests will receive state via Supabase realtime
    if (seat === "host" && status === "loading") {
      initGame("vs-human-online", 0, "rapid-10", "red");
    }
  }, [seat, setPlayerColor, initGame, status]);

  // Sync our moves to the server
  useEffect(() => {
    if (status !== "playing") return;
    if (!room) return;
    // We only broadcast if WE just made a move (which means it's now the OTHER player's turn, OR we just took a piece and we are a specific player).
    // Actually, simpler: if our local moveCount is greater than the room's moveHistory length, it means we made a move locally.
    const roomMoves = room.move_history?.length || 0;
    if (state.moveCount > roomMoves) {
      supabase.from("rooms").update({
        board: state.board as any,
        current_turn: state.currentTurn,
        move_history: state.moveHistory.map(m => m.notation) as any
      }).eq("code", roomId).then();
    }
  }, [state.moveCount, status, room, roomId]);

  const takeSeat = async () => {
    const name = user?.user_metadata?.display_name || guest?.display_name || "Guest";
    await supabase.from("rooms").update({
      guest_user_id: user?.id ?? null,
      guest_guest_name: user ? null : name,
      status: "playing",
    }).eq("code", roomId);
    setSeat("guest");
    setStatus("playing");
  };

  const link = typeof window !== "undefined" ? `${window.location.origin}/play/${roomId}` : "";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold">Private Room</div>
              <div className="font-display text-3xl text-ink">{roomId}</div>
            </div>
            <div className={`px-3 py-1 font-sans text-[11px] uppercase tracking-wider ${status === "playing" ? "bg-forest text-primary-foreground" : "bg-paper border border-border text-ink-muted"}`}>
              {status === "loading" ? "Loading…" : status === "waiting" ? "Awaiting opponent" : "Match in progress"}
            </div>
          </div>
          <Board flipped={seat === "guest"} />
          {status === "waiting" && seat === "host" && (
            <div className="mt-4 dossier p-4">
              <div className="font-sans text-[11px] uppercase tracking-wider text-gold mb-2">Share this link</div>
              <input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()} className="w-full bg-paper border border-border px-3 py-2 font-mono text-xs mb-2" />
              <button onClick={() => navigator.clipboard.writeText(link)} className="px-3 py-1.5 border border-forest text-forest text-[11px] uppercase tracking-wider font-sans hover:bg-forest hover:text-primary-foreground">Copy</button>
            </div>
          )}
          {status === "waiting" && seat === "guest" && (
            <div className="mt-4 dossier p-4 text-center">
              <p className="font-serif text-ink-muted mb-3">The seat is open. Take it to start the match.</p>
              <button onClick={takeSeat} className="px-5 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">Join as Guest</button>
            </div>
          )}
        </div>
        <aside className="dossier">
          <div className="dossier-header">Room Roster</div>
          <div className="p-4 space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Host</span><span>{room?.host_guest_name || (room?.host_user_id ? "Member" : "—")}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Guest</span><span>{room?.guest_guest_name || (room?.guest_user_id ? "Member" : "—")}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Time</span><span>{room?.time_control ?? "rapid-10"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Move</span><span>{state.moveCount}</span></div>
          </div>
          <div className="border-t border-border p-4">
            <Link to="/play" className="font-sans text-[11px] uppercase tracking-wider text-forest hover:text-gold">← Back to lobby</Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
