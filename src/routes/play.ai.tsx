import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { BookOpen, Send, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { useGameStore } from "@/store/gameStore";
import { DIFFICULTY_CONFIG } from "@/lib/game/ai";
import { coachChatLocal } from "@/lib/game/ai";
import type { AIDifficulty, PlayerColor, TimeControl } from "@/lib/game/types";
import { store } from "@/lib/storage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/play/ai")({
  head: () => ({
    meta: [
      { title: "Play AI — Checker.com" },
      { name: "description", content: "Play against five AI tiers. CIS rules: backward captures enabled." },
    ],
  }),
  component: PlayAI,
});

function formatTime(s: number) {
  if (s >= 86400) return "∞";
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function qualityColor(q?: string) {
  if (!q) return "var(--ink-muted)";
  if (q === "brilliant" || q === "great") return "var(--gold)";
  if (q === "blunder" || q === "mistake") return "var(--oxblood)";
  return "var(--ink-muted)";
}

function PlayAI() {
  const state       = useGameStore((s) => s.state);
  const initGame    = useGameStore((s) => s.initGame);
  const resign      = useGameStore((s) => s.resign);
  const resetGame   = useGameStore((s) => s.resetGame);
  const difficulty  = useGameStore((s) => s.aiDifficulty);
  const playerColor = useGameStore((s) => s.playerColor);
  const isAIThinking = useGameStore((s) => s.isAIThinking);
  const timeRed     = useGameStore((s) => s.timeRed);
  const timeBlack   = useGameStore((s) => s.timeBlack);
  const tickTimer   = useGameStore((s) => s.tickTimer);
  const timeControl = useGameStore((s) => s.timeControl);
  const hasSaved    = useGameStore((s) => s.hasSaved);

  const [started, setStarted] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [coachSession, setCoachSession] = useState<any>(null);
  const [coachTab, setCoachTab] = useState<"summary" | "moments" | "plan" | "chat">("summary");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "coach"; content: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) { initGame("vs-ai", 2, "rapid-10", "red"); setStarted(true); }
  }, [started, initGame]);

  useEffect(() => {
    if (state.status !== "playing" || timeControl === "unlimited") return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [state.status, timeControl, tickTimer]);

  // Show coach automatically after game ends and game is saved
  useEffect(() => {
    if (state.status === "finished" && hasSaved && !coachSession) {
      const gameId = useGameStore.getState().gameId;
      if (gameId) {
        const session = store.getCoachForGame(gameId);
        if (session) {
          setCoachSession(session);
          toast.success("Game saved · Coach review ready");
          setTimeout(() => setShowCoach(true), 800);
        }
      }
    }
  }, [state.status, hasSaved, coachSession]);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const gameOver = state.status === "finished";
  const allMoves = state.moveHistory;
  const hasMandatoryCapture = state.validMoves.some((m) => m.captures.length > 0);

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
    // Persist to coach session
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

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[260px_1fr_300px] gap-5">

        {/* LEFT — dossier */}
        <aside className="space-y-4">
          <div className="dossier">
            <div className="dossier-header">Opponent</div>
            <div className="p-4">
              <div className="font-display text-2xl text-ink">{cfg.name}</div>
              <div className="font-mono text-[11px] text-ink-muted mt-1">ELO {cfg.elo} · depth {cfg.depth}</div>
              <p className="font-serif text-sm text-ink-muted mt-3 leading-relaxed">{cfg.description}</p>
              {isAIThinking && (
                <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.2em] text-gold animate-pulse">Thinking…</div>
              )}
              {hasMandatoryCapture && state.status === "playing" && (
                <div className="mt-3 p-2 bg-oxblood/10 border border-oxblood/30 font-sans text-[10px] uppercase tracking-wider text-oxblood">
                  ⚠ Capture is mandatory
                </div>
              )}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Difficulty</div>
            <div className="p-3 grid grid-cols-5 gap-1">
              {(Object.keys(DIFFICULTY_CONFIG) as unknown as AIDifficulty[]).map((k) => {
                const d = Number(k) as AIDifficulty;
                return (
                  <button key={d}
                    onClick={() => initGame("vs-ai", d, timeControl, playerColor)}
                    disabled={state.status === "playing" && state.moveCount > 0}
                    className={`py-2 text-xs font-mono border transition ${
                      d === difficulty ? "bg-forest text-primary-foreground border-forest" : "border-border text-ink-muted hover:border-forest"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >{d + 1}</button>
                );
              })}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Time Control</div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {([ ["blitz-3","3 min"], ["blitz-5","5 min"], ["rapid-10","10 min"], ["unlimited","∞"] ] as [TimeControl, string][]).map(([tc, lbl]) => (
                <button key={tc}
                  onClick={() => initGame("vs-ai", difficulty, tc, playerColor)}
                  disabled={state.moveCount > 0}
                  className={`py-2 text-xs font-mono border transition ${
                    tc === timeControl ? "bg-forest text-primary-foreground border-forest" : "border-border text-ink-muted hover:border-forest"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >{lbl}</button>
              ))}
            </div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Your Color</div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {(["red","black"] as PlayerColor[]).map((c) => (
                <button key={c}
                  onClick={() => initGame("vs-ai", difficulty, timeControl, c)}
                  disabled={state.moveCount > 0}
                  className={`py-2 text-xs font-sans uppercase tracking-[0.15em] border transition ${
                    c === playerColor ? "bg-forest text-primary-foreground border-forest" : "border-border text-ink-muted hover:border-forest"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >{c === "red" ? "Oxblood" : "Forest"}</button>
              ))}
            </div>
          </div>

          <div className="dossier p-4 text-center">
            <div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">CIS Rules</div>
            <div className="font-serif text-xs text-ink-muted leading-relaxed">
              Simple pieces capture <span className="text-forest font-medium">forward & backward</span>. Kings fly multi-squares.
            </div>
          </div>
        </aside>

        {/* CENTER — board */}
        <div>
          <div className="flex items-center justify-between mb-3 font-mono text-sm">
            <div className={`px-3 py-1 ${state.currentTurn === "black" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
              {cfg.name} · {formatTime(timeBlack)}
            </div>
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Move {state.moveCount}
              {state.status === "playing" && (
                <span className="ml-2 text-forest">· {state.currentTurn === "red" ? "Oxblood" : "Forest"} to move</span>
              )}
            </div>
            <div className={`px-3 py-1 ${state.currentTurn === "red" ? "bg-forest text-primary-foreground" : "bg-paper text-ink-muted"}`}>
              You · {formatTime(timeRed)}
            </div>
          </div>

          <Board flipped={playerColor === "black"} />

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button onClick={() => resetGame()}
              className="px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">
              New Match
            </button>
            <button onClick={() => resign()} disabled={state.status !== "playing"}
              className="px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-[0.18em] font-sans hover:bg-oxblood hover:text-destructive-foreground disabled:opacity-40">
              Resign
            </button>
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

          {gameOver && (
            <div className="mt-6 dossier p-6 text-center animate-ledger-in">
              <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Match Concluded</div>
              <div className="font-display text-3xl text-ink">
                {state.winner === null ? "Draw" : state.winner === playerColor ? "Victory" : "Defeat"}
              </div>
              <div className="font-mono text-xs text-ink-muted mt-2">
                {state.reason} · {state.moveCount} moves
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button onClick={() => resetGame()}
                  className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">
                  Play Again
                </button>
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

        {/* RIGHT — ledger */}
        <aside className="dossier">
          <div className="dossier-header">Move Ledger</div>
          <div className="max-h-[480px] overflow-y-auto">
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
                    {h.move.captures && h.move.captures.length > 0 && (
                      <span className="text-[10px] text-oxblood">×{h.move.captures.length}</span>
                    )}
                    {h.quality && (
                      <span className="text-[10px] uppercase tracking-wider font-sans"
                        style={{ color: qualityColor(h.quality) }}>
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
        </aside>
      </div>

      {/* ─── COACH MODAL ─────────────────────────────────────────────── */}
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
              {/* Header */}
              <div className="dossier-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-gold" />
                  <span>Tactical Archive Report</span>
                </div>
                <button onClick={() => setShowCoach(false)} className="text-ink-muted hover:text-ink text-lg leading-none">✕</button>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 border-b border-border">
                {[
                  { label: "Result", value: coachSession.result },
                  { label: "Accuracy", value: `${coachSession.accuracy}%` },
                  { label: "Moves", value: coachSession.totalMoves },
                ].map((s) => (
                  <div key={s.label} className="p-3 text-center border-r last:border-r-0 border-border">
                    <div className="font-sans text-[10px] uppercase tracking-wider text-ink-muted">{s.label}</div>
                    <div className="font-display text-xl text-ink mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border overflow-x-auto">
                {(["summary","moments","plan","chat"] as const).map((tab) => (
                  <button key={tab} onClick={() => setCoachTab(tab)}
                    className={`py-3 px-4 font-sans text-[11px] uppercase tracking-wider whitespace-nowrap relative flex-shrink-0 ${coachTab === tab ? "text-forest font-medium" : "text-ink-muted hover:text-ink"}`}>
                    {tab === "chat" ? "Ask Coach" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {coachTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-forest" />}
                  </button>
                ))}
              </div>

              {/* Body */}
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
                    {coachSession.missedTactics?.length > 0 && (
                      <div>
                        <div className="font-sans text-[10px] uppercase tracking-widest text-ink-muted mb-2">Missed Tactics</div>
                        <ul className="space-y-1">
                          {coachSession.missedTactics.map((t: string, i: number) => (
                            <li key={i} className="text-sm text-ink-muted flex gap-2"><span className="text-oxblood">–</span>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                    <p className="text-sm text-ink-muted">Your personalised training plan based on this game:</p>
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
                        value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Ask the coach…"
                        className="flex-1 bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
                      />
                      <button onClick={sendChat}
                        className="px-3 py-2 bg-forest text-primary-foreground hover:bg-forest-deep transition">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["Why was my mistake bad?", "What was my best move?", "Give me a training plan", "Explain backward captures"].map((q) => (
                        <button key={q} onClick={() => { setChatInput(q); }}
                          className="text-[10px] px-2 py-1 border border-border text-ink-muted hover:border-forest hover:text-forest font-sans transition">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <button onClick={() => setShowCoach(false)}
                  className="w-full py-2.5 bg-forest text-primary-foreground text-xs uppercase tracking-[0.2em] font-sans hover:bg-forest-deep">
                  Return to Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
