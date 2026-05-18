import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createInitialBoard } from "@/lib/game/engine";
import { store } from "@/lib/storage";
import { coachChatLocal } from "@/lib/game/ai";
import type { PlayerColor, TimeControl } from "@/lib/game/types";

export const Route = createFileRoute("/play/$roomId")({
  head: ({ params }) => ({ meta: [{ title: `Room ${params.roomId} — Checker.com` }] }),
  component: Room,
});

const DEFAULT_TIME_CONTROL: TimeControl = "rapid-10";
const ROOM_SEAT_KEY_PREFIX = "checker.room-seat.";

type RoomSeat = "host" | "guest" | "spectator";
type RoomViewStatus = "loading" | "waiting" | "playing" | "finished" | "not-found";
type RoomOutcome = {
  status: "finished";
  winner: PlayerColor | null;
  reason: string | null;
};

function readStoredSeat(roomId: string): RoomSeat | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(`${ROOM_SEAT_KEY_PREFIX}${roomId}`);
  return value === "host" || value === "guest" ? value : null;
}

function storeSeat(roomId: string, seat: "host" | "guest") {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${ROOM_SEAT_KEY_PREFIX}${roomId}`, seat);
}

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
  storedSeat?: RoomSeat | null,
): RoomSeat {
  if (room.host_user_id === userId || (room.host_guest_name && room.host_guest_name === guestName)) {
    return "host";
  }
  if (room.guest_user_id === userId || (room.guest_guest_name && room.guest_guest_name === guestName)) {
    return "guest";
  }
  if (storedSeat === "host" && (room.host_user_id || room.host_guest_name)) {
    return "host";
  }
  if (storedSeat === "guest" && (room.guest_user_id || room.guest_guest_name || (!room.guest_user_id && !room.guest_guest_name))) {
    return "guest";
  }
  if (!room.guest_user_id && !room.guest_guest_name) {
    return "guest";
  }
  return "spectator";
}

function readOutcomeMeta(room: any): RoomOutcome | null {
  const payload = room?.chat_messages;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const outcome = (payload as Record<string, unknown>).outcome;
  if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) return null;
  const raw = outcome as Record<string, unknown>;
  const winner = raw.winner === "red" || raw.winner === "black" ? raw.winner : null;
  const reason = typeof raw.reason === "string" ? raw.reason : null;
  return raw.status === "finished" ? { status: "finished", winner, reason } : null;
}

function buildOutcomePayload(state: ReturnType<typeof useGameStore.getState>["state"]) {
  if (state.status !== "finished") return [];
  return {
    outcome: {
      status: "finished" as const,
      winner: state.winner,
      reason: state.reason ?? null,
    },
  };
}

function statusLabel(status: RoomViewStatus) {
  if (status === "loading") return "Loading…";
  if (status === "waiting") return "Awaiting opponent";
  if (status === "finished") return "Match complete";
  return "Match in progress";
}

function qualityColor(q?: string) {
  if (!q) return "var(--ink-muted)";
  if (q === "brilliant" || q === "great") return "var(--gold)";
  if (q === "blunder" || q === "mistake") return "var(--oxblood)";
  return "var(--ink-muted)";
}

function Room() {
  const { roomId } = Route.useParams();
  const { user, localUser } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState<RoomViewStatus>("loading");
  const initGame = useGameStore((s) => s.initGame);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const setOpponentLabel = useGameStore((s) => s.setOpponentLabel);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const state = useGameStore((s) => s.state);
  const hasSaved = useGameStore((s) => s.hasSaved);
  const gameId = useGameStore((s) => s.gameId);
  const [seat, setSeat] = useState<RoomSeat>("spectator");
  const initializedStoreFor = useRef<string | null>(null);
  const lastAppliedSnapshotRef = useRef<string | null>(null);
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);
  const [showCoach, setShowCoach] = useState(false);
  const [coachSession, setCoachSession] = useState<any>(null);
  const [coachTab, setCoachTab] = useState<"summary" | "moments" | "plan" | "chat">("summary");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "coach"; content: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const playerColor: PlayerColor = seat === "guest" ? "black" : "red";
  const opponentLabel =
    seat === "host"
      ? (room?.guest_guest_name || (room?.guest_user_id ? "Member" : "Guest"))
      : seat === "guest"
        ? (room?.host_guest_name || (room?.host_user_id ? "Member" : "Host"))
        : "Room Opponent";
  const allMoves = state.moveHistory;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (seat !== "spectator") {
      setOpponentLabel(opponentLabel);
    }
  }, [seat, opponentLabel, setOpponentLabel]);

  useEffect(() => {
    if (state.status === "finished" && hasSaved && !coachSession && gameId) {
      const session = store.getCoachForGame(gameId);
      if (session) {
        setCoachSession(session);
        toast.success("Friend match saved · Coach review ready");
        setTimeout(() => setShowCoach(true), 800);
      }
    }
  }, [state.status, hasSaved, coachSession, gameId]);

  const getRoomSnapshot = (nextRoom: any) =>
    JSON.stringify({
      board: nextRoom?.board ?? null,
      currentTurn: nextRoom?.current_turn === "black" ? "black" : "red",
      moveHistory: nextRoom?.move_history ?? [],
      status: nextRoom?.status ?? "waiting",
      outcome: readOutcomeMeta(nextRoom),
    });

  const getLocalSnapshot = () =>
    JSON.stringify({
      board: state.board,
      currentTurn: state.currentTurn,
      moveHistory: state.moveHistory,
      status: state.status,
      winner: state.winner,
      reason: state.reason,
    });

  const applyRoomState = (nextRoom: any) => {
    const storedSeat = readStoredSeat(roomId);
    const nextSeat = getSeat(nextRoom, user?.id, localUser?.display_name, storedSeat);
    const outcome = readOutcomeMeta(nextRoom);
    const nextStatus: RoomViewStatus =
      outcome?.status === "finished" || nextRoom.status === "finished"
        ? "finished"
        : nextRoom.status === "playing"
          ? "playing"
          : "waiting";
    const nextSnapshot = getRoomSnapshot(nextRoom);

    setRoom(nextRoom);
    setSeat(nextSeat);
    setStatus(nextStatus);

    if (nextSeat === "host" || nextSeat === "guest") {
      storeSeat(roomId, nextSeat);
    }

    if (nextSeat !== "spectator" && nextRoom.board && lastAppliedSnapshotRef.current !== nextSnapshot) {
      useGameStore.getState().syncOnlineRoomState({
        board: nextRoom.board,
        currentTurn: nextRoom.current_turn === "black" ? "black" : "red",
        moveHistory: nextRoom.move_history ?? [],
        status: nextStatus === "finished" ? "finished" : nextStatus === "playing" ? "playing" : "waiting",
        winner: outcome?.winner ?? null,
        reason: outcome?.reason ?? null,
      });
      lastAppliedSnapshotRef.current = nextSnapshot;
      lastSyncedSnapshotRef.current = nextSnapshot;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("rooms").select("*").eq("code", roomId).maybeSingle();
      if (!mounted) return;
      if (!data) {
        const { data: created } = await supabase.from("rooms").insert({
          code: roomId,
          host_user_id: user?.id ?? null,
          host_guest_name: user ? null : (localUser?.display_name || localUser?.username || "Host"),
          board: createInitialBoard() as any,
          current_turn: "red",
          move_history: [] as any,
          chat_messages: [] as any,
          time_control: "rapid-10",
          status: "waiting",
        }).select().maybeSingle();
        if (created) {
          storeSeat(roomId, "host");
          applyRoomState(created);
        }
      } else {
        applyRoomState(data);
      }
    })();

    const channel = supabase.channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${roomId}` }, (payload: any) => {
        if (payload.new) {
          applyRoomState(payload.new);
        }
      }).subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id, localUser?.display_name]);

  useEffect(() => {
    let cancelled = false;

    const refreshRoom = async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("code", roomId).maybeSingle();
      if (cancelled || error || !data) return;
      applyRoomState(data);
    };

    void refreshRoom();
    const interval = window.setInterval(() => {
      void refreshRoom();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomId, user?.id, localUser?.display_name]);

  useEffect(() => {
    if (!room || seat === "spectator") return;

    const bootstrapKey = `${roomId}:${seat}`;
    const board = room.board ?? createInitialBoard();
    const timeControl = normalizeTimeControl(room.time_control);
    const currentTurn = room.current_turn === "black" ? "black" : "red";

    setPlayerColor(playerColor);
    setOpponentLabel(opponentLabel);

    if (initializedStoreFor.current !== bootstrapKey) {
      initGame("vs-human-online", 0, timeControl, playerColor);
      useGameStore.getState().syncOnlineRoomState({
        board,
        currentTurn,
        moveHistory: room.move_history ?? [],
        status: readOutcomeMeta(room)?.status === "finished" || room.status === "finished"
          ? "finished"
          : room.status === "playing"
            ? "playing"
            : "waiting",
        winner: readOutcomeMeta(room)?.winner ?? null,
        reason: readOutcomeMeta(room)?.reason ?? null,
      });
      initializedStoreFor.current = bootstrapKey;
    }

    if (!room.board) {
      void supabase.from("rooms").update({
        board: board as any,
        current_turn: currentTurn,
        move_history: room.move_history ?? [],
      }).eq("code", roomId);
    }
  }, [room, roomId, seat, initGame, playerColor, setOpponentLabel, setPlayerColor, opponentLabel]);

  useEffect(() => {
    if (!room || seat === "spectator" || status === "loading" || status === "waiting") return;
    if (syncInFlightRef.current) return;

    const localSnapshot = getLocalSnapshot();
    const roomSnapshot = getRoomSnapshot(room);
    if (localSnapshot === roomSnapshot || localSnapshot === lastSyncedSnapshotRef.current) return;
    if (state.moveCount < (room.move_history?.length ?? 0)) return;

    syncInFlightRef.current = true;

    void (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .update({
          board: state.board as any,
          current_turn: state.currentTurn,
          move_history: state.moveHistory as any,
          chat_messages: buildOutcomePayload(state) as any,
          status: state.status === "finished" ? "finished" : "playing",
        })
        .eq("code", roomId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[Room Sync] Failed to sync move:", error);
      } else if (data) {
        lastSyncedSnapshotRef.current = localSnapshot;
        applyRoomState(data);
      }

      syncInFlightRef.current = false;
    })();
  }, [state, status, room, roomId, seat]);

  const takeSeat = async () => {
    const name = user?.user_metadata?.display_name || localUser?.display_name || localUser?.username || "Guest";
    const { data, error } = await supabase
      .from("rooms")
      .update({
        guest_user_id: user?.id ?? null,
        guest_guest_name: user ? null : name,
        status: "playing",
      })
      .eq("code", roomId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Room Sync] Failed to take guest seat:", error);
      return;
    }

    storeSeat(roomId, "guest");
    if (data) {
      applyRoomState(data);
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !coachSession) return;
    const q = chatInput.trim();
    setChatInput("");
    const answer = coachChatLocal(q, coachSession);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "coach", content: answer },
    ]);
    const updated = {
      ...coachSession,
      messages: [
        ...coachSession.messages,
        { role: "user" as const, content: q, ts: Date.now() },
        { role: "coach" as const, content: answer, ts: Date.now() },
      ],
    };
    setCoachSession(updated);
    store.saveCoach(updated);
  };

  const link = typeof window !== "undefined" ? `${window.location.origin}/play/${roomId}` : "";
  const handleBoardClick = (row: number, col: number) => {
    if (status !== "playing" || seat === "spectator") return;
    selectPiece(row, col);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold">Private Room</div>
              <div className="font-display text-3xl text-ink">{roomId}</div>
            </div>
            <div className={`px-3 py-1 font-sans text-[11px] uppercase tracking-wider ${status === "playing" ? "bg-forest text-primary-foreground" : status === "finished" ? "bg-gold text-ink" : "bg-paper border border-border text-ink-muted"}`}>
              {statusLabel(status)}
            </div>
          </div>

          <Board flipped={seat === "guest"} onSquareClick={handleBoardClick} />

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Link to="/play" className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-[0.18em] font-sans hover:border-forest hover:text-forest">
              Lobby
            </Link>
            {coachSession && (
              <button onClick={() => setShowCoach(true)}
                className="px-4 py-2 border border-gold text-gold text-xs uppercase tracking-[0.18em] font-sans hover:bg-gold/5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Coach
              </button>
            )}
          </div>

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

          {state.status === "finished" && seat !== "spectator" && (
            <div className="mt-6 dossier p-6 text-center animate-ledger-in">
              <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Concluded</div>
              <div className="font-display text-3xl text-ink">
                {state.winner === null ? "Draw" : state.winner === playerColor ? "Victory" : "Defeat"}
              </div>
              <div className="font-mono text-xs text-ink-muted mt-2">
                {state.reason} · {state.moveCount} moves
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {coachSession ? (
                  <button onClick={() => setShowCoach(true)}
                    className="px-6 py-2 border border-gold text-gold text-xs uppercase tracking-[0.18em] font-sans hover:bg-gold/5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Coach Review
                  </button>
                ) : (
                  <div className="px-6 py-2 border border-border text-ink-muted text-xs font-sans animate-pulse">
                    Generating review…
                  </div>
                )}
                <Link to="/analysis"
                  className="px-6 py-2 border border-border text-ink-muted text-xs uppercase tracking-[0.18em] font-sans hover:border-forest hover:text-forest">
                  Archive →
                </Link>
              </div>
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

          <div className="border-t border-border">
            <div className="dossier-header border-0">Move Ledger</div>
            <div className="max-h-[320px] overflow-y-auto">
              {allMoves.length === 0 && (
                <div className="p-4 font-serif text-sm text-ink-muted italic">The board awaits the first move.</div>
              )}
              <ol>
                {allMoves.map((h, i) => {
                  const pair = Math.floor(i / 2) + 1;
                  const isRed = h.player === "red";
                  return (
                    <li key={i} className="ledger-row flex items-baseline justify-between gap-2">
                      <span className="text-ink-muted w-7 text-[10px]">{isRed ? `${pair}.` : ""}</span>
                      <span className="flex-1 text-ink font-mono text-sm">{h.notation}</span>
                      {h.move.captures.length > 0 && (
                        <span className="text-[10px] text-oxblood">×{h.move.captures.length}</span>
                      )}
                      {h.quality && (
                        <span className="text-[10px] uppercase tracking-wider font-sans" style={{ color: qualityColor(h.quality) }}>
                          {h.quality[0]}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
            {coachSession && (
              <div className="border-t border-border p-3">
                <button onClick={() => { setShowCoach(true); setCoachTab("summary"); }}
                  className="w-full py-2 bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-wider font-sans hover:bg-gold/20 flex items-center justify-center gap-2">
                  <BookOpen className="w-3 h-3" /> Open Coach Review
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showCoach && coachSession && (
          <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4" onClick={() => setShowCoach(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card dossier max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dossier-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-gold" />
                  <span>Tactical Archive Report</span>
                </div>
                <button onClick={() => setShowCoach(false)} className="text-ink-muted hover:text-ink text-lg leading-none">✕</button>
              </div>

              <div className="grid grid-cols-3 border-b border-border">
                {[
                  { label: "Result", value: coachSession.result },
                  { label: "Accuracy", value: `${coachSession.accuracy}%` },
                  { label: "Moves", value: coachSession.totalMoves },
                ].map((item) => (
                  <div key={item.label} className="p-3 text-center border-r last:border-r-0 border-border">
                    <div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted">{item.label}</div>
                    <div className="font-display text-xl text-ink mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex border-b border-border overflow-x-auto">
                {(["summary", "moments", "plan", "chat"] as const).map((tab) => (
                  <button key={tab} onClick={() => setCoachTab(tab)}
                    className={`py-3 px-4 font-sans text-[11px] uppercase tracking-wider whitespace-nowrap relative flex-shrink-0 ${coachTab === tab ? "text-forest font-medium" : "text-ink-muted hover:text-ink"}`}>
                    {tab === "chat" ? "Ask Coach" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {coachTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-forest" />}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1 font-serif text-ink leading-relaxed">
                {coachTab === "summary" && (
                  <div className="space-y-5">
                    <p className="text-ink-muted">{coachSession.overview}</p>
                    <div className="p-4 bg-gold/5 border border-gold/20">
                      <div className="font-sans text-[10px] uppercase tracking-widest text-gold mb-2">★ Best Moment — Move {coachSession.bestMoment.moveNumber}</div>
                      <p className="font-mono text-sm text-ink">{coachSession.bestMoment.notation}</p>
                      <p className="mt-2 text-sm text-ink-muted">{coachSession.bestMoment.why}</p>
                    </div>
                    <div className="p-4 bg-oxblood/5 border border-oxblood/20">
                      <div className="font-sans text-[10px] uppercase tracking-widest text-oxblood mb-2">✗ Biggest Mistake — Move {coachSession.biggestMistake.moveNumber}</div>
                      <p className="font-mono text-sm text-ink">{coachSession.biggestMistake.notation}</p>
                      <p className="mt-2 text-sm text-ink-muted">{coachSession.biggestMistake.why}</p>
                      {coachSession.biggestMistake.betterIdea && (
                        <p className="mt-2 text-sm text-forest">💡 {coachSession.biggestMistake.betterIdea}</p>
                      )}
                    </div>
                  </div>
                )}

                {coachTab === "moments" && (
                  <div className="space-y-4 font-mono text-sm">
                    {coachSession.keyMoments.length === 0 && <p className="text-ink-muted italic font-serif">No notable moments flagged.</p>}
                    {coachSession.keyMoments.map((m: any, i: number) => (
                      <div key={i} className="flex gap-4 border-b border-dashed border-border pb-3">
                        <div className="text-gold mt-0.5 shrink-0">Move {Math.ceil(m.move / 2)}.</div>
                        <div className="font-serif text-sm">{m.note}</div>
                      </div>
                    ))}
                  </div>
                )}

                {coachTab === "plan" && (
                  <div className="space-y-4">
                    {[
                      { label: "Study Lesson", value: coachSession.trainingPlan.lesson, link: "/learn", icon: "📖" },
                      { label: "Practice Drill", value: coachSession.trainingPlan.drill, link: "/train", icon: "🎯" },
                      { label: "Puzzle Theme", value: coachSession.trainingPlan.puzzle, link: "/puzzles", icon: "♟" },
                    ].map((item) => (
                      <a key={item.label} href={item.link}
                        className="flex items-center gap-4 p-4 dossier hover:border-gold transition group">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted">{item.label}</div>
                          <div className="font-display text-lg text-ink group-hover:text-forest transition">{item.value}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-forest transition" />
                      </a>
                    ))}
                  </div>
                )}

                {coachTab === "chat" && (
                  <div className="flex flex-col h-full min-h-[300px]">
                    <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-64">
                      {chatMessages.length === 0 && (
                        <p className="text-ink-muted italic text-sm">Ask the coach about your game. Try: "Why was my biggest mistake bad?" or "Give me a training plan."</p>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`text-sm ${msg.role === "coach" ? "text-ink" : "text-forest font-medium"}`}>
                          <span className="font-sans text-[10px] uppercase tracking-wider text-ink-muted block mb-1">
                            {msg.role === "coach" ? "Coach" : "You"}
                          </span>
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Ask the coach…"
                        className="flex-1 bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
                      />
                      <button onClick={sendChat}
                        className="px-3 py-2 bg-forest text-primary-foreground hover:bg-forest-deep transition">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
