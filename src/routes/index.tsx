import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Checker.com — Private Grandmaster Checkers Club" },
      { name: "description", content: "A serious archive-grade checkers platform. Play, study, analyze. Forest green & antique gold. Built for tacticians." },
      { property: "og:title", content: "Checker.com — Private Grandmaster Checkers Club" },
      { property: "og:description", content: "Premium competitive checkers. AI opponents, daily tactics, friend matches, study library." },
    ],
  }),
  component: Index,
});

function FallingPieces() {
  const pieces = Array.from({ length: 18 }).map((_, i) => ({
    i,
    left: Math.random() * 100,
    size: 18 + Math.random() * 28,
    delay: Math.random() * 12,
    duration: 14 + Math.random() * 10,
    isRed: Math.random() > 0.5,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {pieces.map((p) => (
        <div
          key={p.i}
          className="falling-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.isRed
              ? "radial-gradient(circle at 30% 30%, oklch(0.55 0.14 28), var(--piece-red))"
              : "radial-gradient(circle at 30% 30%, oklch(0.32 0.025 145), var(--piece-black))",
            boxShadow: "0 4px 12px oklch(0 0 0 / 0.3)",
          }}
        />
      ))}
    </div>
  );
}

function Index() {
  return (
    <AppShell>
      <section 
        className="relative bg-parchment overflow-hidden border-b border-border"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
              Est. — Almaty · Private Members Edition
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-ink mb-6">
              A quiet archive<br />for serious<br /><em className="text-forest not-italic">checkers.</em>
            </h1>
            <div className="gold-rule w-32 mb-6" />
            <p className="font-serif text-lg text-ink-muted max-w-md mb-8 leading-relaxed">
              Twelve men. Sixty-four squares. A thousand variations. Checker.com is a study library, match ledger, and tactical archive for players who treat draughts as the strategy game it is.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/play/ai"
                className="px-6 py-3 bg-forest text-primary-foreground font-sans text-xs uppercase tracking-[0.2em] hover:bg-forest-deep transition"
              >
                Open the Board
              </Link>
              <Link
                to="/puzzles"
                className="px-6 py-3 border border-forest text-forest font-sans text-xs uppercase tracking-[0.2em] hover:bg-forest hover:text-primary-foreground transition"
              >
                Daily Tactic
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="dossier p-6">
              <div className="dossier-header -mx-6 -mt-6 mb-5">Match Ledger — Today</div>
              <ul className="font-mono text-[13px] space-y-2">
                <li className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>GMSerikov vs AzaTactical</span><span className="text-forest">1–0</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>NurbolatK vs BlitzAibek</span><span className="text-forest">1–0</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>OldMasterT vs DiKhan</span><span className="text-ink-muted">½–½</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>PuzzleQueen — Daily #214</span><span className="text-gold">solved · 9s</span>
                </li>
                <li className="flex justify-between">
                  <span>SteppeKnight vs IronDaria</span><span className="text-oxblood">0–1</span>
                </li>
              </ul>
              <div className="gold-rule my-5" />
              <Link to="/leaderboard" className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold hover:text-forest">
                Read the full archive →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 grid md:grid-cols-3 gap-10">
          {[
            { t: "AI Opponents", d: "Five tiers from Apprentice to Grandmaster. Alpha-beta search, near-optimal at depth 8.", l: "/play/ai", lt: "Play AI →" },
            { t: "Daily Tactics", d: "Ten seeded tactical positions. Forced captures, multi-jumps, promotion races, king traps.", l: "/puzzles", lt: "Solve today →" },
            { t: "Friend Matches", d: "Generate a private room code. Share. Play. Coach reviews after the final move.", l: "/play/friend", lt: "Open a room →" },
          ].map((c) => (
            <div key={c.t} className="dossier p-6">
              <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Chapter</div>
              <h3 className="font-display text-2xl text-ink mb-3">{c.t}</h3>
              <p className="font-serif text-ink-muted leading-relaxed mb-4">{c.d}</p>
              <Link to={c.l} className="font-sans text-xs uppercase tracking-[0.2em] text-forest hover:text-gold">{c.lt}</Link>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
