"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Sparkles, ArrowUpRight } from "lucide-react";

/**
 * MaestroClass Scroller Animation
 * Replicating the curated Lenis template from https://lenis.dev/templates
 * as shown in the user's uploaded reference:
 * - Calming sage background (#E2E8DD)
 * - Continuous center spine with animated scroll-linked progress line
 * - Dark olive rounded milestone pills (001, 002, 003, 004, 005)
 * - Alternating layout with tilted editorial photo cards and rich Didone serif typography
 */

interface MilestoneItem {
  id: string;
  milestone: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  baseTilt: number; // positive = clockwise (like Row 002 in screenshot), negative = counter-clockwise
  tag?: string;
}

const MILESTONES: MilestoneItem[] = [
  {
    id: "m1",
    milestone: "001",
    title: "The Nightly Kitchen Signal",
    body: "Before the kitchen fires cool down, receive tomorrow's prep sheet with statistical confidence ranges for every single item on your menu.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Executive chef inspecting dishes under warm kitchen heat lamps",
    baseTilt: -2.0,
    tag: "9:00 PM DISPATCH",
  },
  {
    id: "m2",
    milestone: "002",
    title: "The Tuscan Market Immersion",
    body: "Walk the local markets with a chef's eye. Source flour, tomatoes, and basil directly from the people who grow and make them.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "The Tuscan Market Immersion — fresh basil, tomatoes, and market crates",
    baseTilt: 3.2, // Exactly matching Milestone 002 in user screenshot!
    tag: "7:30 AM SOURCING",
  },
  {
    id: "m3",
    milestone: "003",
    title: "Private Wood-Fired Sessions",
    body: "Hands-on oven time with direct, personal feedback. No demonstrations. No spectators. We make sure every participant works the fire.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Private Wood-Fired Sessions — baker working the wood-fired brick oven",
    baseTilt: -2.4, // Exactly matching Milestone 003 in user screenshot!
    tag: "11:30 AM FIRE & DUM",
  },
  {
    id: "m4",
    milestone: "004",
    title: "The Midday Shift Calibration",
    body: "From midday lunch rush to the evening dinner service. Real-time dynamic adjustments as rain rolls in or unexpected banquet parties sit down.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Sealed authentic copper handi slow cooking over charcoal embers",
    baseTilt: 2.6,
    tag: "3:30 PM RE-CALIBRATION",
  },
  {
    id: "m5",
    milestone: "005",
    title: "The 60-Second Closing Ritual",
    body: "Close out the service in sixty seconds. Reconcile unsold portions, capture anomalies, and train tomorrow's forecasting weights before you walk out.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Artisanal culinary prep station with copper cookware and precision tools",
    baseTilt: -1.8,
    tag: "11:15 PM CLOSE",
  },
];

export function MaestroClassTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 30%"],
  });

  const reduceMotion = useReducedMotion();

  return (
    <section id="workflow" className="relative bg-ink py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8">
      {/* Outer framing wrapper (mimicking the Framer / Lenis showcase canvas) */}
      <div className="mx-auto max-w-6xl">
        {/* Top Eyebrow outside the sheet */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-mint backdrop-blur-md">
            <Sparkles className="size-3.5 text-mint" />
            <span>Lenis Smooth Scroller · MaestroClass Template</span>
          </div>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight">
            The Masterclass <em className="italic font-normal text-mint">Curriculum</em>
          </h2>
        </div>

        {/* The Master Sheet: Soft Sage Green background #E2E8DD */}
        <div
          ref={containerRef}
          className="relative rounded-[32px] sm:rounded-[44px] bg-[#E2E8DD] text-[#1F2821] p-8 sm:p-14 lg:p-20 shadow-[0_30px_90px_rgba(0,0,0,0.45)] border border-[#CAD4C6] overflow-hidden"
        >
          {/* Subtle noise / linen texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(#1A241C 1px, transparent 1px), radial-gradient(#1A241C 1px, #E2E8DD 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          />

          {/* Continuous Center Spine Line */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-24 bottom-24 w-[1.5px] -translate-x-1/2 bg-[#A2AEA1]"
          >
            {/* Animated filled progress line */}
            <motion.div
              style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
              className="h-full w-full bg-[#38463A]"
            />
          </div>

          {/* Milestones List */}
          <div className="relative flex flex-col gap-24 sm:gap-32 lg:gap-40">
            {MILESTONES.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <MilestoneRow
                  key={item.id}
                  item={item}
                  index={index}
                  isEven={isEven}
                  reduceMotion={!!reduceMotion}
                />
              );
            })}
          </div>

          {/* Bottom Footer Badge matching the Framer template */}
          <div className="mt-20 pt-8 border-t border-[#CAD4C6] flex flex-wrap items-center justify-between text-xs text-[#525F54] font-medium">
            <span className="font-mono">MaestroClass Experience · Designed for High-Ticket Flow</span>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#D4DDD0] border border-[#BAC6B5] px-3 py-1 font-mono text-[11px] text-[#334035]">
              <span>Powered by Lenis Smooth Scroll</span>
              <ArrowUpRight className="size-3 text-[#334035]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface MilestoneRowProps {
  item: MilestoneItem;
  index: number;
  isEven: boolean;
  reduceMotion: boolean;
}

