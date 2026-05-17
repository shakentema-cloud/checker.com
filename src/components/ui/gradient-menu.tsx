"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface GradientMenuItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
  active?: boolean;
}

export default function GradientMenu({ items }: { items: GradientMenuItem[] }) {
  return (
    <div className="flex justify-center items-center pointer-events-auto">
      <ul className="flex gap-4 sm:gap-6 bg-paper/80 backdrop-blur-xl p-3 border border-border shadow-2xl rounded-full">
        {items.map(({ title, icon, gradientFrom, gradientTo, onClick, active }, idx) => (
          <li
            key={idx}
            onClick={onClick}
            style={{ 
              '--gradient-from': gradientFrom, 
              '--gradient-to': gradientTo 
            } as React.CSSProperties}
            className={`
              relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] shadow-sm rounded-full flex items-center justify-center transition-all duration-500 hover:w-[150px] sm:hover:w-[180px] hover:shadow-none group cursor-pointer
              ${active ? "bg-forest w-[150px] sm:w-[180px]" : "bg-card"} border border-border/50
            `}
          >
            <span className={`absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] transition-all duration-500 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></span>
            
            <span className={`absolute top-[10px] inset-x-0 h-[80%] rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] -z-10 transition-all duration-500 ${active ? "opacity-60" : "opacity-0 group-hover:opacity-60"}`}></span>

            <span className={`relative z-10 transition-all duration-500 delay-0 ${active ? "scale-0" : "group-hover:scale-0"}`}>
              <span className="text-xl sm:text-2xl text-ink-muted group-hover:text-gold transition-colors">{icon}</span>
            </span>

            <span className={`absolute text-white uppercase font-sans tracking-[0.2em] text-[10px] sm:text-xs transition-all duration-500 delay-150 whitespace-nowrap ${active ? "scale-100" : "scale-0 group-hover:scale-100"}`}>
              {title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
