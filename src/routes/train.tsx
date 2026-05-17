import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { createEmptyBoard, getValidMovesForPiece, applyMove } from "@/lib/game/engine";
import type { Board as BoardType, Move, Position } from "@/lib/game/types";
import { toast } from "sonner";

export const Route = createFileRoute("/train")({
  head: () => ({ meta: [{ title: "Dojo — Checker.com" }] }),
  component: Train,
});

const DRILLS = [
  {
    id: "capture-scan",
    title: "Capture Scan",
    description: "Identify and execute the mandatory capture. If there are multiple, any valid capture will advance this drill.",
    setup: () => {
      const b = createEmptyBoard();
      b[5][2] = { color: "red", type: "man", id: "t1-r1" };
      b[4][3] = { color: "black", type: "man", id: "t1-b1" };
      return b;
    }
  },
  {
    id: "king-leap",
    title: "The King's Flight",
    description: "Use your king to capture a distant piece. Remember: kings in this club fly across the full diagonal.",
    setup: () => {
      const b = createEmptyBoard();
      b[7][0] = { color: "red", type: "king", id: "t2-r1" };
      b[2][5] = { color: "black", type: "man", id: "t2-b1" };
      return b;
    }
  },
  {
    id: "back-rank",
    title: "Back Rank Integrity",
    description: "Prevent promotion by choosing the move that keeps your back rank protected.",
    setup: () => {
      const b = createEmptyBoard();
      b[7][2] = { color: "red", type: "man", id: "t3-r1" };
      b[7][4] = { color: "red", type: "man", id: "t3-r2" };
      b[1][0] = { color: "black", type: "man", id: "t3-b1" }; // Black man near promotion
      return b;
    }
  }
];

function Train() {
  const [activeDrill, setActiveDrill] = useState(0);
  const [board, setBoard] = useState<BoardType>(DRILLS[0].setup());
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [score, setScore] = useState(0);

  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);

  useEffect(() => {
    setBoard(DRILLS[activeDrill].setup());
    setLastMove(null);
    setSelectedPiece(null);
    setValidMoves([]);
  }, [activeDrill]);

  const handleSquareClick = (r: number, c: number) => {
    if (selectedPiece) {
      const move = validMoves.find((m) => m.to.row === r && m.to.col === c);
      
      if (move) {
        const isCaptureDrill = DRILLS[activeDrill].id === "capture-scan";
        if (isCaptureDrill && move.captures.length === 0) {
            toast.error("Incorrect. A capture was mandatory.");
            setSelectedPiece(null);
            setValidMoves([]);
            return;
        }
        
        setBoard(applyMove(board, move));
        setLastMove(move);
        setScore(s => s + 10);
        toast.success("Well played.");
        setSelectedPiece(null);
        setValidMoves([]);
        
        setTimeout(() => {
          if (activeDrill < DRILLS.length - 1) {
              setActiveDrill(activeDrill + 1);
          } else {
              toast("Dojo circuit complete!");
              setActiveDrill(0);
          }
        }, 1500);
        return;
      }
      
      if (selectedPiece.row === r && selectedPiece.col === c) {
        setSelectedPiece(null);
        setValidMoves([]);
        return;
      }
    }

    const piece = board[r][c];
    if (piece && piece.color === "red") {
      setSelectedPiece({ row: r, col: c });
      setValidMoves(getValidMovesForPiece(board, { row: r, col: c }, "red"));
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-12 grid md:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Tactical Dojo</div>
          <h1 className="font-display text-4xl text-ink mb-6">Interactive Drills</h1>
          
          <div className="bg-paper border border-border p-8 flex flex-col items-center">
            <Board 
              board={board} 
              selectedPiece={selectedPiece}
              validMoves={validMoves}
              lastMove={lastMove} 
              onSquareClick={handleSquareClick}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="dossier p-6">
            <div className="font-sans text-[10px] uppercase tracking-widest text-gold mb-2">Current Rank</div>
            <div className="font-display text-3xl text-ink">Apprentice</div>
            <div className="mt-4 bg-border h-1.5 rounded-full overflow-hidden">
               <div className="bg-gold h-full transition-all duration-1000" style={{ width: `${(score % 100)}%` }} />
            </div>
            <div className="mt-2 font-mono text-[10px] text-ink-muted uppercase">Score: {score}</div>
          </div>

          <div className="dossier">
            <div className="dossier-header">Mission Ledger</div>
            <div className="p-4 space-y-4">
               {DRILLS.map((d, i) => (
                 <div key={d.id} className={`p-3 border rounded transition ${i === activeDrill ? "border-gold bg-gold/5" : "border-border"}`}>
                    <div className="font-display text-lg text-ink">{d.title}</div>
                    <p className="font-serif text-xs text-ink-muted mt-1 leading-relaxed">{d.description}</p>
                 </div>
               ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
