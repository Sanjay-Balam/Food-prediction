"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import { Clock } from "lucide-react";

interface MilestoneStage {
  id: string;
  milestone: string;
  tag: string;
  time: string;
  title: string;
  subtitle: string;
  body: string;
  image: string;
  imageAlt: string;
  tilt: number; // positive = clockwise (Row 002 in user screenshot), negative = counter-clockwise (Row 003)
  photoPosition: "left" | "right";
  stat: string;
  statLabel: string;
}

const STAGES: MilestoneStage[] = [
  {
    id: "stage-01",
    milestone: "001",
    tag: "THE NIGHTLY DISPATCH",
    time: "9:00 PM",
    title: "The Nightly Kitchen Signal",
    subtitle: "Tomorrow's rush, decoded before the stoves cool down.",
    body: "While the dining room finishes dessert, Logeeca crunches two years of historical POS data, tomorrow's weather forecast, and local banquet bookings. A concise WhatsApp prep card arrives directly in the Head Chef's hands with recommended batch sizes.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Executive chef inspecting dishes under warm kitchen heat lamps",
    tilt: -2.2,
    photoPosition: "left",
    stat: "9:00 PM",
    statLabel: "Automated Daily Dispatch",
  },
  {
    id: "stage-02",
    milestone: "002",
    tag: "THE TUSCAN MARKET IMMERSION",
    time: "7:30 AM",
    title: "The Tuscan Market Immersion",
    subtitle: "Source flour, poultry, and spices with mathematical precision.",
    body: "Walk the local markets with a chef's eye. Source flour, tomatoes, and basil directly from the people who grow and make them. Logeeca's recipe explosion converts expected covers into exact decimal kilograms of poultry, aged basmati, and cold-pressed oil.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "The Tuscan Market Immersion — fresh basil, tomatoes, and market crates",
    tilt: 3.4, // Matches the clockwise tilted photo from Milestone 002 in the screenshot!
    photoPosition: "right",
    stat: "100% In-Step",
    statLabel: "Raw Ingredients to Menu Ratio",
  },
  {
    id: "stage-03",
    milestone: "003",
    tag: "PRIVATE WOOD-FIRED SESSIONS",
    time: "11:30 AM",
    title: "Private Wood-Fired Sessions",
    subtitle: "Hands-on oven time with direct, personal feedback.",
    body: "No demonstrations. No spectators. We make sure every participant works the fire. High-value dishes like dum biryani, braised gravies, and tandoori roasters require 4 to 8 hours of slow marination and flame control — locked to exact consumption thresholds.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Private Wood-Fired Sessions — baker working the wood-fired brick oven",
    tilt: -2.6, // Matches the counter-clockwise tilted photo from Milestone 003 in the screenshot!
    photoPosition: "left",
    stat: "38% Less",
    statLabel: "Nightly End-of-Day Waste",
  },
  {
    id: "stage-04",
    milestone: "004",
    tag: "THE MIDDAY CALIBRATION",
    time: "3:30 PM",
    title: "The Midday Shift Calibration",
    subtitle: "Sudden monsoon rain? Dinner prep adjusts automatically.",
    body: "If lunch showed a sudden weather swing or an unexpected corporate banquet arrived, Logeeca cross-checks noon orders against the initial curve. By 3:30 PM, the evening line receives a live delta update: add +14 portions of Biryani, adjust curry bases before dinner fires ignite.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Authentic sealed copper handi slow cooking over charcoal embers",
    tilt: 2.8,
    photoPosition: "right",
    stat: "+14% Net",
    statLabel: "Protected Dinner Revenue",
  },
  {
    id: "stage-05",
    milestone: "005",
    tag: "THE 60-SECOND CLOSE",
    time: "11:15 PM",
    title: "The 60-Second Closing Ritual",
    subtitle: "Every day's close trains tomorrow's intelligence.",
    body: "No cumbersome ERP spreadsheets. The night manager taps three quick tallies on WhatsApp: remaining unsold portions, any stockout incidents, and an anomaly tag (e.g. Heavy Rain or Local Festival). The machine learning weights update overnight, sharpening tomorrow's forecast.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Artisanal culinary prep station with copper cookware and precision tools",
    tilt: -2.0,
    photoPosition: "left",
    stat: "86% to 92%",
    statLabel: "Model Accuracy Gain in 30 Days",
  },
];

