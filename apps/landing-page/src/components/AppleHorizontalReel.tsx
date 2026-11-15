"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

interface ReelCard {
  id: string;
  tag: string;
  title: string;
  metric: string;
  metricLabel: string;
  desc: string;
  image: string;
}

const REEL_CARDS: ReelCard[] = [
  {
    id: "card-1",
    tag: "PRECISION ENGINE",
    title: "Weather & Cricket Match Ingestion",
    metric: "12 min",
    metricLabel: "Hyperlocal weather update interval",
    desc: "Ingests live Doppler precipitation radars, Hyderabad city traffic, and Rajiv Gandhi Stadium match schedules to calibrate delivery demand automatically.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "card-2",
    tag: "RECIPE EXPLOSION",
    title: "Decimal Kilograms for the Market",
    metric: "0.1 kg",
    metricLabel: "Precision ingredient breakdown",
    desc: "Turn 185 predicted Chicken Dum Biryanis into 24.5 kg poultry, 18.0 kg basmati rice, and 4.2 kg ghee before morning wholesale supplier cutoffs.",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "card-3",
    tag: "ZERO-APP DISPATCH",
    title: "Native WhatsApp Line Delivery",
    metric: "60 sec",
    metricLabel: "Total daily kitchen touchpoint",
    desc: "Delivered directly to head chefs in English, Telugu (తెలుగు), and Hindi (हिंदी). No tablets to charge, no passwords to forget, no complex ERP dropdowns.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "card-4",
    tag: "EBITDA PROTECTION",
    title: "Prevent Walkouts & Spoilage",
    metric: "₹3.4L",
    metricLabel: "Average monthly bottom-line savings",
    desc: "Stop running out of premium cuts on Sunday dinner. Stop dumping unsold gravies at midnight. Measure every rupee saved on monthly audits.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "card-5",
    tag: "CONTINUOUS RETRAINING",
    title: "Nightly Self-Correcting Feedback",
    metric: "86%+",
    metricLabel: "Consistent daily portion precision",
    desc: "When closing chefs tap actual leftover portions into WhatsApp at midnight, LightGBM quantile regression retrains overnight for tomorrow.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
  },
];

export function AppleHorizontalReel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Scroll distance: 340vh for smooth, unhurried scrub pacing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Inertia spring dampener for fluid horizontal gliding
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    mass: 0.6,
  });

  // Track starts aligned with the left (0%) and glides to -62%
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-62%"]);
  const progressLine = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative h-[340vh] bg-canvas text-alabaster overflow-clip border-t border-champagne/15"
    >
      {/* Sticky Viewport: Locked to full screen while scrolling */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
        {/* Header Bar: Aligned with standard container */}
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne">
              <Sparkles className="size-3.5 text-champagne" />
              <span>Interactive Horizontal Gallery · Kitchen Infrastructure</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-alabaster tracking-tight">
              The Architecture of <span className="italic font-normal text-champagne">Foresight</span>
            </h2>
          </div>

          {/* Progress Tracker Pill */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-lichen">
              Scroll Down to Glide
            </span>
            <div className="h-1.5 w-28 sm:w-36 rounded-full bg-surface-elevated overflow-hidden border border-champagne/20">
              <motion.div
                className="h-full bg-champagne rounded-full"
                style={{ width: progressLine }}
              />
            </div>
          </div>
        </div>

        {/* Horizontal Sliding Track: Anchored from the left aligned with header */}
        <div className="w-full pl-6 sm:pl-10 lg:pl-[max(24px,calc((100vw-1280px)/2+48px))]">
          <motion.div
            style={reduceMotion ? undefined : { x }}
            className="flex gap-6 sm:gap-8 will-change-transform"
          >
            {REEL_CARDS.map((card, idx) => (
              <div
                key={card.id}
                className="relative h-[500px] sm:h-[540px] lg:h-[560px] w-[380px] sm:w-[440px] lg:w-[500px] flex-shrink-0 rounded-[32px] overflow-hidden border border-champagne/20 bg-surface/95 backdrop-blur-xl p-8 sm:p-9 flex flex-col justify-between shadow-2xl group hover:border-champagne/60 hover:shadow-[0_24px_70px_rgba(232,213,181,0.18)] transition-all duration-500 cursor-pointer"
              >
                {/* 
                  Background Culinary Image:
                  Crisp, high-definition full-color culinary photography with bottom fade scrim
                */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 380px, (max-width: 1200px) 440px, 500px"
                    className="object-cover opacity-85 saturate-[1.12] contrast-[1.06] transition-transform duration-700 ease-out group-hover:scale-108 group-hover:opacity-100"
                    priority={idx < 2}
                  />
                  {/* Bottom Vignette Gradient: Leaves top 55% crystal-clear, darkens bottom for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/80 via-45% to-transparent pointer-events-none" />
                </div>

                {/* Top: Card index & Tag badge */}
                <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                  <span className="rounded-full border border-champagne/30 bg-canvas/70 backdrop-blur-md px-3.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-champagne shadow-sm">
                    {card.tag}
                  </span>
                  <span className="rounded-full bg-canvas/60 backdrop-blur-md px-2.5 py-1 text-xs font-mono text-lichen border border-champagne/15">
                    0{idx + 1} / 0{REEL_CARDS.length}
                  </span>
                </div>

                {/* Bottom: Big Numeral Metric & Editorial Content */}
                <div className="relative z-10">
                  <div className="mb-4">
                    <span className="font-serif text-5xl sm:text-6xl font-semibold text-champagne tracking-tight block drop-shadow-md">
                      {card.metric}
                    </span>
                    <span className="text-xs font-mono text-champagne/80 uppercase tracking-wider block mt-1.5 font-medium">
                      {card.metricLabel}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-alabaster tracking-tight leading-snug drop-shadow-sm">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm font-light text-lichen leading-relaxed max-w-md">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
