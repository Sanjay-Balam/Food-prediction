"use client";

import React from "react";
import GatewayFlow from "@/components/ui/gateway-flow";
import { ForecastPreview } from "@/components/ForecastPreview";
import { Reveal, RevealWords } from "@/components/Reveal";
import { hero } from "@/content/site";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate w-full min-h-screen bg-canvas text-alabaster overflow-hidden flex flex-col justify-center"
    >
      {/* 
        GatewayFlow: Interactive canvas of 80 bezier particle streams 
        converging towards the center with shockwave ripples on click
      */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <GatewayFlow
          className="w-full h-full"
          mode="dark"
          speed={1.05}
          density={1.2}
          strokeWidth={1.15}
          opacity={0.92}
          brightness={1.05}
        />
      </div>

      {/* Balanced radial scrim: preserves legibility with rich velvet dark depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,17,15,0.22) 0%, rgba(10,17,15,0.58) 60%, rgba(10,17,15,0.92) 100%)",
        }}
      />

      {/* Balanced Champagne & Celadon ambient depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 z-[1] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-champagne/12 blur-[160px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-10 z-[1] h-[400px] w-[500px] rounded-full bg-celadon/10 blur-[150px]"
      />

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl items-center px-6 pt-32 pb-20 lg:pt-36 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.95fr] lg:gap-14">
          {/* Left Column: Eyebrow, Headline, Value Proposition & Actions */}
          <div>
            {/* Eyebrow Pill */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-champagne backdrop-blur-md shadow-[0_0_20px_rgba(232,213,181,0.15)]">
                <span className="size-2 rounded-full bg-celadon animate-pulse" />
                <span>{hero.eyebrow}</span>
              </div>
            </Reveal>

            {/* Editorial Serif Headline */}
            <h1 className="mt-7 font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.04] tracking-tight text-alabaster">
              <RevealWords text="Know tomorrow’s orders" />
              <br />
              <RevealWords
                text="tonight."
                delay={0.25}
                className="italic font-medium text-champagne"
              />
            </h1>

            {/* Subtitle / Description */}
            <Reveal delay={0.45}>
              <p className="mt-6 max-w-xl text-base sm:text-lg font-light leading-relaxed text-lichen">
                {hero.text}
              </p>
            </Reveal>

            {/* Trust Points */}
            <Reveal delay={0.6}>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-xs sm:text-sm text-lichen">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-celadon shrink-0" />
                  <span className="text-alabaster/90">Zero new app to learn (WhatsApp)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-celadon shrink-0" />
                  <span className="text-alabaster/90">86% Daily Portions Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-celadon shrink-0" />
                  <span className="text-alabaster/90">35%+ Documented Waste Drop</span>
                </div>
              </div>
            </Reveal>

            {/* CTA Buttons */}
            <Reveal delay={0.75}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#cockpit"
                  className="group relative inline-flex items-center gap-2.5 rounded-full bg-champagne px-8 py-4 font-semibold text-ink transition-all duration-300 hover:bg-champagne-light hover:shadow-[0_0_35px_rgba(232,213,181,0.5)] cursor-pointer"
                >
                  <span>Launch Live Simulator</span>
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-surface/70 px-7 py-4 font-semibold text-alabaster transition-all duration-300 hover:border-champagne hover:bg-surface-elevated backdrop-blur-sm cursor-pointer"
                >
                  <span>The 24h Rhythm</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Dynamic Forecast Graphic Card */}
          <Reveal delay={0.35} className="w-full">
            <div className="relative">
              <ForecastPreview />
            </div>
          </Reveal>
        </div>

        {/* Scroll indicator prompt */}
        <div className="mt-16 flex justify-center">
          <a
            href="#workflow"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-lichen hover:text-champagne transition-colors duration-200"
          >
            <span>Scroll to explore the 24h rhythm</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
