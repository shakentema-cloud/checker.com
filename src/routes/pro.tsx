import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { updateGuest } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LampContainer } from "@/components/ui/lamp";
import { MetalButton } from "@/components/ui/buttons";
import { motion } from "framer-motion";

export const Route = createFileRoute("/pro")({
  head: () => ({ meta: [{ title: "Pro — Checker.com" }] }),
  component: Pro,
});

const FREE = ["Guest & member play", "5 AI tiers", "Daily tactic", "Public leaderboard", "1 coach review / day", "Basic stats"];
const PRO = ["Unlimited AI Coach", "Deep game review", "Full game history", "Unlimited Puzzle Rush", "Custom piece colors", "Custom archive themes", "Cloud sync", "Priority friend rooms", "Ad-free"];

function Pro() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <AppShell>
      <LampContainer className="pt-20">
        <motion.div 
           initial={{ opacity: 0.5, y: 100 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
           className="text-center"
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Membership</div>
          <h1 className="font-display text-5xl md:text-7xl text-ink mb-6">Checker.com <span className="text-gold">Pro</span></h1>
          <p className="font-serif text-lg md:text-xl text-ink-muted mb-10 max-w-2xl mx-auto px-4">For players who treat the board as a discipline. Coach without limits, archive without bounds.</p>
        </motion.div>
      </LampContainer>

      <div className="mx-auto max-w-5xl px-6 pb-24 -mt-20 relative z-20">
        <div className="grid md:grid-cols-2 gap-6 relative">
          <div className="dossier p-7">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-2">Free</div>
            <div className="font-display text-3xl text-ink mb-4">$0</div>
            <ul className="space-y-2 font-serif text-sm text-ink-muted">
              {FREE.map(f => <li key={f} className="flex gap-2"><span className="text-forest">·</span>{f}</li>)}
            </ul>
          </div>
          <div className="dossier p-7 border-forest" style={{ borderWidth: 2 }}>
            <div className="flex justify-between items-baseline mb-2">
              <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold">Pro</div>
              <div className="flex gap-1 text-[10px]">
                <button onClick={() => setPlan("monthly")} className={`px-2 py-0.5 ${plan === "monthly" ? "bg-forest text-primary-foreground" : "border border-border text-ink-muted"}`}>Monthly</button>
                <button onClick={() => setPlan("yearly")} className={`px-2 py-0.5 ${plan === "yearly" ? "bg-forest text-primary-foreground" : "border border-border text-ink-muted"}`}>Yearly</button>
              </div>
            </div>
            <div className="font-display text-3xl text-ink mb-1">{plan === "monthly" ? "$4.99" : "$39.99"}<span className="text-base text-ink-muted">/{plan === "monthly" ? "mo" : "yr"}</span></div>
            {plan === "yearly" && <div className="text-[11px] text-gold mb-3">Save 33%</div>}
            <ul className="space-y-2 font-serif text-sm text-ink-muted mb-5">
              {PRO.map(p => <li key={p} className="flex gap-2"><span className="text-gold">★</span>{p}</li>)}
            </ul>
            <div className="mt-8 flex justify-center">
              <MetalButton variant="gold" onClick={() => setShowCheckout(true)} className="w-full">
                Upgrade to Pro
              </MetalButton>
            </div>
          </div>
        </div>

        {showCheckout && (
          <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" onClick={() => setShowCheckout(false)}>
            <div className="bg-card dossier max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="dossier-header">Checkout (demo)</div>
              <div className="p-6 space-y-3">
                <p className="font-serif text-ink-muted">Mock checkout — wire Stripe to enable real payments.</p>
                <input placeholder="Card number" className="w-full bg-paper border border-border px-3 py-2 font-mono text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="MM/YY" className="bg-paper border border-border px-3 py-2 font-mono text-sm" />
                  <input placeholder="CVC" className="bg-paper border border-border px-3 py-2 font-mono text-sm" />
                </div>
                <button 
                  onClick={() => { 
                    updateGuest({ is_pro: true });
                    toast.success("Welcome to the Grandmaster Club. Pro activated.");
                    setShowCheckout(false); 
                  }} 
                  className="w-full px-4 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-wider font-sans"
                >
                  Approve Mock Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
