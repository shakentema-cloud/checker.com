import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase, supabaseAvailable } from "@/integrations/supabase/client";
import { userStore, DEFAULT_USER } from "@/lib/storage";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Checker.com" }] }),
  component: Register,
});

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("KZ");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createLocalProfile = () => {
    const username = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const profile = {
      ...DEFAULT_USER,
      id: `local-${Date.now()}`,
      username,
      display_name: name,
      email,
      city: city || "Almaty",
      country: country || "KZ",
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
      createLocalProfile();
      success = true;
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: { display_name: name, city, country },
        },
      });
      if (error) {
        if (error.message.includes("URL") || error.message.includes("fetch") || error.message.includes("network")) {
          createLocalProfile();
          success = true;
        } else {
          setErr(error.message);
        }
      } else {
        createLocalProfile();
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
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2 text-center">
          Grandmaster Archive
        </div>
        <h1 className="font-display text-4xl text-ink mb-2 text-center">Create account</h1>
        <p className="font-serif text-ink-muted text-center mb-8">
          Create a free account to enter the Grandmaster Archive.
        </p>

        {!supabaseAvailable && (
          <div className="mb-4 p-3 bg-gold/5 border border-gold/20 rounded font-serif text-xs text-ink-muted text-center">
            Local mode — your account is saved on this device only.
          </div>
        )}

        <form onSubmit={submit} className="dossier p-6 space-y-4">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Username</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
              placeholder="GrandmasterX"
            />
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
              placeholder="you@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">City</label>
              <input
                required value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
                placeholder="Almaty"
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Country</label>
              <input
                required value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-forest"
                placeholder="KZ"
              />
            </div>
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Password</label>
            <input
              type="password" required minLength={6} value={password}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
          <div className="text-center text-sm font-serif text-ink-muted pt-1">
            Already a member?{" "}
            <Link to="/login" className="text-forest underline">Sign in</Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
