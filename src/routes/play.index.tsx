import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/play/")({
  head: () => ({
    meta: [
      { title: "Play — Checker.com" },
      { name: "description", content: "Choose your match: AI opponent, local two-player, friend invite room, or daily tactic." },
    ],
  }),
  component: PlayLobby,
});

const cards = [
  { to: "/play/ai", title: "Versus AI", desc: "Five tiers from Apprentice to Grandmaster.", cta: "Play AI" },
  { to: "/play/local" as const, title: "Local Two-Player", desc: "Two players on one device. Pass-and-play.", cta: "Open Board" },
  { to: "/play/friend" as const, title: "Friend Match", desc: "Create a private room. Share the code.", cta: "Open Room" },
  { to: "/puzzles", title: "Daily Tactic", desc: "One position. One winning sequence. Today only.", cta: "Solve" },
  { to: "/puzzles/rush", title: "Puzzle Rush", desc: "Solve as many as possible in 3 minutes.", cta: "Start Rush" },
  { to: "/analysis", title: "Analyze Game", desc: "Review your past matches with the Coach.", cta: "Open Archive" },
];

function PlayLobby() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold mb-3">Match Selection</div>
        <h1 className="font-display text-5xl text-ink mb-3">Choose your match.</h1>
        <p className="font-serif text-lg text-ink-muted max-w-xl mb-10">
          Every match is recorded in your dossier. The AI Coach reviews the final position when you are done.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="dossier p-6 group hover:border-forest transition"
            >
              <div className="font-display text-2xl text-ink mb-2 group-hover:text-forest transition">{c.title}</div>
              <p className="font-serif text-ink-muted mb-4">{c.desc}</p>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold">{c.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
