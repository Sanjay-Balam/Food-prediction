"use client";

import React from "react";
import { ScrollRevealText } from "@/components/ScrollRevealText";
import { manifesto } from "@/content/site";
import { Sparkles } from "lucide-react";

export function Manifesto() {
  return (
    <section id="manifesto" className="relative bg-paper py-28 sm:py-36 lg:py-44 px-6 border-b border-hairline">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal mb-8">
          <Sparkles className="size-3.5 text-mint-deep" />
          <span>{manifesto.eyebrow}</span>
        </div>

        <ScrollRevealText
          lines={manifesto.lines}
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.2] tracking-tight text-ink"
        />

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-hairline text-sm text-muted">
          <p className="max-w-md font-sans leading-relaxed">
            Hyderabad and Indian commercial kitchens operate at blistering speed. We replace guesswork with calibrated data without slowing down your kitchen line.
          </p>
          <div className="font-serif italic text-lg text-teal">
            — The Logeeca Foresight Philosophy
          </div>
        </div>
      </div>
    </section>
  );
}
