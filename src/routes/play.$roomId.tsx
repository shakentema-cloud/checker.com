import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createInitialBoard } from "@/lib/game/engine";
import type { TimeControl } from "@/lib/game/types";

export const Route = createFileRoute("/play/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Room ${params.roomId} — Checker.com` }] }),
  component: Room,
});

const DEFAULT_TIME_CONTROL: TimeControl = "rapid-10";

function normalizeTimeControl(value: unknown): TimeControl {
  if (
    value === "blitz-3" ||
    value === "blitz-5" ||
    value === "rapid-10" ||
    value === "rapid-30" ||
    value === "daily" ||
    value === "unlimited"
  ) {
    return value;
  }
  return DEFAULT_TIME_CONTROL;
}

function getSeat(
  room: any,
  userId?: string,
  guestName?: string,
): "host" | "guest" | "spectator" {
  if (room.host_user_id === userId || (room.host_guest_name && room.host_guest_name === guestName)) {
    return "host";
  }
  if (room.guest_user_id === userId || (room.guest_guest_name && room.guest_guest_name === guestName)) {
    return "guest";
  }
  if (!room.guest_user_id && !room.guest_guest_name) {
    return "guest";
  }
  return "spectator";
}

function Room() {
  const { roomId } = Route.useParams();
  const { user, localUser: guest } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "playing" | "not-found">("loading");
  const initGame = useGameStore((s) => s.initGame);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const state = useGameStore((s) => s.state);
  const [seat, setSeat] = useState<"host" | "guest" | "spectator">("spectator");
  const initializedStoreFor = useRef<string | null>(null);

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
          board: createInitialBoard() as any,
          current_turn: "red",
          move_history: [] as any,
          time_control: "rapid-10",
          status: "waiting",
        }).select().maybeSingle();
        setRoom(created);
        setSeat("host");
        setStatus("waiting");
      } else {
        setRoom(data);
        setSeat(getSeat(data, user?.id, guest?.display_name));
        setStatus(data.status === "playing" ? "playing" : "waiting");
      }
    })();

    const channel = supabase.channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${roomId}` }, (payload: any) => {
        if (payload.new) {
          setRoom(payload.new);
          setSeat(getSeat(payload.new, user?.id, guest?.display_name));
          setStatus(payload.new.status === "playing" ? "playing" : "waiting");
          if (payload.new.board) {
            useGameStore.getState().applyRemoteState(payload.new.board, payload.new.current_turn, payload.new.move_history ?? []);
          }
        }
      }).subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [roomId, user, guest]);

  // Bootstrap online state once per room seat so the AI mode never leaks into friend matches.
  useEffect(() => {
    if (!room || seat === "spectator") return;

    const playerColor = seat === "guest" ? "black" : "red";
    const bootstrapKey = `${roomId}:${seat}`;
    const board = room.board ?? createInitialBoard();
    const timeControl = normalizeTimeControl(room.time_control);
    const currentTurn = room.current_turn === "black" ? "black" : "red";

    setPlayerColor(playerColor);

    if (initializedStoreFor.current !== bootstrapKey) {
      initGame("vs-human-online", 0, timeControl, playerColor);
      useGameStore.getState().applyRemoteState(board, currentTurn, room.move_history ?? []);
      initializedStoreFor.current = bootstrapKey;
    }

    if (!room.board) {
      void supabase.from("rooms").update({
        board: board as any,
        current_turn: currentTurn,
        move_history: room.move_history ?? [],
      }).eq("code", roomId);
    }
  }, [room, roomId, seat, initGame, setPlayerColor]);

  // Sync our moves to the server
  useEffect(() => {
    if (status !== "playing") return;
    if (!room || seat === "spectator") return;
    // We only broadcast if WE just made a move (which means it's now the OTHER player's turn, OR we just took a piece and we are a specific player).
    // Actually, simpler: if our local moveCount is greater than the room's moveHistory length, it means we made a move locally.
    const roomMoves = room.move_history?.length || 0;
    if (state.moveCount > roomMoves) {
      void supabase.from("rooms").update({
        board: state.board as any,
        current_turn: state.currentTurn,
        move_history: state.moveHistory.map(m => m.notation) as any
      }).eq("code", roomId);
    }
  }, [state.board, state.currentTurn, state.moveCount, state.moveHistory, status, room, roomId, seat]);

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
  const handleBoardClick = (row: number, col: number) => {
    if (status !== "playing" || seat === "spectator") return;
    selectPiece(row, col);
  };

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
          <Board flipped={seat === "guest"} onSquareClick={handleBoardClick} />
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