function MilestoneRow({ item, isEven, reduceMotion }: MilestoneRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Local scroll progress for card entrance, tilt transition, and parallax
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "center center"],
  });

  // Dynamic parallax & smooth tilt settling
  const yOffset = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 1]);
  const dynamicTilt = useTransform(
    scrollYProgress,
    [0, 1],
    [item.baseTilt * 1.6, item.baseTilt]
  );
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  return (
    <div
      ref={rowRef}
      className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 md:gap-14 lg:gap-18"
    >
      {/* 
        COLUMN 1:
        On even rows (0, 2, 4): Text on left (e.g. Milestone 002: "The Tuscan Market Immersion")
        On odd rows (1, 3): Photo on left (e.g. Milestone 003: Wood-fired oven photo)
      */}
      {isEven ? (
        <motion.div
          style={reduceMotion ? undefined : { opacity, y: yOffset }}
          className="flex flex-col justify-center md:text-right md:items-end pr-0 md:pr-4"
        >
          {item.tag && (
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#556457] mb-2">
              {item.tag}
            </span>
          )}
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C261E] leading-[1.12] tracking-tight">
            {item.title}
          </h3>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#4A574C] max-w-md font-sans">
            {item.body}
          </p>
        </motion.div>
      ) : (
        <motion.div
          style={reduceMotion ? undefined : { rotate: dynamicTilt, scale, opacity }}
          className="relative group cursor-pointer"
        >
          <ImageCard item={item} />
        </motion.div>
      )}

      {/* 
        COLUMN 2 (CENTER SPINE):
        Milestone Pill Badge (001, 002, 003, 004, 005)
        Matching the exact dark olive rounded pill from the user's screenshot!
      */}
      <div className="relative z-10 flex justify-center order-first md:order-none">
        <motion.div
          initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="rounded-md bg-[#586557] px-2.5 py-1 text-center shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[#485347]"
        >
          <span className="font-mono text-xs font-semibold tracking-wider text-[#FFFFFF]">
            {item.milestone}
          </span>
        </motion.div>
      </div>

      {/* 
        COLUMN 3:
        On even rows: Photo on right (e.g. Milestone 002: Tuscan market photo with clockwise tilt)
        On odd rows: Text on right (e.g. Milestone 003: "Private Wood-Fired Sessions")
      */}
      {isEven ? (
        <motion.div
          style={reduceMotion ? undefined : { rotate: dynamicTilt, scale, opacity }}
          className="relative group cursor-pointer"
        >
          <ImageCard item={item} />
        </motion.div>
      ) : (
        <motion.div
          style={reduceMotion ? undefined : { opacity, y: yOffset }}
          className="flex flex-col justify-center md:text-left md:items-start pl-0 md:pl-4"
        >
          {item.tag && (
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#556457] mb-2">
              {item.tag}
            </span>
          )}
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C261E] leading-[1.12] tracking-tight">
            {item.title}
          </h3>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#4A574C] max-w-md font-sans">
            {item.body}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function ImageCard({ item }: { item: MilestoneItem }) {
  return (
    <div className="relative aspect-[4/3] w-full max-w-[500px] overflow-hidden rounded-[20px] sm:rounded-[26px] bg-[#D4DDD0] shadow-[0_20px_50px_-10px_rgba(31,40,33,0.22)] border border-[#BAC6B5] transition-transform duration-500 ease-out group-hover:scale-[1.03]">
      <Image
        src={item.image}
        alt={item.imageAlt}
        fill
        sizes="(min-width: 1024px) 460px, (min-width: 768px) 40vw, 90vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        priority={item.milestone === "002"}
      />
      {/* Subtle bottom gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />

      {/* Floating subtle badge inside card */}
      <div className="absolute bottom-4 left-4 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 border border-white/20 text-[11px] font-mono font-medium text-white/90">
        Phase {item.milestone}
      </div>
    </div>
  );
}
