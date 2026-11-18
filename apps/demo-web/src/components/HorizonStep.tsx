"use client";

import React, { useState } from "react";
import {
  CalendarRange,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";

interface HorizonStepProps {
  cutoffDate: string;
  onSelectHorizon: (daysAhead: number, horizonType: "day" | "week") => Promise<void>;
}

// The API forecasts 1 to 7 days ahead (Settings.horizons = (1, 7)), so there is no monthly option.
export function HorizonStep({ cutoffDate, onSelectHorizon }: HorizonStepProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<"day" | "week">("week");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const cutoff = new Date(cutoffDate);
  const nextDay = new Date(cutoff);
  nextDay.setDate(cutoff.getDate() + 1);

  const nextWeekEnd = new Date(cutoff);
  nextWeekEnd.setDate(cutoff.getDate() + 7);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const horizons = [
    {
      id: "day" as const,
      days: 1,
      title: "Next Day",
      subtitle: "Immediate Tomorrow Prep",
      dateRange: formatDate(nextDay),
      dayBreakdownNote: "1 Day Detailed Prep Sheet",
      badge: "High Precision",
      description:
        "Single-day point estimate and P5–P95 range bands for immediate morning market procurement and kitchen station setup.",
      features: [
        "Portions for each dish sold in the last 28 days",
        "P5 / Likely / P95 safety bounds for procurement",
      ],
    },
    {
      id: "week" as const,
      days: 7,
      title: "Next Week",
      subtitle: "7-Day Day-Wise Schedule",
      dateRange: `${formatDate(nextDay)} → ${formatDate(nextWeekEnd)}`,
      dayBreakdownNote: "Exact Daily Portions for Each of the 7 Days",
      badge: "Most Popular for Clients",
      isRecommended: true,
      description:
        "Individual portion quantities for Day 1 through Day 7, learned from each dish's weekday pattern and the Hyderabad festival calendar.",
      features: [
        "Day-wise portion targets (NOT an aggregated lump sum)",
        "Daily P5/P95 safety buffers per item",
        "Day-by-day variance tracking vs ground truth",
      ],
    },
  ];

  const handleExecute = async (hId: "day" | "week") => {
    setSelectedHorizon(hId);
    setIsRunning(true);
    setError(null);
    const days = hId === "day" ? 1 : 7;

    try {
      // STRICT REQUIREMENT: Only transitions to Step 4 when API resolves with 200 OK
      await onSelectHorizon(days, hId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(
            message || "Failed to process live forecast from backend.",
            500,
            `/restaurants/{id}/forecast?days=${days}`,
            message
          )
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D7B7] bg-[#FAF5EA] px-3.5 py-1 text-xs font-semibold text-[#8F6D27] mb-3">
          <CalendarRange className="size-3.5 text-[#B88E3E]" />
          <span>STEP 3 · FORECAST HORIZON</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18181B]">
          Select Your Prediction Horizon
        </h2>
        <p className="mt-2 text-sm text-[#52525B] max-w-2xl mx-auto">
          Choose whether to forecast the next day or the next 7 days. The weekly horizon generates{" "}
          <strong className="text-[#8F6D27]">day-wise portions for each individual day</strong>, never a vague lump sum.
        </p>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="mb-6">
          <ErrorAlert
            title="Forecast Generation Failed"
            error={error}
            onRetry={() => handleExecute(selectedHorizon)}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {horizons.map((h) => {
          const isSelected = selectedHorizon === h.id;

          return (
            <div
              key={h.id}
              onClick={() => {
                if (!isRunning) {
                  setSelectedHorizon(h.id);
                  setError(null);
                }
              }}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all cursor-pointer ${isSelected
                  ? "border-2 border-[#B88E3E] bg-white shadow-[0_8px_30px_rgba(184,142,62,0.12)] -translate-y-1"
                  : "border-[#EADDCE] bg-[#FAF8F5]/60 hover:bg-white hover:border-[#B88E3E]/60 shadow-sm"
                }`}
            >
              {h.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#B88E3E] text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 shadow-sm">
                  Recommended for Commercial Outlets
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#FAF5EA] border border-[#E5D7B7] text-[#8F6D27]">
                    {h.badge}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#71717A]">
                    {h.days} {h.days === 1 ? "Day" : "Days"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#18181B] mb-0.5">{h.title}</h3>
                <div className="text-xs font-medium text-[#71717A] mb-3">{h.subtitle}</div>

                <div className="rounded-xl border border-[#EADDCE] bg-[#FAF8F5] p-3 mb-4">
                  <div className="text-[10px] text-[#71717A] uppercase tracking-wider font-medium">Valid Horizon Window</div>
                  <div className="font-mono text-xs text-[#18181B] font-bold mt-0.5">{h.dateRange}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ✓ {h.dayBreakdownNote}
                  </div>
                </div>

                <p className="text-xs text-[#52525B] leading-relaxed mb-6">{h.description}</p>

                <div className="space-y-2 border-t border-[#EADDCE] pt-4 mb-6">
                  {h.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#27272A]">
                      <span className="text-[#B88E3E] font-bold">•</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecute(h.id);
                }}
                disabled={isRunning}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${isSelected
                    ? "bg-[#B88E3E] text-white hover:bg-[#9E772E] shadow-[0_4px_14px_rgba(184,142,62,0.3)]"
                    : "border border-[#EADDCE] bg-white hover:bg-[#FAF8F5] text-[#18181B]"
                  }`}
              >
                {isRunning && isSelected ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Querying Backend...</span>
                  </>
                ) : (
                  <>
                    <span>Predict {h.title}</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quantile Forecast Bar */}
      <div className="rounded-2xl border border-[#E5D7B7] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#FAF5EA] border border-[#E5D7B7] flex items-center justify-center text-[#B88E3E] shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#18181B]">Quantile Forecasting Model Engine Active</div>
            <div className="text-[11px] text-[#52525B]">
              Generates P5 lower bounds, likely median forecasts, and P95 upper buffers to prevent stockouts and food waste.
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#8F6D27] bg-[#FAF5EA] px-3 py-1.5 rounded-full border border-[#E5D7B7] shrink-0">
          <ShieldCheck className="size-3.5 text-[#B88E3E]" />
          <span>Zero-leakage temporal split</span>
        </div>
      </div>
    </div>
  );
}
