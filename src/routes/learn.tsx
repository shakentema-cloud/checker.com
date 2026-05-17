import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "Library — Checker.com" }] }),
  component: Learn,
});

const LESSONS = [
  { section: "Fundamentals", title: "How the pieces move", level: "Beginner", duration: "5 min", text: "Men move diagonally forward one square. They capture by jumping over an adjacent enemy piece into an empty square beyond. Captures are mandatory in standard rules — if you can take, you must." },
  { section: "Fundamentals", title: "Mandatory captures", level: "Beginner", duration: "6 min", text: "When a capture is available, you cannot make a quiet move. Choose any capturing piece — there is no rule of choosing the longest sequence in English draughts; one of the available capture chains must be played in full." },
  { section: "Captures", title: "Multi-jumps", level: "Beginner", duration: "8 min", text: "A single piece may continue capturing as long as another jump is immediately available after landing. Plan landing squares so you keep the sequence alive across the board." },
  { section: "King Play", title: "Promotion races", level: "Intermediate", duration: "10 min", text: "A king is worth roughly 1.5–2 men. When promotion is unavoidable, count tempo: who arrives first, and what does the back rank look like when they do?" },
  { section: "Defense", title: "Back row defense", level: "Intermediate", duration: "9 min", text: "Keep your back rank intact as long as you can. Empty back rank means free promotions for the enemy. Move flank pieces first, hold the gold squares in the centre." },
  { section: "Endgames", title: "Opposition with kings", level: "Advanced", duration: "12 min", text: "Two kings vs one is a forced win if you control the long diagonal. Drive the lone king toward a corner where it has no escape squares." },
  { section: "Strategy", title: "Avoiding forced captures", level: "Intermediate", duration: "7 min", text: "If a move forces the opponent to capture into a losing position, the move was strong. Read two ply ahead: my move → their forced capture → my reply." },
  { section: "Common Mistakes", title: "Trading piece for piece", level: "Beginner", duration: "5 min", text: "Don't trade aimlessly. Every trade should improve king potential, centre control, or simplify into a winning endgame." },
  { section: "Training Methods", title: "Daily tactic + review", level: "Any", duration: "15 min", text: "Solve the daily tactic, play one rapid game, then review your worst move with the coach. Three weeks of this is worth more than a year of casual play." },
];

function Learn() {
  const sections = Array.from(new Set(LESSONS.map(l => l.section)));
  const [active, setActive] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Study Library</div>
        <h1 className="font-display text-4xl text-ink mb-8">Learn checkers, properly.</h1>

        {sections.map(s => (
          <div key={s} className="mb-10">
            <div className="font-display text-2xl text-forest mb-3">{s}</div>
            <div className="gold-rule mb-5" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LESSONS.filter(l => l.section === s).map(l => (
                <button key={l.title} onClick={() => setActive(l.title)} className="dossier p-5 text-left hover:border-forest transition group">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-ink-muted mb-2">
                    <span>{l.level}</span><span>{l.duration}</span>
                  </div>
                  <div className="font-display text-xl text-ink group-hover:text-forest mb-2">{l.title}</div>
                  <p className="font-serif text-sm text-ink-muted line-clamp-3">{l.text}</p>
                  <div className="mt-3 font-sans text-[10px] uppercase tracking-wider text-gold">Read lesson →</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {active && (
          <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
            <div className="bg-card dossier max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="dossier-header flex justify-between">
                <span>{LESSONS.find(l => l.title === active)?.section}</span>
                <button onClick={() => setActive(null)} className="text-ink-muted hover:text-oxblood">✕</button>
              </div>
              <div className="p-6">
                <h2 className="font-display text-3xl text-ink mb-4">{active}</h2>
                <p className="font-serif text-lg text-ink-muted leading-relaxed">{LESSONS.find(l => l.title === active)?.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
