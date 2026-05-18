import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  Crown,
  HelpCircle,
  LogOut,
  Play,
  Puzzle,
  Settings,
  Upload,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { userStore } from "@/lib/storage";
import { FloatingAiAssistant } from "@/components/ui/glowing-ai-chat-assistant";
import GradientMenu from "@/components/ui/gradient-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { to: "/play", label: "Play" },
  { to: "/puzzles", label: "Puzzles" },
  { to: "/learn", label: "Academy" },
  { to: "/train", label: "Dojo" },
  { to: "/leaderboard", label: "Rankings" },
  { to: "/clubs", label: "Clubs" },
  { to: "/dashboard", label: "Dossier" },
  { to: "/pro", label: "Pro" },
] as const;

const PUBLIC_ROUTES = ["/", "/login", "/register", "/pro", "/help"];

function getInitials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "C";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    isAuthed,
    isPro,
    displayName,
    localUser,
    signOut,
    loading,
    refreshLocalUser,
  } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    if (loading) return;
    const path = location.pathname;
    const isPublic = PUBLIC_ROUTES.some(
      (p) => path === p || (p !== "/" && path.startsWith(`${p}/`)),
    );
    if (!isPublic && !isAuthed) {
      sessionStorage.setItem("checker_intendedUrl", path + window.location.search);
      router.navigate({ to: "/login", replace: true });
    }
  }, [isAuthed, loading, location.pathname, location.search, router]);

  const avatarSrc =
    localUser?.avatar ||
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined);
  const profileLine = localUser
    ? [localUser.city, localUser.country].filter(Boolean).join(", ")
    : user?.email ?? "Open your profile, settings, and help here.";
  const membershipLabel = user ? "Member profile" : localUser ? "Local player profile" : "Visitor";

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const persistAvatar = (avatar?: string) => {
    if (!userStore.patch({ avatar })) return;
    refreshLocalUser();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        persistAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.navigate({ to: "/login" });
  };

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      <header className="border-b border-border bg-paper/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 min-h-14 py-2 flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-3 shrink-0">
            {isPro && (
              <span className="hidden lg:inline px-2 py-0.5 bg-gold/10 border border-gold/30 text-gold font-mono text-[10px] uppercase tracking-widest">
                Pro
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden md:flex relative h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-[0_10px_24px_rgba(15,17,13,0.12)] transition hover:border-gold/40 hover:shadow-[0_14px_28px_rgba(15,17,13,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Open profile, settings, and help"
                >
                  <Avatar className="h-9 w-9 border border-gold/20">
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                    <AvatarFallback className="bg-forest text-parchment font-sans text-xs uppercase tracking-[0.18em]">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-paper" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="hidden md:block w-[22rem] border-border bg-paper p-0 shadow-2xl">
                <div className="border-b border-border/80 bg-card/80 px-5 py-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border border-gold/20 shadow-md">
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                      <AvatarFallback className="bg-forest text-parchment font-display text-xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-2xl text-ink leading-none">{displayName}</div>
                      <div className="mt-2 font-sans text-[11px] uppercase tracking-[0.24em] text-gold">
                        {membershipLabel}
                      </div>
                      <div className="mt-2 font-serif text-sm text-ink-muted leading-snug">
                        {profileLine}
                      </div>
                    </div>
                  </div>
                  {isAuthed && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleAvatarUpload}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted transition hover:border-gold/50 hover:text-forest"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload avatar
                      </button>
                      {localUser?.avatar && (
                        <button
                          onClick={() => persistAvatar(undefined)}
                          className="rounded-full border border-border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted transition hover:border-oxblood/50 hover:text-oxblood"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <div className="px-2 pt-1 pb-2 font-sans text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                    Quick access
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-start gap-3 rounded-lg px-3 py-3">
                      <User className="mt-0.5 h-4 w-4 text-forest" />
                      <span className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Profile</span>
                        <span className="font-serif text-sm text-ink-muted">Recent matches, coach dossiers, and ratings.</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-start gap-3 rounded-lg px-3 py-3">
                      <Settings className="mt-0.5 h-4 w-4 text-forest" />
                      <span className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Settings</span>
                        <span className="font-serif text-sm text-ink-muted">Avatar, board style, preferences, and data tools.</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="flex items-start gap-3 rounded-lg px-3 py-3">
                      <HelpCircle className="mt-0.5 h-4 w-4 text-forest" />
                      <span className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Help</span>
                        <span className="font-serif text-sm text-ink-muted">Rules, friend rooms, AI coach, and account guidance.</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/80" />

                  <div className="px-2 pt-1 pb-2 font-sans text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                    Play
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/play/ai" className="flex items-start gap-3 rounded-lg px-3 py-3">
                      <Play className="mt-0.5 h-4 w-4 text-gold" />
                      <span className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Play the engine</span>
                        <span className="font-serif text-sm text-ink-muted">Open a live board against the AI.</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/play/friend" className="flex items-start gap-3 rounded-lg px-3 py-3">
                      <Users className="mt-0.5 h-4 w-4 text-gold" />
                      <span className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Friend rooms</span>
                        <span className="font-serif text-sm text-ink-muted">Create a private room and invite someone instantly.</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/80" />

                  {isAuthed ? (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleSignOut();
                      }}
                      className="rounded-lg px-3 py-3 text-oxblood focus:bg-oxblood/5 focus:text-oxblood"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-sans text-[11px] uppercase tracking-[0.18em]">Sign out</span>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/login" className="flex items-center gap-3 rounded-lg px-3 py-3">
                          <User className="h-4 w-4 text-forest" />
                          <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Sign in</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/register" className="flex items-center gap-3 rounded-lg px-3 py-3">
                          <Crown className="h-4 w-4 text-gold" />
                          <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Create account</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden relative flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-[0_10px_24px_rgba(15,17,13,0.12)] transition hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Open profile, settings, and help"
                >
                  <Avatar className="h-9 w-9 border border-gold/20">
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                    <AvatarFallback className="bg-forest text-parchment font-sans text-xs uppercase tracking-[0.18em]">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-paper" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[24rem] border-border bg-paper px-0">
                <SheetHeader className="border-b border-border/80 px-6 pb-5 text-left">
                  <div className="flex items-start gap-4 pr-10">
                    <Avatar className="h-16 w-16 border border-gold/20 shadow-md">
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                      <AvatarFallback className="bg-forest text-parchment font-display text-xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="font-display text-3xl text-ink">{displayName}</SheetTitle>
                      <SheetDescription className="mt-2 font-sans text-[11px] uppercase tracking-[0.24em] text-gold">
                        {membershipLabel}
                      </SheetDescription>
                      <div className="mt-3 font-serif text-sm text-ink-muted leading-snug">
                        {profileLine}
                      </div>
                    </div>
                  </div>
                  {isAuthed && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleAvatarUpload}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted transition hover:border-gold/50 hover:text-forest"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload avatar
                      </button>
                      {localUser?.avatar && (
                        <button
                          onClick={() => persistAvatar(undefined)}
                          className="rounded-full border border-border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted transition hover:border-oxblood/50 hover:text-oxblood"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </SheetHeader>

                <div className="px-6 py-5 space-y-6 overflow-y-auto">
                  <section>
                    <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                      Profile
                    </div>
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Link to="/dashboard" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <User className="mt-0.5 h-4 w-4 text-forest" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Open profile</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">See ratings, archive history, and coach sessions.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/settings" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <Settings className="mt-0.5 h-4 w-4 text-forest" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Settings</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">Edit your avatar, board look, motion, and saved data.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                      Play
                    </div>
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Link to="/play/ai" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <Play className="mt-0.5 h-4 w-4 text-gold" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Play the engine</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">Launch a board immediately against the AI.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/play/friend" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <Users className="mt-0.5 h-4 w-4 text-gold" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Friend rooms</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">Create or join a private live match.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                      Help
                    </div>
                    <SheetClose asChild>
                      <Link to="/help" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="mt-0.5 h-4 w-4 text-forest" />
                          <div>
                            <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">How Checker.com works</div>
                            <div className="mt-1 font-serif text-sm text-ink-muted">Rules, rooms, Temir AI, account access, and troubleshooting.</div>
                          </div>
                        </div>
                      </Link>
                    </SheetClose>
                  </section>

                  {isAuthed ? (
                    <button
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-2xl border border-oxblood/20 bg-oxblood/5 px-4 py-4 text-left"
                    >
                      <LogOut className="h-4 w-4 text-oxblood" />
                      <div>
                        <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-oxblood">Sign out</div>
                        <div className="mt-1 font-serif text-sm text-ink-muted">Return to the entrance and switch profiles if needed.</div>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Link to="/login" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <User className="mt-0.5 h-4 w-4 text-forest" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Sign in</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">Open your saved profile and continue where you left off.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/register" className="block rounded-2xl border border-border/80 bg-card/70 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <Crown className="mt-0.5 h-4 w-4 text-gold" />
                            <div>
                              <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink">Create account</div>
                              <div className="mt-1 font-serif text-sm text-ink-muted">Make a persistent Checker.com profile and save your archive.</div>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <nav className="md:hidden fixed bottom-6 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <GradientMenu
          items={[
            {
              title: "Play",
              icon: <Play size={20} />,
              gradientFrom: "#1B3022",
              gradientTo: "#2E503A",
              onClick: () => router.navigate({ to: "/play" }),
              active: location.pathname.startsWith("/play"),
            },
            {
              title: "Puzzles",
              icon: <Puzzle size={20} />,
              gradientFrom: "#B38B4D",
              gradientTo: "#D4B37F",
              onClick: () => router.navigate({ to: "/puzzles" }),
              active: location.pathname.startsWith("/puzzles"),
            },
            {
              title: "Academy",
              icon: <BookOpen size={20} />,
              gradientFrom: "#301b1b",
              gradientTo: "#502e2e",
              onClick: () => router.navigate({ to: "/learn" }),
              active: location.pathname.startsWith("/learn"),
            },
            {
              title: "Clubs",
              icon: <Crown size={20} />,
              gradientFrom: "#B38B4D",
              gradientTo: "#EAD98F",
              onClick: () => router.navigate({ to: "/clubs" }),
              active: location.pathname.startsWith("/clubs"),
            },
            {
              title: "Dossier",
              icon: <User size={20} />,
              gradientFrom: "#1B3022",
              gradientTo: "#4A5D23",
              onClick: () => router.navigate({ to: "/dashboard" }),
              active: location.pathname.startsWith("/dashboard"),
            },
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

      <FloatingAiAssistant />
    </div>
  );
}
