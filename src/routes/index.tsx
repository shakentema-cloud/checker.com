import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { motion } from "framer-motion";
import { ScrollText, Trophy, Users } from "lucide-react";
import React from "react";

import { AppShell } from "@/components/layout/AppShell";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ShuffleCards } from "@/components/ui/testimonial-cards";
import { MetalButton, LiquidButton } from "@/components/ui/buttons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Checker.com — Private Grandmaster Checkers Club" },
      { name: "description", content: "A serious archive-grade checkers platform. Play, study, analyze. Forest green & antique gold. Built for tacticians." },
    ],
  }),
  component: Index,
});

const testimonials = [
  {
    id: 11,
    testimonial: "I feel like I've learned as much from this archive as I did completing my masters. It's the first thing I read every morning.",
    author: "Jenn F. - Master Tactician"
  },
  {
    id: 32,
    testimonial: "My opponent thinks I know what I'm doing. Honestly, I just read the backward-capture analysis.",
    author: "Adrian Y. - Regional Champion"
  },
  {
    id: 43,
    testimonial: "Cannot believe this is a public club for now. If the Archive was $500 a month, it would be worth every penny.",
    author: "Devin R. - Grandmaster"
  }
];

function Index() {
  const router = useRouter();

  return (
    <AppShell>
      {/* 1. Hero Geometric */}
      <HeroGeometric 
         badge="Private Club"
         title1="The Ancient"
         title2="Mastery."
      />

      <div className="flex justify-center -mt-24 mb-32 z-50 relative pointer-events-auto gap-6 flex-wrap">
         <MetalButton variant="gold" onClick={() => router.navigate({ to: "/play/ai" })}>
           Enter the Archive
         </MetalButton>
         <LiquidButton size="xl" onClick={() => router.navigate({ to: "/learn" })}>
           Browse the Library
         </LiquidButton>
      </div>

      {/* 2. Container Scroll applied to the game board/ledger */}
      <div className="bg-ink rounded-t-[4rem] text-parchment overflow-hidden overflow-x-hidden pt-12 pb-24 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-gold/20 relative z-10 w-full relative">
        <ContainerScroll
          titleComponent={
            <>
              <h2 className="text-2xl font-sans uppercase tracking-[0.2em] text-gold/70">
                Official Ledger
              </h2>
              <span className="text-4xl md:text-6xl font-display mt-2 leading-none block text-parchment">
                Current Open Sessions
              </span>
            </>
          }
        >
          <div className="relative aspect-[16/9] w-full h-full bg-paper">
            <img 
              src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1920&q=80" 
              className="w-full h-full object-cover opacity-80"
              alt="Ancient checkers set"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 text-left pointer-events-none">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 font-mono text-[9px] md:text-[11px] uppercase tracking-widest text-gold/60">
                  <div>
                    <div className="text-parchment mb-1">Dossier #412</div>
                    <div>Nur-Sultan vs Almaty</div>
                  </div>
                  <div>
                    <div className="text-parchment mb-1">Archive #88</div>
                    <div>Sicilian Defense Study</div>
                  </div>
                  <div>
                    <div className="text-parchment mb-1">Ranked Match</div>
                    <div>Grandmaster Tier</div>
                  </div>
                  <div>
                    <div className="text-parchment mb-1">Status</div>
                    <div className="text-forest">Online / Active</div>
                  </div>
                </div>
            </div>
          </div>
        </ContainerScroll>
      </div>

      {/* 3. Shuffle Cards (Testimonials) */}
      <section className="bg-background py-32 border-t border-border flex flex-col items-center overflow-hidden">
        <div className="mb-16 text-center max-w-xl mx-auto px-4 z-10">
           <h2 className="font-display text-5xl text-ink">Words from the Hierarchy</h2>
           <p className="font-serif italic text-ink-muted mt-4">Those who have mastered the board leave behind their wisdom.</p>
        </div>
        <ShuffleCards testimonials={testimonials} />
      </section>

      {/* Features */}
      <section className="bg-paper py-32 border-t border-ledger">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-12">
           {[
             { Icon: ScrollText, t: "Official Archives", d: "Store and replay every match with deep accuracy metrics and move-by-move notations.", l: "/dashboard" },
             { Icon: Trophy, t: "Grandmaster AI", d: "Face tiered AI engines from Level 1 (Apprentice) to Level 5 (Grandmaster Alpha-Beta).", l: "/play/ai" },
             { Icon: Users, t: "Private Rooms", d: "Invite friends to private matches with real-time broadcasting and side-pot challenges.", l: "/play/friend" },
           ].map((c, i) => (
             <Link key={i} to={c.l} className="dossier bg-card p-10 group hover:border-gold transition-colors block">
                <c.Icon className="w-10 h-10 text-gold mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-3xl text-ink mb-4">{c.t}</h3>
                <p className="font-serif text-ink-muted leading-relaxed mb-6">{c.d}</p>
                <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">Access Department →</div>
             </Link>
           ))}
        </div>
      </section>

    </AppShell>
  );
}
