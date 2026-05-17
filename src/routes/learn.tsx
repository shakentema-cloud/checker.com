import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Board } from "@/components/game/Board";
import { createEmptyBoard, getValidMovesForPiece, applyMove } from "@/lib/game/engine";
import { Board as BoardType, Move, Position } from "@/lib/game/types";
import { BackgroundPaths } from "@/components/ui/background-paths";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { BookOpen, Shield, Crown, Play, Star } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "Library — Checker.com" }] }),
  component: Learn,
});

const LESSONS = [
  { section: "Fundamentals", title: "How the pieces move", level: "Beginner", duration: "5 min", text: "Men move diagonally forward one square. They capture by jumping over an adjacent enemy piece into an empty square beyond. Captures are mandatory in standard rules — if you can take, you must.", 
    board: (() => {
      const b = createEmptyBoard();
      b[5][2] = { color: "red", type: "man", id: "l1-1" };
      b[4][3] = { color: "black", type: "man", id: "l1-2" };
      return b;
    })()
  },
  { section: "Fundamentals", title: "Mandatory captures", level: "Beginner", duration: "6 min", text: "When a capture is available, you cannot make a quiet move. Choose any capturing piece — there is no rule of choosing the longest sequence in English draughts; one of the available capture chains must be played in full.",
    board: (() => {
      const b = createEmptyBoard();
      b[4][3] = { color: "red", type: "man", id: "l2-1" };
      b[3][2] = { color: "black", type: "man", id: "l2-2" };
      b[3][4] = { color: "black", type: "man", id: "l2-3" };
      return b;
    })()
  },
  { section: "Captures", title: "Multi-jumps", level: "Beginner", duration: "8 min", text: "A single piece may continue capturing as long as another jump is immediately available after landing. Plan landing squares so you keep the sequence alive across the board.",
    board: (() => {
      const b = createEmptyBoard();
      b[6][1] = { color: "red", type: "man", id: "l3-1" };
      b[5][2] = { color: "black", type: "man", id: "l3-2" };
      b[3][4] = { color: "black", type: "man", id: "l3-3" };
      return b;
    })()
  },
  { section: "King Play", title: "Promotion races", level: "Intermediate", duration: "10 min", text: "A king is worth roughly 1.5–2 men. When promotion is unavoidable, count tempo: who arrives first, and what does the back rank look like when they do?",
    board: (() => {
      const b = createEmptyBoard();
      b[1][2] = { color: "red", type: "man", id: "l4-1" };
      b[6][5] = { color: "black", type: "man", id: "l4-2" };
      return b;
    })()
  },
  { section: "Defense", title: "Back row defense", level: "Intermediate", duration: "9 min", text: "Keep your back rank intact as long as you can. Empty back rank means free promotions for the enemy. Move flank pieces first, hold the gold squares in the centre.",
    board: (() => {
      const b = createEmptyBoard();
      for (let c=1; c<8; c+=2) b[7][c] = { color: "red", type: "man", id: `l5-${c}` };
      return b;
    })()
  },
  { section: "Endgames", title: "Opposition with kings", level: "Advanced", duration: "12 min", text: "Two kings vs one is a forced win if you control the long diagonal. Drive the lone king toward a corner where it has no escape squares.",
    board: (() => {
      const b = createEmptyBoard();
      b[4][3] = { color: "red", type: "king", id: "l6-1" };
      b[5][4] = { color: "red", type: "king", id: "l6-2" };
      b[2][1] = { color: "black", type: "king", id: "l6-3" };
      return b;
    })()
  },
];

function Learn() {
  const [active, setActive] = useState<string | null>(null);
  const [localBoard, setLocalBoard] = useState<BoardType | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<"red" | "black">("red");

  const openLesson = (title: string) => {
    const lesson = LESSONS.find(l => l.title === title);
    if (lesson) {
      setLocalBoard(lesson.board);
      setActive(title);
      setSelectedPiece(null);
      setValidMoves([]);
      setTurn("red");
    }
  };

  const handleSquareClick = (r: number, c: number) => {
    if (!localBoard) return;

    if (selectedPiece) {
      const move = validMoves.find(m => m.to.row === r && m.to.col === c);
      if (move) {
        const next = applyMove(localBoard, move);
        setLocalBoard(next);
        setTurn(turn === "red" ? "black" : "red");
        setSelectedPiece(null);
        setValidMoves([]);
        return;
      }
      if (selectedPiece.row === r && selectedPiece.col === c) {
        setSelectedPiece(null);
        setValidMoves([]);
        return;
      }
    }

    const piece = localBoard[r][c];
    if (piece && piece.color === turn) {
      setSelectedPiece({ row: r, col: c });
      setValidMoves(getValidMovesForPiece(localBoard, { row: r, col: c }, turn));
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const timelineData = LESSONS.map((l, i) => {
    let icon = BookOpen;
    if (l.section === "King Play") icon = Crown;
    else if (l.section === "Defense") icon = Shield;
    else if (l.section === "Endgames") icon = Star;
    else if (l.section === "Captures") icon = Play;

    return {
      id: i + 1,
      title: l.title,
      date: l.duration,
      content: l.text,
      category: l.section,
      icon,
      relatedIds: i < LESSONS.length - 1 ? [i + 2] : [],
      status: i === 0 ? "completed" as const : i === 1 ? "in-progress" as const : "pending" as const,
      energy: l.level === "Advanced" ? 90 : l.level === "Intermediate" ? 60 : 30,
    };
  });

  return (
    <AppShell>
      <BackgroundPaths>
        <div className="mx-auto max-w-6xl px-6 py-20 relative z-10 w-full h-full flex flex-col items-center">
          <div className="text-center mb-12">
            <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-4">Study Library</div>
            <h1 className="font-display text-5xl md:text-7xl text-ink">Learn checkers, properly.</h1>
          </div>

          <RadialOrbitalTimeline 
            timelineData={timelineData} 
            onSelect={(_, title) => openLesson(title)}
          />

        {active && (
          <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4" onClick={() => setActive(null)}>
            <div className="bg-card dossier max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-gold">{LESSONS.find(l => l.title === active)?.section}</span>
                  <button onClick={() => setActive(null)} className="md:hidden text-ink-muted hover:text-oxblood">✕</button>
                </div>
                <h2 className="font-display text-4xl text-ink mb-6">{active}</h2>
                <p className="font-serif text-lg text-ink-muted leading-relaxed mb-8">{LESSONS.find(l => l.title === active)?.text}</p>
                <div className="mt-auto pt-8 border-t border-border flex justify-between items-center">
                  <span className="font-sans text-[11px] uppercase tracking-wider text-ink-muted">Lesson Complete?</span>
                  <button onClick={() => setActive(null)} className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-widest font-sans hover:bg-forest-deep">Mark as Studied</button>
                </div>
              </div>
              <div className="w-full md:w-[400px] bg-paper p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border relative">
                 <div className="absolute top-4 left-4 font-sans text-[9px] uppercase tracking-widest text-gold text-center w-full left-0">Interactive Study Board</div>
                 <Board 
                  board={localBoard || undefined} 
                  selectedPiece={selectedPiece} 
                  validMoves={validMoves}
                  onSquareClick={handleSquareClick}
                 />
                 <div className="mt-4 font-serif text-[11px] text-ink-muted italic text-center">
                    {turn === "red" ? "Red to move" : "Black to move"} — Drag or click pieces to experiment.
                 </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </BackgroundPaths>
    </AppShell>
  );
}
