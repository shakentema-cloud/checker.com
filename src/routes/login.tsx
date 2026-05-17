import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase, supabaseAvailable } from "@/integrations/supabase/client";
import { userStore, DEFAULT_USER } from "@/lib/storage";
import { AuroraBackground } from "@/components/ui/aurora-background";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Checker.com" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createLocalAccount = (emailVal: string) => {
    const username = emailVal.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const profile = {
      ...DEFAULT_USER,
      id: `local-${Date.now()}`,
      username,
      display_name: username,
      email: emailVal,
      city: "Almaty",
      country: "KZ",
      is_guest: false,
      is_pro: false,
      createdAt: Date.now(),
    };
    userStore.save(profile);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    let success = false;

    if (!supabaseAvailable) {
      // Pure local mode
      createLocalAccount(email);
      success = true;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErr("Incorrect email or password. Try registering first.");
        } else {
          // Supabase unreachable — fall back to local
          createLocalAccount(email);
          success = true;
        }
      } else {
        // Supabase login success — also ensure local profile exists
        if (!userStore.get()) {
          createLocalAccount(email);
        }
        success = true;
      }
    }

    setLoading(false);
    if (success) {
      const url = sessionStorage.getItem("checker_intendedUrl") || "/dashboard";
      sessionStorage.removeItem("checker_intendedUrl");
      window.location.href = url;
    }
  };

  return (
    <AppShell>
      <AuroraBackground className="py-20">
        <div className="mx-auto w-full max-w-md px-6 relative z-10 bg-paper/50 backdrop-blur-sm border border-border shadow-2xl rounded-2xl py-12">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2 text-center">
          Grandmaster Archive
        </div>
        <h1 className="font-display text-4xl text-ink mb-2 text-center">Enter the Club</h1>
        <p className="font-serif text-ink-muted text-center mb-8">
          Create a free account to enter the Grandmaster Archive.
        </p>

        {!supabaseAvailable && (
          <div className="mb-4 p-3 bg-gold/5 border border-gold/20 rounded font-serif text-xs text-ink-muted text-center">
            Running in local mode — your account is saved securely on this device.
          </div>
        )}

        <form onSubmit={submit} className="dossier p-6 space-y-4">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">
              Password
            </label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
              placeholder="••••••••"
            />
          </div>
          {err && <div className="text-oxblood text-sm font-mono bg-oxblood/5 p-2 rounded">{err}</div>}
          <button
            type="submit" disabled={loading}
            className="w-full px-4 py-2.5 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep disabled:opacity-40 transition"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="text-center text-sm font-serif text-ink-muted pt-1">
            No account?{" "}
            <Link to="/register" className="text-forest underline">
              Create one free
            </Link>
          </div>
        </form>

        <div className="mt-6 p-4 dossier text-center">
          <div className="font-sans text-[10px] uppercase tracking-widest text-ink-muted mb-2">
            Quick access
          </div>
          <button
            onClick={() => {
              createLocalAccount(`guest_${Date.now()}@local.com`);
              const url = sessionStorage.getItem("checker_intendedUrl") || "/dashboard";
              sessionStorage.removeItem("checker_intendedUrl");
              window.location.href = url;
            }}
            className="px-4 py-2 border border-border text-ink-muted text-xs uppercase tracking-wider font-sans hover:border-forest hover:text-forest transition"
          >
            Continue as local player
          </button>
          <div className="mt-2 font-serif text-[11px] text-ink-muted italic">
            No email required — saved on this device only
          </div>
        </div>
        </div>
      </AuroraBackground>
    </AppShell>
  );
}
