"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { simulationDishes, simulationConditions } from "@/content/site";
import {
  Sparkles,
  CloudRain,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function LiveForecastCockpit() {
  const [selectedDishId, setSelectedDishId] = useState(simulationDishes[0].id);
  const [selectedConditionId, setSelectedConditionId] = useState(simulationConditions[0].id);

  const currentDish = simulationDishes.find((d) => d.id === selectedDishId) || simulationDishes[0];
  const currentCondition =
    simulationConditions.find((c) => c.id === selectedConditionId) || simulationConditions[0];

  const calculatedPortions = Math.round(currentDish.basePortions * currentCondition.multiplier);
  const minPortion = Math.round(calculatedPortions * 0.88);
  const maxPortion = Math.round(calculatedPortions * 1.12);
  const totalRevenue = (calculatedPortions * currentDish.unitPrice).toLocaleString("en-IN");

  // Dynamic SVG path for the forecast graph
  const basePoints = [
    [0, 110],
    [50, 125],
    [100, 95],
    [150, 130],
    [200, 105],
    [250, 80],
    [300, 115],
    [350, 90],
    [400, 75],
  ];

  // Modulate today & tomorrow based on condition
  const peakHeight = Math.max(30, 95 - (currentCondition.multiplier - 1) * 75);
  const forecastPoints = [
    [400, 75],
    [460, peakHeight],
    [520, peakHeight + 15],
    [580, peakHeight - 5],
  ];

  const pastPath = basePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const forecastPath = forecastPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

  const rangePolygon = `${forecastPoints[0][0]},${forecastPoints[0][1]} ${forecastPoints[1][0]},${forecastPoints[1][1] - 22} ${forecastPoints[2][0]},${forecastPoints[2][1] - 22} ${forecastPoints[3][0]},${forecastPoints[3][1] - 20} ${forecastPoints[3][0]},${forecastPoints[3][1] + 24} ${forecastPoints[2][0]},${forecastPoints[2][1] + 24} ${forecastPoints[1][0]},${forecastPoints[1][1] + 24}`;

  return (
    <section id="cockpit" className="relative isolate overflow-hidden bg-canvas py-32 text-alabaster border-t border-champagne/15">
      {/* Background glow & subtle mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-champagne/10 blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[450px] w-[450px] rounded-full bg-celadon/10 blur-[130px]"
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* Section Eyebrow & Title */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-champagne backdrop-blur-md">
            <Sparkles className="size-3.5 text-champagne" />
            <span>Interactive Simulator · Experience The Algorithm</span>
          </div>
          <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-alabaster leading-tight">
            The Foresight <em className="italic font-medium text-champagne">Cockpit</em>
          </h2>
          <p className="mt-5 text-lg font-light leading-relaxed text-lichen">
            See how real weather events and weekend traffic shift portion demand, recalculate raw kilograms, and protect restaurant margins.
          </p>
        </div>

        {/* Dish & Condition Selectors */}
        <div className="mt-14 flex flex-col gap-8">
          {/* Dish Switcher Pills */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lichen mb-3 text-center sm:text-left">
              1. Select A Signature Dish
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {simulationDishes.map((dish) => {
                const active = dish.id === selectedDishId;
                return (
                  <button
                    key={dish.id}
                    onClick={() => setSelectedDishId(dish.id)}
                    className={`group relative rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-champagne text-ink font-semibold shadow-[0_0_25px_rgba(232,213,181,0.45)]"
                        : "bg-surface border border-champagne/15 text-alabaster/80 hover:bg-surface-elevated hover:text-alabaster"
                    }`}
                  >
                    <span>{dish.name}</span>
                    {active && (
                      <motion.div
                        layoutId="activeDishGlow"
                        className="absolute inset-0 rounded-full border-2 border-white/50 pointer-events-none"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-World Conditions Toggle */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lichen mb-3 text-center sm:text-left">
              2. Toggle Atmospheric & Calendar Scenario
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {simulationConditions.map((cond) => {
                const active = cond.id === selectedConditionId;
                return (
                  <button
                    key={cond.id}
                    onClick={() => setSelectedConditionId(cond.id)}
                    className={`relative rounded-2xl p-4 text-left transition-all duration-300 border cursor-pointer ${
                      active
                        ? "border-champagne bg-surface-elevated shadow-[0_12px_36px_rgba(232,213,181,0.18)]"
                        : "border-champagne/15 bg-surface/70 hover:bg-surface-elevated hover:border-champagne/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-alabaster">{cond.label}</span>
                      {cond.id === "rain" && <CloudRain className="size-4 text-celadon" />}
                      {cond.id === "weekend" && <Calendar className="size-4 text-champagne" />}
                      {cond.id === "match" && <Flame className="size-4 text-champagne" />}
                      {cond.id === "normal" && <Clock className="size-4 text-lichen" />}
                    </div>
                    <p className="mt-1 text-xs text-lichen leading-relaxed">{cond.desc}</p>
                    {active && (
                      <span className="mt-3 inline-block text-[11px] font-semibold text-champagne">
                        Active Scenario ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Simulator Display Panel */}
        <div className="mt-10 rounded-3xl border border-champagne/20 bg-surface/90 p-6 lg:p-10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            {/* Left: Dynamic Forecast Graph */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-champagne/15 pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne">
                    LightGBM Confidence Curve
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-alabaster">
                    {currentDish.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-lichen">
                    <span className="size-2 rounded-full bg-white/40" /> Actual POS
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-celadon">
                    <span className="size-2 rounded-full bg-celadon shadow-[0_0_8px_rgba(78,155,126,0.6)]" /> P10–P90 Range
                  </span>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="relative mt-8 h-64 w-full">
                <svg
                  viewBox="0 0 600 220"
                  className="h-full w-full overflow-visible"
                  role="img"
                  aria-label="Dynamic forecast prediction graph"
                >
                  {/* Grid Lines */}
                  <g stroke="#E8D5B5" strokeOpacity="0.08">
                    {[40, 90, 140, 190].map((y) => (
                      <line key={y} x1="0" y1={y} x2="600" y2={y} strokeDasharray="3 4" />
                    ))}
                  </g>

                  {/* Past Sales Path */}
                  <motion.path
                    d={pastPath}
                    fill="none"
                    stroke="#F5F3EF"
                    strokeOpacity="0.7"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2 }}
                  />

                  {/* Shaded Confidence Band */}
                  <polygon points={rangePolygon} fill="#4E9B7E" fillOpacity="0.18" />

                  {/* Forecast Line */}
                  <motion.path
                    d={forecastPath}
                    fill="none"
                    stroke="#4E9B7E"
                    strokeWidth="2.8"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />

                  {/* Today Marker */}
                  <line
                    x1="400"
                    y1="20"
                    x2="400"
                    y2="200"
                    stroke="#E8D5B5"
                    strokeOpacity="0.3"
                    strokeDasharray="2 3"
                  />
                  <text
                    x="400"
                    y="14"
                    textAnchor="middle"
                    fill="#F5F3EF"
                    fillOpacity="0.6"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="1.2"
                  >
                    TODAY
                  </text>
                  <circle cx="400" cy="75" r="4.5" fill="#F5F3EF" />

                  {/* Tomorrow Peak Target Marker */}
                  <circle
                    cx={forecastPoints[1][0]}
                    cy={forecastPoints[1][1]}
                    r="14"
                    fill="#E8D5B5"
                    fillOpacity="0.25"
                  />
                  <circle
                    cx={forecastPoints[1][0]}
                    cy={forecastPoints[1][1]}
                    r="6"
                    fill="#E8D5B5"
                  />
                </svg>

                {/* Floating Prediction Pill on Graph */}
                <div className="absolute right-4 bottom-2 rounded-xl bg-surface/95 border border-champagne/20 px-3 py-1.5 text-xs text-lichen backdrop-blur-md">
                  <span>Context: </span>
                  <span className="font-semibold text-champagne">{currentCondition.weatherText}</span>
                </div>
              </div>
            </div>

            {/* Right: Real-time Calculated Metrics & Kilograms */}
            <div className="flex flex-col gap-6 rounded-2xl bg-surface-elevated/70 p-6 sm:p-8 border border-champagne/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-lichen">
                  Tomorrow&apos;s Target Prep
                </span>
                <span className="rounded-full bg-celadon/15 border border-celadon/30 px-3 py-1 text-xs font-semibold text-celadon-light">
                  Confidence 91%
                </span>
              </div>

              {/* Portions Counter Display */}
              <div className="flex items-baseline gap-3">
                <motion.span
                  key={calculatedPortions}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-serif text-5xl sm:text-6xl font-semibold text-champagne tracking-tight"
                >
                  {calculatedPortions}
                </motion.span>
                <span className="text-lg text-lichen font-light">portions</span>
              </div>

              {/* Safe Range Bar */}
              <div>
                <div className="flex justify-between text-xs text-lichen font-medium mb-1.5">
                  <span>Chef Safe Window</span>
                  <span className="text-champagne font-semibold">
                    {minPortion} – {maxPortion} portions
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-[15%] right-[15%] rounded-full bg-champagne"
                    layout
                  />
                </div>
              </div>

              {/* Recipe Explosion Kilograms */}
              <div className="border-t border-champagne/15 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-lichen">
                    Recipe Raw Requirements (kg)
                  </span>
                  <span className="text-[11px] text-celadon-light font-medium">Dispatched to Vendors</span>
                </div>
                <ul className="flex flex-col gap-2">
                  {currentDish.ingredients.map((ing) => {
                    const scaledQty = (ing.qty * currentCondition.multiplier).toFixed(1);
                    return (
                      <li
                        key={ing.name}
                        className="flex items-center justify-between text-sm py-1 border-b border-champagne/10 last:border-0"
                      >
                        <span className="flex items-center gap-2 text-alabaster/90">
                          <CheckCircle2 className="size-3.5 text-celadon" />
                          {ing.name}
                        </span>
                        <span className="font-mono font-semibold text-champagne">
                          {scaledQty} {ing.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Projected Savings & Revenue Pill */}
              <div className="flex items-center justify-between rounded-xl bg-surface border border-champagne/25 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-lichen">
                    Prevented Food Waste
                  </p>
                  <p className="font-serif text-xl font-semibold text-celadon-light">
                    {currentCondition.wasteSavings}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-lichen">
                    Projected Item Takings
                  </p>
                  <p className="font-serif text-xl font-semibold text-champagne">
                    ₹ {totalRevenue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
