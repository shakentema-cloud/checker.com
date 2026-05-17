import { useLayoutEffect } from "react";
import { Link, useRouter, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import GradientMenu from "@/components/ui/gradient-menu";
import { Play, Puzzle, BookOpen, Crown, User } from "lucide-react";

const NAV = [
  { to: "/play",        label: "Play"     },
  { to: "/puzzles",     label: "Puzzles"  },
  { to: "/learn",       label: "Academy"  },
  { to: "/train",       label: "Dojo"     },
  { to: "/leaderboard", label: "Rankings" },
  { to: "/clubs",       label: "Clubs"    },
  { to: "/dashboard",   label: "Dossier"  },
  { to: "/pro",         label: "Pro"      },
] as const;

// Routes that are accessible without an account
const PUBLIC_ROUTES = ["/", "/login", "/register", "/pro", "/help"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthed, isPro, displayName, localUser, signOut, loading } = useAuth();
  const router = useRouter();
  const location = useLocation();

  useLayoutEffect(() => {
    if (loading) return;
    const path = location.pathname;
    const isPublic = PUBLIC_ROUTES.some(
      (p) => path === p || (p !== "/" && path.startsWith(p + "/")),
    );
    if (!isPublic && !isAuthed) {
      // Save intended URL for post-login redirect
      sessionStorage.setItem("checker_intendedUrl", path + (location.search || ""));
      router.navigate({ to: "/login", replace: true });
    }
  }, [isAuthed, loading, location.pathname, location.search, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-ink-muted font-sans text-xs uppercase tracking-widest animate-pulse">
          Loading Archives…
        </div>
      </div>
    );
  }

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
              <Link
                key={n.to}
                to={n.to}
                className="hover:text-forest transition"
                activeProps={{ className: "text-forest" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthed ? (
              <>
                {isPro && (
                  <span className="hidden sm:inline px-2 py-0.5 bg-gold/10 border border-gold/30 text-gold font-mono text-[10px] uppercase tracking-widest">
                    Pro
                  </span>
                )}
                <Link
                  to="/dashboard"
                  className="hidden sm:inline font-mono text-xs text-ink-muted hover:text-forest transition truncate max-w-[120px]"
                >
                  {displayName}
                </Link>
                <button
                  onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
                  className="px-3 py-1.5 border border-border text-ink-muted text-[11px] uppercase tracking-[0.15em] font-sans hover:border-forest hover:text-forest transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline px-3 py-1.5 border border-border text-ink-muted text-[11px] uppercase tracking-[0.15em] font-sans hover:border-forest hover:text-forest transition"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/play/ai"
              className="px-3 py-1.5 bg-forest text-primary-foreground text-[11px] uppercase tracking-[0.18em] font-sans hover:bg-forest-deep transition"
            >
              Play
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-6 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <GradientMenu 
          items={[
            { title: "Play", icon: <Play size={20} />, gradientFrom: '#1B3022', gradientTo: '#2E503A', onClick: () => router.navigate({ to: "/play" }), active: location.pathname.startsWith("/play") },
            { title: "Puzzles", icon: <Puzzle size={20} />, gradientFrom: '#B38B4D', gradientTo: '#D4B37F', onClick: () => router.navigate({ to: "/puzzles" }), active: location.pathname.startsWith("/puzzles") },
            { title: "Academy", icon: <BookOpen size={20} />, gradientFrom: '#301b1b', gradientTo: '#502e2e', onClick: () => router.navigate({ to: "/learn" }), active: location.pathname.startsWith("/learn") },
            { title: "Clubs", icon: <Crown size={20} />, gradientFrom: '#B38B4D', gradientTo: '#EAD98F', onClick: () => router.navigate({ to: "/clubs" }), active: location.pathname.startsWith("/clubs") },
            { title: "Dossier", icon: <User size={20} />, gradientFrom: '#1B3022', gradientTo: '#4A5D23', onClick: () => router.navigate({ to: "/dashboard" }), active: location.pathname.startsWith("/dashboard") },
          ]}
        />
      </nav>

      <footer className="hidden md:block border-t border-border bg-paper/40 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-between gap-4 text-[11px] uppercase tracking-[0.18em] font-sans text-ink-muted">
          <span>© 2026 Checker.com · Almaty, Kazakhstan · CIS Rules (Backward Captures)</span>
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
