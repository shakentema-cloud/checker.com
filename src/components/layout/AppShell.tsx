import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/play", label: "Play" },
  { to: "/puzzles", label: "Puzzles" },
  { to: "/learn", label: "Learn" },
  { to: "/leaderboard", label: "Archive" },
  { to: "/clubs", label: "Clubs" },
  { to: "/dashboard", label: "Dossier" },
  { to: "/pro", label: "Pro" },
  { to: "/help", label: "Help" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthed, displayName, signOut } = useAuth();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="border-b border-border bg-paper/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-display text-2xl tracking-tight text-forest">Checker</span>
            <span className="font-mono text-xs text-ink-muted">.com</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-sans text-[12px] uppercase tracking-[0.15em] text-ink-muted">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-forest transition" activeProps={{ className: "text-forest" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <>
                <span className="hidden sm:inline font-mono text-xs text-ink-muted">{displayName}</span>
                <button
                  onClick={async () => { await signOut(); router.invalidate(); }}
                  className="px-3 py-1.5 border border-border text-ink-muted text-[11px] uppercase tracking-[0.15em] font-sans hover:border-forest hover:text-forest"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden sm:inline px-3 py-1.5 border border-border text-ink-muted text-[11px] uppercase tracking-[0.15em] font-sans hover:border-forest hover:text-forest">
                Sign in
              </Link>
            )}
            <Link to="/play/ai" className="px-3 py-1.5 bg-forest text-primary-foreground text-[11px] uppercase tracking-[0.18em] font-sans hover:bg-forest-deep transition">
              Play
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur border-t border-border grid grid-cols-5 text-[10px] uppercase tracking-[0.1em] font-sans">
        {[
          { to: "/clubs", label: "Club" },
          { to: "/play", label: "Play" },
          { to: "/puzzles", label: "Puzzles" },
          { to: "/dashboard", label: "Archive" },
          { to: "/learn", label: "Library" },
        ].map((n) => (
          <Link key={n.to} to={n.to} className="py-3 text-center text-ink-muted hover:text-forest" activeProps={{ className: "text-forest" }}>
            {n.label}
          </Link>
        ))}
      </nav>
      <footer className="hidden md:block border-t border-border bg-paper/40 py-6 mt-12">
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
