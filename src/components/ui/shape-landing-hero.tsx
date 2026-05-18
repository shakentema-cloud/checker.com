"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function ElegantChecker({
    className,
    delay = 0,
    width = 100,
    height = 100,
    rotate = 0,
    color = "red", // red or black
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    color?: "red" | "black";
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                    rotate: [rotate, rotate + 15, rotate]
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{ width, height }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full border-4 shadow-xl",
                        color === "red" 
                           ? "bg-oxblood border-piece-red-rim" 
                           : "bg-piece-black border-piece-black-rim"
                    )}
                >
                    <div className="absolute inset-[15%] rounded-full border-2 border-inherit opacity-50" />
                </div>
            </motion.div>
        </motion.div>
    );
}

export function HeroGeometric({
    badge = "Private Club",
    title1 = "The Ancient",
    title2 = "Mastery.",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: "easeOut",
            },
        }),
    };

    return (
        <div className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-transparent">
            <div className="absolute inset-0 pointer-events-none">
                <img
                    src="/checkerbackground.png"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover object-center opacity-[0.92] scale-[1.02] saturate-[1.04]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,241,227,0.12),rgba(247,241,227,0.28)_62%,rgba(247,241,227,0.42)_100%)]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-forest/5 blur-3xl pointer-events-none" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ElegantChecker
                    delay={0.3} width={120} height={120} rotate={12} color="red"
                    className="left-[-5%] md:left-[5%] top-[15%] md:top-[20%]"
                />
                <ElegantChecker
                    delay={0.5} width={180} height={180} rotate={-15} color="black"
                    className="right-[-5%] md:right-[5%] top-[60%] md:top-[65%]"
                />
                <ElegantChecker
                    delay={0.4} width={90} height={90} rotate={-8} color="red"
                    className="left-[5%] md:left-[15%] bottom-[10%] md:bottom-[20%]"
                />
                <ElegantChecker
                    delay={0.6} width={100} height={100} rotate={20} color="black"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />
                <ElegantChecker
                    delay={0.7} width={140} height={140} rotate={-25} color="red"
                    className="left-[25%] md:left-[35%] top-[5%] md:top-[15%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0} variants={fadeUpVariants} initial="hidden" animate="visible"
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paper border border-border mb-8 shadow-sm"
                    >
                        <Circle className="h-2 w-2 fill-gold text-gold" />
                        <span className="text-xs font-sans uppercase tracking-[0.2em] text-ink-muted">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
                        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold mb-6 tracking-tight text-ink">
                            <span className="block opacity-90">
                                {title1}
                            </span>
                            <span className="block text-gold">
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
                        <p className="font-serif text-lg md:text-xl text-ink-muted leading-relaxed italic max-w-xl mx-auto px-4">
                            "Enter the hallowed halls where strategy meets legacy. A sanctuary for those who seek draughts as a discipline, not a pastime."
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
        </div>
    );
}
