import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Checker.com" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else navigate({ to: "/dashboard" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2 text-center">Members</div>
        <h1 className="font-display text-4xl text-ink mb-2 text-center">Sign in</h1>
        <p className="font-serif text-ink-muted text-center mb-8">Login is optional. <Link to="/play/ai" className="text-forest">Skip and play as guest →</Link></p>

        <form onSubmit={submit} className="dossier p-6 space-y-3">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm" />
          </div>
          {err && <div className="text-oxblood text-sm font-mono">{err}</div>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep disabled:opacity-40">{loading ? "Signing in…" : "Sign in"}</button>
          <div className="text-center text-sm font-serif text-ink-muted pt-2">
            No account? <Link to="/register" className="text-forest underline">Create one</Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