export function AppleMaestroScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Scroll distance: 400vh for ultra-smooth Apple-grade scrub pacing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth out progress with a gentle spring for inertia
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 0.5,
  });

  const [activeStageIdx, setActiveStageIdx] = useState(0);

  // Update active stage indicator based on progress
  scrollYProgress.on("change", (latest) => {
    const rawIdx = Math.min(
      STAGES.length - 1,
      Math.floor(latest * STAGES.length)
    );
    if (rawIdx !== activeStageIdx) {
      setActiveStageIdx(rawIdx);
    }
  });

  const jumpToStage = (index: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight;
    const targetScroll = containerTop + (index / (STAGES.length - 0.5)) * (containerHeight - window.innerHeight);
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      id="workflow"
      className="relative h-[420vh] bg-canvas text-alabaster"
    >
      {/* Sticky Viewport Container: Pinned to full screen */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        {/* Subtle background ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-champagne/10 blur-[160px]"
        />

        {/* Top Header / Status Pill */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-champagne backdrop-blur-md">
            <span className="size-2 rounded-full bg-celadon animate-pulse" />
            <span>Interactive Pinned Scroller · 24-Hour Rhythm</span>
          </div>
        </div>

        {/* 
          THE MASTER SAGE SHEET (#E2E8DD)
          Matching the exact framed showcase from the MaestroClass Lenis template screenshot!
        */}
        <div className="relative w-full max-w-5xl lg:max-w-6xl h-[78vh] sm:h-[80vh] max-h-[820px] rounded-[32px] sm:rounded-[44px] bg-[#E2E8DD] text-[#1C261E] border border-[#CCD6C8] shadow-[0_30px_100px_rgba(0,0,0,0.6)] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
          {/* Subtle linen/canvas grain texture */}
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

          {/* Top Title Bar of the Sheet */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#CAD4C6] pb-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#556457]">
                Curated 24-Hour Curriculum
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C261E] tracking-tight">
                What the <em className="italic font-normal text-[#2E6B56]">24 Hours</em> Hold
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#586557]">
              <span>Scroll to Scrub</span>
              <span className="animate-bounce">↓</span>
            </div>
          </div>

          {/* 
            STAGE VIEWPORT (The Pinned Interactive Core)
            Center spine with milestone badge, alternating tilted photo, and Didone serif headlines
          */}
          <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden">
            {/* Center Vertical Spine Line */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-1/2 top-4 bottom-4 w-[1.5px] -translate-x-1/2 bg-[#A2AEA1]"
            >
              {/* Dynamic filled line progressing with scroll */}
              <motion.div
                style={{ scaleY: smoothProgress, transformOrigin: "top" }}
                className="h-full w-full bg-[#38463A]"
              />
            </div>

            {/* Stages Transition Stack */}
            {STAGES.map((stage, idx) => {
              const startProgress = idx / STAGES.length;
              const endProgress = (idx + 1) / STAGES.length;

              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  idx={idx}
                  progress={smoothProgress}
                  startProgress={startProgress}
                  endProgress={endProgress}
                  reduceMotion={!!reduceMotion}
                />
              );
            })}
          </div>

          {/* 
            APPLE-STYLE SEGMENTED PROGRESS SCRUBBER BAR
            Bottom 5-segment interactive pill tracker like Apple India product pages
          */}
          <div className="relative z-10 pt-4 border-t border-[#CAD4C6]">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {STAGES.map((s, idx) => {
                const isActive = activeStageIdx === idx;
                const isPast = activeStageIdx > idx;

                return (
                  <button
                    key={s.id}
                    onClick={() => jumpToStage(idx)}
                    className="group flex flex-col text-left transition-all duration-200 focus:outline-none"
                  >
                    {/* Progress Bar Segment */}
                    <div className="h-1.5 w-full rounded-full bg-[#BAC6B5] overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-300 ${isActive
                          ? "bg-[#2E6B56] w-full"
                          : isPast
                            ? "bg-[#4A574C] w-full"
                            : "w-0"
                          }`}
                      />
                    </div>

                    {/* Label & Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[10px] sm:text-xs font-semibold ${isActive ? "text-[#1C261E] font-bold" : "text-[#627063]"
                          }`}
                      >
                        {s.milestone}
                      </span>
                      <span
                        className={`hidden lg:inline text-[11px] font-sans truncate max-w-[120px] ${isActive ? "text-[#1C261E] font-medium" : "text-[#758476]"
                          }`}
                      >
                        {s.title.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface StageCardProps {
  stage: MilestoneStage;
  idx: number;
  progress: any;
  startProgress: number;
  endProgress: number;
  reduceMotion: boolean;
}

function StageCard({ stage, idx, progress, startProgress, endProgress, reduceMotion }: StageCardProps) {
  // Apple-grade crossfade window: fades in as progress enters range, stays solid, fades out smoothly
  const fadeStart = Math.max(0, startProgress - 0.05);
  const fadePeakIn = startProgress + 0.04;
  const fadePeakOut = endProgress - 0.04;
  const fadeEnd = Math.min(1, endProgress + 0.05);

  const opacity = useTransform(
    progress,
    [fadeStart, fadePeakIn, fadePeakOut, fadeEnd],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [fadeStart, fadePeakIn, fadePeakOut, fadeEnd],
    [30, 0, 0, -30]
  );

  // Dynamic tilt: enters with slight additional tilt and settles into its signature aesthetic
  const tilt = useTransform(
    progress,
    [fadeStart, fadePeakIn, fadePeakOut, fadeEnd],
    [stage.tilt * 1.4, stage.tilt, stage.tilt, stage.tilt * 0.7]
  );

  const scale = useTransform(
    progress,
    [fadeStart, fadePeakIn, fadePeakOut, fadeEnd],
    [0.95, 1, 1, 0.96]
  );

  const pointerEvents = useTransform(progress, (v: number) =>
    v >= startProgress && v < endProgress ? "auto" : "none"
  );

  const isPhotoRight = stage.photoPosition === "right";

  return (
    <motion.div
      style={reduceMotion ? { opacity } : { opacity, y, scale, pointerEvents }}
      className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-12 lg:gap-16 px-2"
    >
      {/* 
        COLUMN 1:
        If photo is right: Text on Left (e.g. Milestone 002: "The Tuscan Market Immersion")
        If photo is left: Photo on Left (e.g. Milestone 003: Wood-Fired Sessions photo)
      */}
      {isPhotoRight ? (
        <div className="flex flex-col justify-center md:text-right md:items-end pr-0 md:pr-4">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#556457] mb-2 flex items-center gap-2 md:justify-end">
            <Clock className="size-3 text-[#2E6B56]" />
            <span>{stage.time}</span>
            <span>· {stage.tag}</span>
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C261E] leading-[1.1] tracking-tight">
            {stage.title}
          </h3>
          <p className="mt-2 text-sm sm:text-base font-serif italic text-[#4A574C]">
            {stage.subtitle}
          </p>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#3B483D] max-w-md font-sans">
            {stage.body}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-[#D4DDD0] border border-[#BAC6B5] px-3.5 py-1 text-xs font-mono font-medium text-[#2E6B56]">
            <span>{stage.stat}</span>
            <span className="text-[#627063]">· {stage.statLabel}</span>
          </div>
        </div>
      ) : (
        <motion.div
          style={reduceMotion ? undefined : { rotate: tilt }}
          className="relative group flex justify-center md:justify-end"
        >
          <TiltedPhotoCard stage={stage} />
        </motion.div>
      )}

      {/* 
        COLUMN 2 (CENTER SPINE BADGE):
        Pill Badge: 001, 002, 003, 004, 005
        Exact match for the dark olive rounded badge in the screenshot!
      */}
      <div className="relative z-10 flex justify-center order-first md:order-none">
        <div className="rounded-md bg-[#586557] px-3 py-1.5 text-center shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-[#445043]">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#FFFFFF]">
            {stage.milestone}
          </span>
        </div>
      </div>

      {/* 
        COLUMN 3:
        If photo is right: Photo on Right (e.g. Milestone 002: Tuscan Market with +3.4° tilt)
        If photo is left: Text on Right (e.g. Milestone 003: "Private Wood-Fired Sessions")
      */}
      {isPhotoRight ? (
        <motion.div
          style={reduceMotion ? undefined : { rotate: tilt }}
          className="relative group flex justify-center md:justify-start"
        >
          <TiltedPhotoCard stage={stage} />
        </motion.div>
      ) : (
        <div className="flex flex-col justify-center md:text-left md:items-start pl-0 md:pl-4">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#556457] mb-2 flex items-center gap-2">
            <Clock className="size-3 text-[#2E6B56]" />
            <span>{stage.time}</span>
            <span>· {stage.tag}</span>
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#1C261E] leading-[1.1] tracking-tight">
            {stage.title}
          </h3>
          <p className="mt-2 text-sm sm:text-base font-serif italic text-[#4A574C]">
            {stage.subtitle}
          </p>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#3B483D] max-w-md font-sans">
            {stage.body}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-[#D4DDD0] border border-[#BAC6B5] px-3.5 py-1 text-xs font-mono font-medium text-[#2E6B56]">
            <span>{stage.stat}</span>
            <span className="text-[#627063]">· {stage.statLabel}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TiltedPhotoCard({ stage }: { stage: MilestoneStage }) {
  return (
    <div className="relative aspect-[4/3] w-full max-w-[460px] overflow-hidden rounded-[20px] sm:rounded-[26px] bg-[#D4DDD0] shadow-[0_24px_60px_-12px_rgba(28,38,30,0.25)] border border-[#BAC6B5] transition-transform duration-500 ease-out hover:scale-[1.03]">
      <Image
        src={stage.image}
        alt={stage.imageAlt}
        fill
        sizes="(min-width: 1024px) 460px, (min-width: 768px) 40vw, 90vw"
        className="object-cover transition-transform duration-700 ease-out hover:scale-105"
        priority={stage.milestone === "002"}
      />
      {/* Subtle bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

      {/* Floating Pill Tag */}
      <div className="absolute bottom-4 left-4 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 border border-white/20 text-[11px] font-mono text-white/95">
        Phase {stage.milestone} · {stage.time}
      </div>
    </div>
  );
}
