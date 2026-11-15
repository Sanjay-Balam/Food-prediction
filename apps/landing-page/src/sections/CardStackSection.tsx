"use client";

import React from "react";
import Image from "next/image";
import { CardStack } from "@/components/CardStack";
import { Eyebrow } from "@/components/Eyebrow";
import { Sparkles, ArrowRight, ShieldCheck, TrendingDown, ChefHat } from "lucide-react";

const STACK_CARDS = [
  {
    num: "01",
    tag: "DEMAND CERTAINTY",
    title: "Plan With Absolute Precision",
    subtitle: "Make demand visible before the stoves are lit.",
    desc: "Replace morning panic and guesswork with statistically bounded portion targets. Our LightGBM forecasting engine incorporates historical sales, local Telangana calendars, cricket match nights, and real-time precipitation models.",
    stat: "86% to 92%",
    statLabel: "Portion forecast accuracy",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    bg: "linear-gradient(135deg, #0B2129 0%, #12303A 100%)",
  },
  {
    num: "02",
    tag: "INGREDIENT EXPLOSION",
    title: "Buy to the Decimal Kilogram",
    subtitle: "Source ingredients closer to the chef's knife.",
    desc: "Connect projected dish demand directly with your recipes. Convert 185 Biryanis into 24.5 kg chicken, 18.0 kg basmati rice, and 4.2 kg ghee. Eliminate over-ordering and prevent kitchen stockouts before supplier cutoffs.",
    stat: "100%",
    statLabel: "Recipe explosion coverage",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    bg: "linear-gradient(135deg, #12695C 0%, #07171C 100%)",
  },
  {
    num: "03",
    tag: "PROFIT PRESERVATION",
    title: "Eliminate Invisible Kitchen Waste",
    subtitle: "Measure every rupee saved at midnight close.",
    desc: "Unsold food thrown into the bin silently destroys restaurant EBITDA. Logeeca flags recurring over-prep trends, splits perishable delivery cycles, and protects ₹1.8L to ₹4.2L in avoidable waste per outlet every single month.",
    stat: "38% Drop",
    statLabel: "Documented waste reduction",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    bg: "linear-gradient(135deg, #081B1F 0%, #153C35 100%)",
  },
  {
    num: "04",
    tag: "ZERO APP ADOPTION",
    title: "Human Chefs in Total Control",
    subtitle: "Native WhatsApp delivery in English, Telugu & Hindi.",
    desc: "Line cooks and executive chefs love simplicity. No logins, no passwords, no kitchen tablets to drop in oil. A 9:00 PM WhatsApp message with human-editable overrides keeps everyone aligned in under 60 seconds.",
    stat: "60 Sec",
    statLabel: "Daily touchpoint required",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    bg: "linear-gradient(135deg, #10262C 0%, #0B1E24 100%)",
  },
];

export function CardStackSection() {
  return (
    <section className="relative bg-ink py-28 lg:py-36 text-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 mb-16 text-center">
        <Eyebrow onDark>Sticky Stacking Scroller</Eyebrow>
        <h2 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
          What the <em className="italic font-normal text-mint">48 Hours</em> Hold
        </h2>
        <p className="mt-4 text-base sm:text-lg font-light text-on-ink-muted max-w-xl mx-auto">
          Scroll down to experience the stacked card pinning interaction inspired by MaestroClass.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <CardStack>
          {STACK_CARDS.map((card) => (
            <div
              key={card.num}
              style={{ background: card.bg }}
              className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border border-white/20 p-8 sm:p-12 lg:p-14 shadow-[0_30px_90px_rgba(0,0,0,0.65)] text-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl font-bold italic text-mint">
                      {card.num}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-mint border border-white/10">
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 font-serif text-3xl sm:text-4xl font-semibold text-white leading-snug">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-base font-serif italic text-mint/90">
                    {card.subtitle}
                  </p>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-on-ink-muted">
                    {card.desc}
                  </p>

                  <div className="mt-8 flex items-baseline gap-4 pt-6 border-t border-white/10">
                    <div>
                      <p className="font-serif text-3xl sm:text-4xl font-bold text-mint">
                        {card.stat}
                      </p>
                      <p className="text-xs text-on-ink-muted mt-0.5">{card.statLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(min-width: 768px) 400px, 90vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </CardStack>
      </div>
    </section>
  );
}
