import React, { startTransition, useEffect, useRef, useState } from "react";
import { Info, Bot, X, Sparkles, User, Send, Compass } from "lucide-react";
import { useLocation, useRouter } from "@tanstack/react-router";

import { Board } from "@/components/game/Board";
import { cloneBoard, getAllValidMoves, moveToNotation } from "@/lib/game/engine";
import { getTemirBoardDemo } from "@/lib/temir-ai-demos";
import type {
  TemirAssistantRequest,
  TemirAssistantResponse,
  TemirCurrentBoardContext,
  TemirNavigateAction,
  TemirVisualBoard,
} from "@/lib/temir-ai-types";
import type { GameState } from "@/lib/game/types";
import { useGameStore } from "@/store/gameStore";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  navigate?: TemirNavigateAction | null;
  visualBoard?: TemirVisualBoard | null;
  followUpPrompt?: string | null;
}

interface LocalBoardSnapshot extends TemirCurrentBoardContext {
  visualMoves: ReturnType<typeof getAllValidMoves>;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "ai",
    content:
      "Hello. I am Temir AI. Ask me to analyze a position, explain a rule, teach a tactical theme, or open the right Checker.com section for you, and I will work through it like a checkers coach.",
  },
];

function buildCurrentBoardSnapshot(
  pathname: string,
  state: GameState,
): LocalBoardSnapshot | null {
  if (!pathname.startsWith("/play")) return null;
  if (state.status !== "playing") return null;

  const visualMoves = getAllValidMoves(state.board, state.currentTurn);
  return {
    board: cloneBoard(state.board),
    currentTurn: state.currentTurn,
    moves: visualMoves.map((move, index) => ({
      index,
      notation: moveToNotation(move),
      from: move.from,
      to: move.to,
      captures: move.captures.length,
      promotesToKing: move.promotesToKing,
    })),
    visualMoves,
  };
}

function serializeBoardSnapshot(snapshot: LocalBoardSnapshot | null): TemirCurrentBoardContext | null {
  if (!snapshot) return null;
  return {
    board: snapshot.board,
    currentTurn: snapshot.currentTurn,
    moves: snapshot.moves,
  };
}

function buildVisualBoardFromResponse(
  response: TemirAssistantResponse,
  snapshot: LocalBoardSnapshot | null,
): TemirVisualBoard | null {
  if (
    snapshot &&
    typeof response.recommendedMoveIndex === "number" &&
    response.recommendedMoveIndex >= 0 &&
    response.recommendedMoveIndex < snapshot.visualMoves.length
  ) {
    const move = snapshot.visualMoves[response.recommendedMoveIndex];
    const allCaptures = snapshot.visualMoves.filter((m) => m.captures.length > 0);
    const forcedCapture = allCaptures.length > 0;
    const highlightedSquares = [
      ...move.captures.map((p) => ({ row: p.row, col: p.col })),
      { row: move.to.row, col: move.to.col },
    ];
    const alternativeMoves = allCaptures.filter(
      (m) => !(m.from.row === move.from.row && m.from.col === move.from.col && m.to.row === move.to.row && m.to.col === move.to.col),
    );
    return {
      board: cloneBoard(snapshot.board),
      currentTurn: snapshot.currentTurn,
      selectedPiece: move.from,
      validMoves: [move],
      lastMove: null,
      caption: `Temir AI recommends ${moveToNotation(move)} here. The highlighted piece and landing square show the practical move.`,
      forcedCapture,
      highlightedSquares,
      alternativeMoves,
    };
  }

  if (response.boardDemoId) {
    return getTemirBoardDemo(response.boardDemoId);
  }

  return null;
}

