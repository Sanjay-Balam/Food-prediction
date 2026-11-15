"use client";

import React from "react";
import { CountUp } from "@/components/CountUp";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Cpu, CheckCircle2 } from "lucide-react";

const ACCURACY_METRICS = [
  { value: 86, suffix: "%", label: "Daily Item-Level Portion Accuracy", note: "Tested across high-volume Biryani & curry menus" },
  { value: 91, suffix: "%", label: "Weekly Whole-Restaurant Total", note: "Aggregated gross inventory reconciliation" },
  { value: 38, suffix: "%", label: "Average Waste Volume Reduction", note: "Documented within first 45 operating days" },
  { value: 60, suffix: "s", label: "Nightly Chef Interaction Time", note: "Tap 3 numbers on WhatsApp and walk out" },
];

const COMPARISON = [
  { method: "Chef Gut Feeling", accuracy: "62%", variance: "±28%", waste: "High (18–22%)" },
  { method: "Simple 7-Day Average", accuracy: "71%", variance: "±19%", waste: "Moderate (12%)" },
  { method: "Logeeca Foresight (LightGBM)", accuracy: "86%–92%", variance: "±7%", waste: "Minimal (<4%)", active: true },
];

export function Accuracy() {
  return (
    <section id="accuracy" className="relative isolate overflow-hidden bg-canvas py-28 lg:py-36 text-alabaster border-t border-champagne/15">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-champagne/10 blur-[140px]"
      />

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          {/* Left Text */}
          <Reveal>
            <Eyebrow onDark>Empirical Validation</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-alabaster leading-tight">
              Measured, not promised. <br />
              <em className="font-normal italic text-champagne">Back-tested on 2 years</em> of real sales.
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed text-lichen">
              We never deploy a model based on hope. Every machine learning algorithm is evaluated out-of-sample on dates it has never seen — factoring in local monsoons, holidays, and cricket tournaments.
            </p>

            <div className="mt-8 flex flex-col gap-3 text-sm text-lichen">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-celadon" />
                <span className="text-alabaster/90">LightGBM Gradient Boosting with quantile regression loss</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-celadon" />
                <span className="text-alabaster/90">P10 / P50 / P90 confidence intervals for risk-averse kitchen prep</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-celadon" />
                <span className="text-alabaster/90">Automatic continuous retraining from nightly WhatsApp feedback</span>
              </div>
            </div>
          </Reveal>

          {/* Right: Metrics Grid */}
          <div className="grid grid-cols-2 gap-6">
            {ACCURACY_METRICS.map((metric, index) => (
              <Reveal key={metric.label} delay={index * 0.1}>
                <div className="rounded-3xl border border-champagne/15 bg-surface/90 p-6 backdrop-blur-md">
                  <p className="font-serif text-5xl sm:text-6xl font-semibold text-champagne tracking-tight">
                    <CountUp to={metric.value} suffix={metric.suffix} />
                  </p>
                  <p className="mt-3 text-sm font-semibold text-alabaster leading-snug">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-xs text-lichen leading-relaxed">
                    {metric.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Benchmarking Table */}
        <div className="mt-20 rounded-3xl border border-champagne/15 bg-surface/90 p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-champagne mb-6">
            <Cpu className="size-4 text-champagne" />
            <span>Algorithm vs Traditional Approaches</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-champagne/15 text-xs uppercase tracking-wider text-lichen">
                  <th className="pb-4 font-semibold">Forecasting Strategy</th>
                  <th className="pb-4 font-semibold">Portions Accuracy</th>
                  <th className="pb-4 font-semibold">Prep Variance</th>
                  <th className="pb-4 font-semibold">End-of-Day Food Waste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/10">
                {COMPARISON.map((row) => (
                  <tr key={row.method} className={row.active ? "bg-surface-elevated/70 text-alabaster" : "text-lichen"}>
                    <td className="py-4 font-medium flex items-center gap-2">
                      {row.active && <span className="size-2 rounded-full bg-celadon shadow-[0_0_8px_rgba(78,155,126,0.6)]" />}
                      <span className={row.active ? "text-alabaster font-semibold" : ""}>{row.method}</span>
                    </td>
                    <td className={`py-4 font-mono ${row.active ? "font-bold text-champagne" : ""}`}>{row.accuracy}</td>
                    <td className="py-4 font-mono">{row.variance}</td>
                    <td className="py-4">{row.waste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
