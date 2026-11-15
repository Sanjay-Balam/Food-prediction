"use client";

import React from "react";
import { Eyebrow } from "@/components/Eyebrow";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { features, modules } from "@/content/site";
import { Check, ArrowRight, Sparkles, MessageSquare, Scale, CheckCircle2 } from "lucide-react";

export function Features() {
  return (
    <section id="capabilities" className="bg-tint/50 py-28 lg:py-36 border-y border-hairline">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>The Solution Suite</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink leading-tight">
            Engineered for the line. <br />
            <em className="font-normal italic text-teal">Delivered on WhatsApp.</em>
          </h2>
          <p className="mt-5 text-lg font-light leading-relaxed text-body">
            No tablets on the prep counter. No clunky ERP logins. Clean intelligence delivered where your kitchen team already works.
          </p>
        </div>

        {/* 6 Platform Capabilities Spotlight Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, index) => (
            <Reveal key={mod.label} delay={index * 0.08}>
              <SpotlightCard className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                      {mod.label}
                    </span>
                    {mod.comingSoon ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Upcoming
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-mint-deep">
                        <CheckCircle2 className="size-3.5 text-mint-deep" /> Live
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-semibold text-ink leading-snug">
                    {mod.title[0]} <em className="italic font-normal text-teal">{mod.title[1]}</em>
                  </h3>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-body">
                    {mod.text}
                  </p>
                </div>

                {/* Sample Card Mockup */}
                <div className="mt-6 rounded-2xl bg-tint/80 border border-hairline p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-teal mb-3">
                    <span>{mod.sample.title}</span>
                    {mod.sample.badge && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-teal border border-teal/10 font-mono">
                        {mod.sample.badge}
                      </span>
                    )}
                  </div>

                  {mod.sample.highlight && (
                    <div className="mb-3 rounded-xl bg-white p-2.5 text-center border border-teal/10">
                      <p className="font-serif text-2xl font-bold text-teal">
                        {mod.sample.highlight.value}
                      </p>
                      <p className="text-[11px] text-muted">{mod.sample.highlight.caption}</p>
                    </div>
                  )}

                  <ul className="flex flex-col gap-1.5 text-xs text-body">
                    {mod.sample.rows.map((row, rIdx) => (
                      <li key={rIdx} className="flex items-center justify-between py-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-mint-deep" />
                          {row.label}
                        </span>
                        {row.value && <span className="font-mono font-semibold text-ink">{row.value}</span>}
                      </li>
                    ))}
                  </ul>

                  {mod.sample.footer && (
                    <p className="mt-3 text-[11px] text-muted border-t border-hairline/60 pt-2 italic">
                      {mod.sample.footer}
                    </p>
                  )}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* 5 Core Feature Resolutions */}
        <div className="mt-28">
          <div className="border-t border-hairline pt-16 mb-12 text-center">
            <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
              Direct Answers to <em className="italic font-normal text-teal">Every Kitchen Pain Point</em>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <Reveal key={feat.title} delay={index * 0.08}>
                <article className="h-full rounded-3xl bg-white p-7 border border-hairline shadow-[0_10px_30px_rgba(11,33,41,0.04)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(11,33,41,0.08)]">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-tint text-teal">
                        <Icon name={feat.icon} className="size-5" />
                      </span>
                      <span className="font-serif text-xl italic text-mint-deep">0{index + 1}</span>
                    </div>

                    <h4 className="mt-5 font-serif text-xl font-semibold text-ink">
                      {feat.title}
                    </h4>

                    <p className="mt-2 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-teal">Resolves: </span>
                      <span className="font-serif italic text-muted">{feat.solves}</span>
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-body">
                      {feat.text}
                    </p>
                  </div>

                  <ul className="mt-6 flex flex-col gap-2 border-t border-hairline pt-4">
                    {feat.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-center gap-2 text-xs font-semibold text-teal">
                        <Check className="size-3.5 text-mint-deep" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
