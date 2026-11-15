"use client";

import React from "react";
import { CountUp } from "@/components/CountUp";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { problems } from "@/content/site";
import { AlertCircle, TrendingDown, DollarSign } from "lucide-react";

export function Problem() {
  return (
    <section id="problem" className="mx-auto max-w-6xl px-6 py-28 lg:py-36">
      <Reveal>
        <Eyebrow>The Operational Dilemma</Eyebrow>
        <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-ink leading-tight">
          Every kitchen runs on <em className="font-normal italic text-teal">a guess.</em>
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr] items-start">
        <Reveal delay={0.1}>
          <p className="text-lg sm:text-xl leading-relaxed text-body font-light">
            Every night at 11:30 PM, someone decides how much Biryani to cook, how much chicken to cut, and how much paneer to order — from human memory and yesterday’s numbers.
          </p>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted">
            Guess high and good food is thrown into the waste bin at midnight. Guess low and paying guests hear the dreaded words: <strong className="text-ink font-semibold">“Sold out for tonight.”</strong> Both destroy your operating margin.
          </p>
        </Reveal>

        {/* UNEP Statistic Card */}
        <Reveal delay={0.25}>
          <div className="rounded-3xl border border-teal/15 bg-tint/60 p-8 shadow-[0_12px_40px_rgba(18,105,92,0.06)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
              <AlertCircle className="size-4 text-mint-deep" />
              <span>Global Food Service Reality</span>
            </div>
            <p className="mt-4 font-serif text-5xl sm:text-6xl font-semibold text-teal tracking-tight">
              <CountUp to={290} suffix="M" />
            </p>
            <p className="mt-2 text-base font-medium text-ink">
              tonnes of food wasted by commercial restaurants worldwide annually.
            </p>
            <p className="mt-3 text-xs text-muted border-t border-teal/10 pt-3">
              Source: UNEP Food Waste Index Report 2024 · 35% is preventable with predictive scheduling.
            </p>
          </div>
        </Reveal>
      </div>

      {/* 4 Problem Cards */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {problems.map((prob, index) => (
          <Reveal key={prob.title} delay={index * 0.1}>
            <div className="group relative rounded-3xl border border-hairline bg-white p-8 transition-all duration-300 hover:border-teal/30 hover:shadow-[0_16px_40px_rgba(11,33,41,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold italic text-mint-deep">
                  {prob.num}
                </span>
                <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-teal border border-teal/10">
                  {prob.tag}
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl font-semibold text-ink group-hover:text-teal transition-colors">
                {prob.title}
              </h3>
              <p className="mt-3 leading-relaxed text-body text-sm sm:text-base">
                {prob.text}
              </p>

              <div className="mt-6 flex items-baseline justify-between border-t border-hairline/80 pt-4">
                <span className="text-xs text-muted font-medium">{prob.metricLabel}</span>
                <span className="font-serif text-lg font-bold text-teal">{prob.metric}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