export const FloatingAiAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isThinking, setIsThinking] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const location = useLocation();
  const gameState = useGameStore((s) => s.state);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isChatOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest(".floating-ai-button")) {
          setIsChatOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigateTo = (path: TemirNavigateAction["path"]) => {
    startTransition(() => {
      router.navigate({ to: path as never });
    });
  };

  const handleSend = async () => {
    if (!message.trim() || isThinking) return;

    const userContent = message.trim();
    const userMessage: ChatMessage = { role: "user", content: userContent };
    const nextMessages = [...messages, userMessage];
    const boardSnapshot = buildCurrentBoardSnapshot(location.pathname, gameState);
    const payload: TemirAssistantRequest = {
      message: userContent,
      history: nextMessages.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      currentPath: location.pathname,
      currentBoard: serializeBoardSnapshot(boardSnapshot),
    };

    setMessages(nextMessages);
    setMessage("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/temir-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data: TemirAssistantResponse | null = null;

      try {
        data = JSON.parse(raw) as TemirAssistantResponse;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.answer || raw || `Temir AI request failed with status ${response.status}`);
      }

      if (!data) {
        throw new Error("Temir AI returned an unreadable response.");
      }

      const aiMessage: ChatMessage = {
        role: "ai",
        content: data.answer,
        navigate: data.navigate,
        visualBoard: buildVisualBoardFromResponse(data, boardSnapshot),
        followUpPrompt: data.followUpPrompt,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.navigate?.autoOpen) {
        navigateTo(data.navigate.path);
      }
    } catch (error) {
      console.error("[Temir AI] Request failed:", error);
      const fallback =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Temir AI could not reach the analysis service just now. Please try again, and if you were asking about a position, include the move or theme you want help with.";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: fallback,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button
        className={`floating-ai-button relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform ${
          isChatOpen ? "rotate-90 scale-90 opacity-0 pointer-events-none" : "rotate-0 opacity-100"
        }`}
        onClick={() => setIsChatOpen(true)}
        style={{
          background: "linear-gradient(135deg, rgba(234,179,8,0.9) 0%, rgba(217,119,6,0.9) 100%)",
          boxShadow: "0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(217, 119, 6, 0.3)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>
        <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
        <div className="relative z-10 text-white shadow-sm">
          <Bot className="w-8 h-8" />
        </div>
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-amber-500"></div>
      </button>

      <div
        ref={chatRef}
        className={`absolute bottom-0 right-0 w-[400px] sm:w-[520px] transition-all duration-300 origin-bottom-right ${
          isChatOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-75 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative flex flex-col h-[680px] max-h-[88vh] rounded-3xl bg-zinc-900 shadow-[0_0_50px_-12px_rgba(217,119,6,0.5)] border border-amber-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-amber-900/20 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center border border-amber-500/30">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 hidden sm:block">Temir AI</h3>
                <h3 className="text-sm font-semibold text-zinc-100 sm:hidden">Temir</h3>
                <p className="text-xs text-amber-500/80 font-medium tracking-wide w-full truncate">
                  Live Checkers Analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                Temir Brain
              </span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 mr-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-100" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50 scroll-smooth custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="shrink-0 pt-1">
                  {msg.role === "ai" ? (
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </div>

                <div className={`max-w-[84%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-3`}>
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-amber-600 text-white rounded-tr-sm"
                        : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.navigate && (
                    <button
                      onClick={() => navigateTo(msg.navigate!.path)}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-amber-300 hover:bg-amber-500/20 transition"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      {msg.navigate.autoOpen ? `Opened ${msg.navigate.label}` : `Open ${msg.navigate.label}`}
                    </button>
                  )}

                  {msg.visualBoard && (
                    <div className="w-full rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">
                          Board Teaching View
                        </div>
                        {msg.visualBoard.forcedCapture && (
                          <div className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-300">
                            Forced capture
                          </div>
                        )}
                      </div>
                      {msg.visualBoard.forcedCapture && (
                        <div className="mb-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                          Captures are mandatory in this position — {msg.visualBoard.currentTurn === "red" ? "Red" : "Black"} must play a jump.
                        </div>
                      )}
                      <div className="mx-auto max-w-[300px]">
                        <Board
                          board={msg.visualBoard.board}
                          selectedPiece={msg.visualBoard.selectedPiece}
                          validMoves={msg.visualBoard.validMoves}
                          lastMove={msg.visualBoard.lastMove}
                          flipped={msg.visualBoard.currentTurn === "black"}
                          onSquareClick={() => {}}
                          highlightedSquares={msg.visualBoard.highlightedSquares}
                        />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{msg.visualBoard.caption}</p>
                    </div>
                  )}

                  {msg.followUpPrompt && (
                    <div className="text-xs text-zinc-400 italic">{msg.followUpPrompt}</div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2 h-12 text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                  <span className="ml-2">Temir is analyzing the position...</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-950 p-4 shrink-0 border-t border-amber-900/20 backdrop-blur-xl">
            <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full px-5 py-4 bg-transparent border-none outline-none resize-none text-[15px] text-zinc-100 placeholder-zinc-500 max-h-[120px] overflow-y-auto min-h-[56px] pr-14"
                placeholder="Ask Temir AI to analyze, teach, or open something in Checker.com..."
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={!message.trim() || isThinking}
                className="absolute right-3 bottom-2.5 p-2 bg-amber-600 rounded-xl text-white shadow-md disabled:bg-zinc-800 disabled:text-zinc-600 transition-all hover:bg-amber-500 active:scale-95"
              >
                <Send className="w-4 h-4 translate-x-px" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Checkers-specific reasoning and guided app actions
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Info className="w-3 h-3" />
                <span>Shift + Enter to break line</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.4);
        }
      `}</style>
    </div>
  );
};
