import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help — Checker.com" }] }),
  component: Help,
});

const SECTIONS = [
  { title: "Rules of Checkers", body: "Standard English draughts. Men move one square diagonally forward. Captures are mandatory and made by jumping over an adjacent enemy piece into the empty square beyond. Multiple captures must be completed in one turn." },
  { title: "Mandatory captures", body: "If any of your pieces can capture, you must capture. You choose which capturing piece and which sequence to play, but you cannot decline." },
  { title: "Kings", body: "Reach the opponent's back rank to promote your man to a king. Kings move and capture diagonally in any direction, one square at a time." },
  { title: "Multi-jumps", body: "After a capture, if the same piece can capture again, the sequence continues until no further captures are available from the landing square." },
  { title: "How ratings work", body: "We use a standard ELO formula. Win above your bracket, gain more. Lose below it, lose more. Three modes: Blitz, Rapid, Daily — each tracked separately." },
  { title: "How Game Review works", body: "After every match the coach evaluates each move with the same engine used for AI opponents. Moves are labelled brilliant, great, good, inaccuracy, mistake, or blunder." },
  { title: "How AI Coach works", body: "The coach summarises your game in plain language, points out the single biggest mistake, and suggests a training plan. Pro members get unlimited reviews and follow-up chat." },
  { title: "How friend rooms work", body: "Create a room, copy the link, send it. The first person who opens the link claims the open seat. No login required for either side." },
  { title: "Guest mode vs account", body: "Guests can play everything except cloud sync across devices. Create an account to keep your archive when you switch phone or browser." },
  { title: "Troubleshooting invite links", body: "If a link 404s, the room may have expired (24h). Re-create from /play/friend. If it forces login, you opened a profile link instead of a room link — room links contain a 6-character code." },
  { title: "Keyboard shortcuts", body: "← → step move history · R resign · N new game · / focus search." },
  { title: "Known limitations", body: "Live realtime sync is best-effort over Supabase Realtime. AI Coach chat in offline mode uses local heuristics, not the gateway model." },
];

function Help() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Reference</div>
        <h1 className="font-display text-4xl text-ink mb-8">Help &amp; Rules</h1>
        <div className="space-y-3">
          {SECTIONS.map(s => (
            <details key={s.title} className="dossier group">
              <summary className="dossier-header cursor-pointer flex justify-between items-center list-none">
                <span>{s.title}</span>
                <span className="text-gold group-open:rotate-45 transition">+</span>
              </summary>
              <div className="p-5 font-serif text-ink-muted leading-relaxed">{s.body}</div>
            </details>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
