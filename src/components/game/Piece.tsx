import type { Piece } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function PieceView({ piece, selected }: { piece: Piece; selected?: boolean }) {
  const isRed = piece.color === "red";
  return (
    <div
      className={cn(
        "relative w-[78%] h-[78%] rounded-full animate-piece-land",
        "shadow-[0_3px_0_oklch(0_0_0/0.35),0_6px_12px_oklch(0_0_0/0.25),inset_0_2px_3px_oklch(1_0_0/0.15)]",
        selected && "ring-2 ring-offset-2 ring-offset-transparent",
      )}
      style={{
        background: isRed
          ? "radial-gradient(circle at 30% 30%, oklch(0.55 0.14 28), var(--piece-red) 60%, oklch(0.30 0.10 28))"
          : "radial-gradient(circle at 30% 30%, oklch(0.32 0.025 145), var(--piece-black) 60%, oklch(0.12 0.020 145))",
      }}
    >
      <div
        className="absolute inset-[14%] rounded-full border-2"
        style={{ borderColor: isRed ? "var(--piece-red-rim)" : "var(--piece-black-rim)" }}
      />
      {piece.type === "king" && (
        <div
          className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg"
          style={{ color: "var(--gold-bright)", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          ♛
        </div>
      )}
    </div>
  );
}
