import { useGameStore } from "@/store/gameStore";
import { PieceView } from "./Piece";
import { cn } from "@/lib/utils";
import type { Board as BoardType, Position, Move } from "@/lib/game/types";

interface BoardProps {
  flipped?: boolean;
  board?: BoardType;
  selectedPiece?: Position | null;
  validMoves?: Move[];
  lastMove?: Move | null;
  onSquareClick?: (r: number, col: number) => void;
  highlightedSquares?: Position[];
}

export function Board({ 
  flipped = false, 
  board, 
  selectedPiece, 
  validMoves, 
  lastMove: propLastMove,
  onSquareClick,
  highlightedSquares,
}: BoardProps) {
  const storeState = useGameStore((s) => s.state);
  const storeSelectPiece = useGameStore((s) => s.selectPiece);

  const displayBoard = board || storeState.board;
  const displaySelected = selectedPiece !== undefined ? selectedPiece : storeState.selectedPiece;
  const displayValidMoves = validMoves || storeState.validMoves;
  const lastMove = propLastMove !== undefined ? propLastMove : storeState.moveHistory[storeState.moveHistory.length - 1]?.move;
  const handleClick = onSquareClick || storeSelectPiece;
  const rows = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const highlightSet = new Set((highlightedSquares ?? []).map((p) => `${p.row}-${p.col}`));

  return (
    <div
      className="relative w-full aspect-square max-w-[640px] mx-auto rounded-md overflow-hidden border border-ledger shadow-[0_8px_32px_oklch(0_0_0/0.25)]"
      style={{ background: "var(--forest-deep)" }}
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {rows.map((r) =>
          cols.map((c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = displayBoard[r][c];
            const isSelected =
              displaySelected?.row === r && displaySelected?.col === c;
            const validMove = displayValidMoves.find(
              (m) => m.to.row === r && m.to.col === c,
            );
            const isCaptureTarget = validMove && validMove.captures.length > 0;
            const isLastMove =
              lastMove &&
              ((lastMove.from.row === r && lastMove.from.col === c) ||
                (lastMove.to.row === r && lastMove.to.col === c));
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={cn(
                  "relative flex items-center justify-center transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:z-10",
                )}
                style={{
                  background: isDark ? "var(--board-dark)" : "var(--board-light)",
                }}
              >
                {/* coordinate labels */}
                {c === (flipped ? 7 : 0) && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] font-mono opacity-60"
                    style={{ color: isDark ? "var(--board-light)" : "var(--board-dark)" }}
                  >
                    {8 - r}
                  </span>
                )}
                {r === (flipped ? 0 : 7) && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[10px] font-mono opacity-60"
                    style={{ color: isDark ? "var(--board-light)" : "var(--board-dark)" }}
                  >
                    {String.fromCharCode(97 + c)}
                  </span>
                )}

                {isLastMove && (
                  <div
                    className="absolute inset-0"
                    style={{ background: "var(--board-lastmove)" }}
                  />
                )}
                {isSelected && (
                  <div className="absolute inset-0 animate-square-pulse" />
                )}
                {validMove && !isCaptureTarget && (
                  <div className="absolute w-1/3 h-1/3 rounded-full"
                       style={{ background: "var(--gold-bright)", opacity: 0.55 }} />
                )}
                {isCaptureTarget && (
                  <div
                    className="absolute inset-1 rounded-md border-2"
                    style={{ borderColor: "var(--board-capture)" }}
                  />
                )}
                {highlightSet.has(`${r}-${c}`) && (
                  <div
                    className="absolute inset-1 rounded-md border-2 pointer-events-none animate-pulse"
                    style={{ borderColor: "var(--gold-bright, #f59e0b)", boxShadow: "0 0 12px 2px rgba(245,158,11,0.4)" }}
                  />
                )}
                {piece && <PieceView piece={piece} selected={isSelected} />}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
