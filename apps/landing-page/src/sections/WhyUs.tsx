"use client";

import React from "react";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/Eyebrow";
import { reasons } from "@/content/site";
import { ShieldCheck, Compass, HeartHandshake, Eye } from "lucide-react";

const ICONS = [Compass, Eye, ShieldCheck, HeartHandshake];

export function WhyUs() {
  return (
    <section className="bg-tint/70 py-28 lg:py-36 border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>The Operational Philosophy</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
            Why Modern Restaurateurs <br />
            <em className="font-normal italic text-teal">Choose Foresight</em>
          </h2>
        </div>

        <div className="mt-16 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => {
            const IconComp = ICONS[index % ICONS.length];
            return (
              <Reveal key={reason.title} delay={index * 0.1}>
                <div className="h-full rounded-3xl bg-white p-7 border border-hairline shadow-[0_10px_30px_rgba(11,33,41,0.04)] flex flex-col justify-between">
                  <div>
                    <div className="size-12 rounded-2xl bg-tint grid place-items-center text-teal mb-6">
                      <IconComp className="size-6 text-mint-deep" />
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-ink leading-snug">
                      {reason.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-body">
                      {reason.text}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-hairline text-xs font-semibold text-teal flex items-center gap-1.5">
                    <span>Guaranteed Principle</span>
                    <span className="font-serif italic text-mint-deep">0{index + 1}</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
