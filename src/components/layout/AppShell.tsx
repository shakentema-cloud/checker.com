import { Link } from "@tanstack/react-router";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="border-b border-border bg-paper/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight text-forest">Checker</span>
            <span className="font-mono text-xs text-ink-muted">.com</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 font-sans text-[13px] uppercase tracking-[0.15em] text-ink-muted">
            <Link to="/play" className="hover:text-forest transition">Play</Link>
            <Link to="/puzzles" className="hover:text-forest transition">Puzzles</Link>
            <Link to="/learn" className="hover:text-forest transition">Library</Link>
            <Link to="/leaderboard" className="hover:text-forest transition">Archive</Link>
            <Link to="/clubs" className="hover:text-forest transition">Clubs</Link>
            <Link to="/dashboard" className="hover:text-forest transition">Dossier</Link>
            <Link to="/pro" className="hover:text-forest transition">Pro</Link>
          </nav>
          <Link
            to="/play/ai"
            className="px-4 py-1.5 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep transition"
          >
            Start Match
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-paper/40 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-between gap-4 text-[11px] uppercase tracking-[0.18em] font-sans text-ink-muted">
          <span>Checker.com — Private Grandmaster Archive</span>
          <span className="flex gap-5">
            <Link to="/help">Help</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/pro">Pro</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
