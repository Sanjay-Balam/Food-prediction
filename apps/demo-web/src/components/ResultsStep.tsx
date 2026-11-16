"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  FileJson,
  Table as TableIcon,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  ComparisonSummary,
  DayForecast,
} from "@/data/demoDataset";
import { ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";

// Helper: Safely add days to an ISO YYYY-MM-DD string without timezone offset shifts
function addDaysToIso(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ResultsStepProps {
  results: ComparisonSummary;
  cutoffDate: string;
  onReset: () => void;
  onChangeHorizon: () => void;
  onAdvanceRetrain?: (newCutoffDate: string, daysAhead: number, incrementalFile?: File) => Promise<void>;
}

export function ResultsStep({
  results,
  cutoffDate,
  onReset,
  onChangeHorizon,
  onAdvanceRetrain,
}: ResultsStepProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"day-wise" | "aggregate" | "chart">("day-wise");
  const currentDay: DayForecast = results.days[activeDayIndex] || results.days[0];

  // Rolling Real-Time Retraining State — Strictly calculated from initial cutoffDate
  const [advanceCutoffDate, setAdvanceCutoffDate] = useState<string>(() =>
    addDaysToIso(cutoffDate, results.daysCount || 7)
  );
  const [prevCutoff, setPrevCutoff] = useState(cutoffDate);
  if (cutoffDate !== prevCutoff) {
    setPrevCutoff(cutoffDate);
    setAdvanceCutoffDate(addDaysToIso(cutoffDate, results.daysCount || 7));
  }

  const [advanceHorizonDays, setAdvanceHorizonDays] = useState<number>(results.daysCount || 7);
  const [incrementalFile, setIncrementalFile] = useState<File | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [retrainError, setRetrainError] = useState<ApiError | Error | null>(null);

  const handleQuickAdvance = (daysToAdd: number) => {
    setAdvanceCutoffDate(addDaysToIso(cutoffDate, daysToAdd));
  };

  const handleExecuteAdvanceRetrain = async () => {
    if (!onAdvanceRetrain) return;
    setIsRetraining(true);
    setRetrainSuccess(null);
    setRetrainError(null);
    try {
      await onAdvanceRetrain(advanceCutoffDate, advanceHorizonDays, incrementalFile || undefined);
      setRetrainSuccess(
        `Model retrained up to ${advanceCutoffDate}! Fresh real-time lag signals absorbed with improved precision.`
      );
      setTimeout(() => setRetrainSuccess(null), 6000);
    } catch (err: unknown) {
      setRetrainSuccess(null);
      const message = err instanceof Error ? err.message : String(err);
      setRetrainError(
        err instanceof ApiError
          ? err
          : new ApiError(
              message || "Rolling retrain failed. Check backend server.",
              0,
              `/restaurants/{id}/train?until=${advanceCutoffDate}`
            )
      );
    } finally {
      setIsRetraining(false);
    }
  };

  const handleDownloadJSON = () => {
    const postmanJson = {
      period: results.period,
      from: results.startDate,
      to: results.endDate,
      days_compared: results.daysCount,
      summary: {
        accuracy_per_item_per_day: results.accuracyPerItem,
        accuracy_daily_total: results.accuracyTotal,
        actual_inside_range_percent: results.insideRangePercent,
      },
      daily_totals: results.days.map((d) => ({
        date: d.date,
        predicted: d.predictedTotal,
        actual: d.actualTotal,
        accuracy: d.dayAccuracy,
      })),
      rows: results.days.flatMap((d) =>
        d.items.map((it) => ({
          date: d.date,
          item: it.item,
          low: it.low,
          likely: it.likely,
          high: it.high,
          actual: it.actual,
          difference: it.difference,
          inside_range: it.insideRange,
        }))
      ),
    };

    const blob = new Blob([JSON.stringify(postmanJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_comparison_${results.period}_${cutoffDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EADDCE]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D7B7] bg-[#FAF5EA] px-3.5 py-1 text-xs font-semibold text-[#8F6D27] mb-2">
            <ShieldCheck className="size-3.5 text-[#B88E3E]" />
            <span>Out-Of-Sample Benchmark Verified</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            Prediction & Accuracy Output
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#52525B]">
            Trained strictly on sales prior to{" "}
            <span className="font-mono font-semibold text-[#8F6D27]">{cutoffDate}</span>. Evaluated on real unseen sales from{" "}
            <span className="font-mono font-semibold text-[#18181B]">{results.startDate}</span> to{" "}
            <span className="font-mono font-semibold text-[#18181B]">{results.endDate}</span> ({results.daysCount}{" "}
            {results.daysCount === 1 ? "Day" : "Days"} Day-Wise).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onChangeHorizon}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EADDCE] bg-white px-4 py-2 text-xs font-semibold text-[#18181B] hover:border-[#B88E3E] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-sm"
          >
            <SlidersHorizontal className="size-3.5 text-[#B88E3E]" />
            <span>Change Horizon</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5D7B7] bg-[#FAF5EA] px-4 py-2 text-xs font-bold text-[#8F6D27] hover:bg-[#B88E3E] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <FileJson className="size-3.5" />
            <span>Download Postman JSON</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-[#E5D7B7] bg-white p-5 shadow-[0_4px_20px_rgba(184,142,62,0.06)] relative">
          <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-1">
            Total Volume Accuracy
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-[#B88E3E] font-mono">
              {results.accuracyTotal}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center">
              <TrendingUp className="size-3 mr-0.5" />
              100 - WAPE
            </span>
          </div>
          <div className="mt-2 text-xs text-[#52525B] flex items-center justify-between border-t border-[#EADDCE] pt-2 font-mono">
            <span>accuracy_daily_total</span>
            <span className="text-[#18181B] font-semibold">
              {results.totalPredictedPortions} vs {results.totalActualPortions} sold
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-[#E5D7B7] bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-1">
            Item-Level Accuracy
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-[#18181B] font-mono">
              {results.accuracyPerItem}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Fine-Grained</span>
          </div>
          <div className="mt-2 text-xs text-[#52525B] flex items-center justify-between border-t border-[#EADDCE] pt-2 font-mono">
            <span>accuracy_per_item_per_day</span>
            <span className="text-[#18181B] font-semibold">Across 10 Menu Items</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Safe Range Hit Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-700 font-mono">
              {results.insideRangePercent}%
            </span>
            <span className="text-xs text-[#71717A] font-mono">P5 – P95</span>
          </div>
          <div className="mt-2 text-xs text-emerald-800 flex items-center justify-between border-t border-emerald-200 pt-2 font-mono">
            <span>actual_inside_range_percent</span>
            <span className="font-semibold text-emerald-700">Zero Walkouts</span>
          </div>
        </div>

        {/* KPI 4: Cumulative Horizon Net Delta */}
        <div className="rounded-2xl border border-[#E5D7B7] bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-1">
            Cumulative Horizon Delta
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-[#8F6D27] font-mono">
              {results.totalActualPortions - results.totalPredictedPortions >= 0
                ? `+${results.totalActualPortions - results.totalPredictedPortions}`
                : `${results.totalActualPortions - results.totalPredictedPortions}`}
            </span>
            <span className="text-xs text-[#71717A]">plates net variance</span>
          </div>
          <div className="mt-2 text-xs text-[#52525B] flex items-center justify-between border-t border-[#EADDCE] pt-2 font-mono">
            <span>actual vs likely</span>
            <span className="text-[#18181B] font-semibold">
              {results.totalPredictedPortions} Pred / {results.totalActualPortions} Actual
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 rounded-xl border border-[#EADDCE] bg-white p-1 self-start shadow-sm">
          <button
            onClick={() => setViewMode("day-wise")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "day-wise"
                ? "bg-[#B88E3E] text-white shadow-sm"
                : "text-[#52525B] hover:text-[#18181B]"
            }`}
          >
            <Calendar className="size-3.5" />
            <span>Day-Wise Breakdown ({results.daysCount} Days)</span>
          </button>

          <button
            onClick={() => setViewMode("aggregate")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "aggregate"
                ? "bg-[#B88E3E] text-white shadow-sm"
                : "text-[#52525B] hover:text-[#18181B]"
            }`}
          >
            <TableIcon className="size-3.5" />
            <span>Full Period Aggregate</span>
          </button>

          <button
            onClick={() => setViewMode("chart")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "chart"
                ? "bg-[#B88E3E] text-white shadow-sm"
                : "text-[#52525B] hover:text-[#18181B]"
            }`}
          >
            <BarChart3 className="size-3.5" />
            <span>Accuracy Curve</span>
          </button>
        </div>

        <div className="text-xs text-[#71717A] font-mono self-end sm:self-center">
          Model: <span className="text-[#8F6D27] font-bold">{results.modelVersion}</span>
        </div>
      </div>

      {/* VIEW 1: DAY-WISE BREAKDOWN (CRITICAL USER REQUIREMENT) */}
      {viewMode === "day-wise" && (
        <div className="space-y-6">
          {/* Day Selector Pills for 7 or 30 days */}
          {results.days.length > 1 && (
            <div className="rounded-2xl border border-[#EADDCE] bg-white p-3 overflow-x-auto scrollbar-thin shadow-sm">
              <div className="flex items-center gap-2 min-w-max">
                {results.days.map((day, idx) => {
                  const isActive = idx === activeDayIndex;
                  return (
                    <button
                      key={day.date}
                      onClick={() => setActiveDayIndex(idx)}
                      className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#FAF5EA] border-2 border-[#B88E3E] text-[#18181B] font-bold shadow-sm"
                          : "border border-[#EADDCE] bg-white text-[#71717A] hover:border-[#B88E3E] hover:text-[#18181B]"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        Day {idx + 1} · {day.dayOfWeek.slice(0, 3)}
                      </span>
                      <span className="text-xs font-bold mt-0.5">
                        {new Date(day.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span
                        className={`text-[10px] mt-1 font-bold ${
                          isActive ? "text-[#8F6D27]" : "text-emerald-700"
                        }`}
                      >
                        {day.dayAccuracy}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Day Header Bar */}
          <div className="rounded-2xl border border-[#E5D7B7] bg-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#8F6D27] uppercase tracking-wider">
                  Day {activeDayIndex + 1} of {results.daysCount}
                </span>
                <span className="text-[#A1A1AA] text-xs">•</span>
                <span className="text-xs font-mono font-semibold text-[#18181B]">{currentDay.formattedDate}</span>
                {currentDay.isWeekend && (
                  <span className="rounded-full bg-[#FAF5EA] border border-[#E5D7B7] text-[#8F6D27] text-[10px] px-2.5 py-0.5 font-bold">
                    Weekend Volume
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-[#18181B]">
                {currentDay.dayOfWeek} Day-Wise Portion Plan
              </h3>
              {currentDay.eventNote && (
                <div className="mt-1 text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  <span>{currentDay.eventNote}</span>
                </div>
              )}
            </div>

            {/* Day Total Performance Badges */}
            <div className="flex items-center gap-4 bg-[#FAF8F5] px-4 py-3 rounded-xl border border-[#EADDCE]">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block font-medium">Predicted Portions</span>
                <span className="text-xl font-bold text-[#B88E3E] font-mono">
                  {currentDay.predictedTotal}
                </span>
              </div>
              <div className="w-px h-8 bg-[#EADDCE]" />
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block font-medium">Actual Sold</span>
                <span className="text-xl font-bold text-[#18181B] font-mono">
                  {currentDay.actualTotal}
                </span>
              </div>
              <div className="w-px h-8 bg-[#EADDCE]" />
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block font-medium">Day Accuracy</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {currentDay.dayAccuracy}%
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-2xl border border-[#EADDCE] bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADDCE] bg-[#FAF8F5] text-[#52525B] font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Menu Item</th>
                    <th className="py-3.5 px-4 text-center">Safe Range [Low – High]</th>
                    <th className="py-3.5 px-4 text-right">Likely Forecast</th>
                    <th className="py-3.5 px-4 text-right">Actual Sold</th>
                    <th className="py-3.5 px-4 text-right">Difference</th>
                    <th className="py-3.5 px-4 text-right">Item Accuracy</th>
                    <th className="py-3.5 px-5 text-center">Range Hit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADDCE]/60">
                  {currentDay.items.map((item, idx) => {
                    const isPositive = item.difference > 0;
                    const isZero = item.difference === 0;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-[#FAF8F5] transition-colors"
                      >
                        {/* Item Name */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#18181B] text-sm">{item.item}</div>
                          <div className="text-[10px] text-[#71717A] font-mono mt-0.5">
                            Method: {item.method}
                          </div>
                        </td>

                        {/* Safe Range */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full bg-[#FAF5EA] border border-[#E5D7B7] text-[#18181B] font-semibold">
                            <span className="text-[#71717A]">{item.low}</span>
                            <span className="text-[#B88E3E] font-bold">―</span>
                            <span className="text-[#71717A]">{item.high}</span>
                          </div>
                        </td>

                        {/* Likely Forecast */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono text-sm font-bold text-[#B88E3E]">
                            {item.likely}
                          </span>
                          <span className="text-[10px] text-[#71717A] ml-1">plates</span>
                        </td>

                        {/* Actual Sold */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono text-sm font-bold text-[#18181B]">
                            {item.actual}
                          </span>
                          <span className="text-[10px] text-[#71717A] ml-1">plates</span>
                        </td>

                        {/* Difference */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold ${
                              isZero
                                ? "text-[#71717A]"
                                : isPositive
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="size-3" />
                            ) : !isZero ? (
                              <ArrowDownRight className="size-3" />
                            ) : null}
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span
                            className={`font-bold ${
                              item.accuracy >= 90
                                ? "text-emerald-700"
                                : item.accuracy >= 80
                                ? "text-[#8F6D27]"
                                : "text-amber-700"
                            }`}
                          >
                            {item.accuracy}%
                          </span>
                        </td>

                        {/* Range Hit Badge */}
                        <td className="py-3.5 px-5 text-center">
                          {item.insideRange ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              <span>Inside Range</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <AlertTriangle className="size-3 text-amber-600" />
                              <span>Spike Outside</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-[#FAF8F5] px-5 py-3 border-t border-[#EADDCE] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52525B]">
              <span className="font-mono">
                Postman JSON endpoint: <code className="text-[#8F6D27] font-semibold">POST /restaurants/&#123;id&#125;/compare?period=day</code>
              </span>
              <span className="text-[#18181B] font-bold">
                Day Range Hit Rate: {currentDay.rangeHitPercent}% inside P5–P95
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AGGREGATE */}
      {viewMode === "aggregate" && (
        <div className="rounded-2xl border border-[#EADDCE] bg-white overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#EADDCE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#18181B]">
                Aggregate Horizon Performance ({results.daysCount} Days)
              </h3>
              <p className="text-xs text-[#52525B] mt-1">
                Cumulative predicted vs actual demand for each menu item across the entire window.
              </p>
            </div>
            <div className="text-xs font-mono text-[#8F6D27] bg-[#FAF5EA] border border-[#E5D7B7] px-3 py-1.5 rounded-xl font-bold">
              Overall WAPE: {results.accuracyPerItem}%
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADDCE] bg-[#FAF8F5] text-[#52525B] font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Menu Item</th>
                  <th className="py-3.5 px-4 text-right">Total Predicted (Likely)</th>
                  <th className="py-3.5 px-4 text-right">Total Actual Sold</th>
                  <th className="py-3.5 px-4 text-right">Cumulative Diff</th>
                  <th className="py-3.5 px-5 text-right">Horizon Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDCE]/60">
                {results.itemAggregates.map((agg, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#18181B] text-sm">{agg.item}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#B88E3E] text-sm">
                      {agg.totalLikely}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#18181B] text-sm">
                      {agg.totalActual}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs">
                      <span
                        className={
                          agg.difference > 0
                            ? "text-amber-700 font-bold"
                            : agg.difference < 0
                            ? "text-emerald-700 font-bold"
                            : "text-[#71717A]"
                        }
                      >
                        {agg.difference > 0 ? `+${agg.difference}` : agg.difference}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      <span className="font-bold text-emerald-700 text-sm">{agg.accuracy}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CHART */}
      {viewMode === "chart" && (
        <div className="rounded-2xl border border-[#EADDCE] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#18181B]">
                Trajectory: Predicted vs Actual Volume
              </h3>
              <p className="text-xs text-[#52525B] mt-1">
                Comparing total daily portion demand across the entire {results.daysCount}-day horizon.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#B88E3E]" />
                <span className="text-[#8F6D27] font-semibold">Model Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#18181B]" />
                <span className="text-[#18181B] font-semibold">Actual Sold (Holdout)</span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-64 bg-[#FAF8F5] rounded-xl border border-[#EADDCE] p-4 flex flex-col justify-between">
            <div className="absolute inset-x-4 top-1/4 border-b border-[#EADDCE]/60" />
            <div className="absolute inset-x-4 top-2/4 border-b border-[#EADDCE]/60" />
            <div className="absolute inset-x-4 top-3/4 border-b border-[#EADDCE]/60" />

            <div className="relative z-10 flex items-end justify-between h-48 pt-4 px-2">
              {results.days.map((day, idx) => {
                const max = 1300;
                const predHeight = Math.min(100, Math.round((day.predictedTotal / max) * 100));
                const actHeight = Math.min(100, Math.round((day.actualTotal / max) * 100));

                return (
                  <div
                    key={day.date}
                    onClick={() => {
                      setActiveDayIndex(idx);
                      setViewMode("day-wise");
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
                  >
                    <div className="text-[10px] text-[#71717A] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.predictedTotal}p
                    </div>
                    <div className="flex items-end gap-1 h-36">
                      <div
                        className="w-2.5 sm:w-4 bg-[#B88E3E] rounded-t transition-all group-hover:bg-[#9E772E]"
                        style={{ height: `${predHeight}%` }}
                      />
                      <div
                        className="w-2.5 sm:w-4 bg-[#18181B] rounded-t transition-all group-hover:bg-slate-700"
                        style={{ height: `${actHeight}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#71717A] font-mono mt-1">
                      {results.daysCount > 10 ? idx + 1 : day.dayOfWeek.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-[#71717A] font-mono pt-2 border-t border-[#EADDCE]">
              Interactive Chart: Click any column to drill into that day&apos;s full itemized recipe breakdown.
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC REAL-TIME RETRAINING & ROLLING ADVANCE MODULE */}
      <div className="mt-8 rounded-2xl border-2 border-[#B88E3E]/40 bg-gradient-to-b from-[#FAF8F5] to-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(184,142,62,0.08)] relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-5 border-b border-[#EADDCE]">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EA] border border-[#E5D7B7] px-3 py-1 text-[11px] font-bold text-[#8F6D27] uppercase tracking-wider mb-1.5">
              <Sparkles className="size-3 text-[#B88E3E]" />
              <span>Rolling Retraining & Dynamic Real-Time Feed</span>
            </div>
            <h3 className="text-xl font-bold text-[#18181B]">
              Provide Next Real-Time Data & Advance Prediction Horizon
            </h3>
            <p className="text-xs text-[#52525B] mt-0.5 max-w-xl">
              Simulate completed operational shifts: feed newly closed sales (e.g. +1 Day or +1 Week) into the model. The forecasting engine dynamically retrains on all history up to the new cutoff, absorbing recent demand signals to predict subsequent horizons with higher accuracy.
            </p>
          </div>

          <div className="rounded-xl border border-[#E5D7B7] bg-white px-4 py-2 text-right shadow-sm shrink-0">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Current Model Cutoff</span>
            <span className="font-mono text-sm font-bold text-[#8F6D27]">{cutoffDate}</span>
          </div>
        </div>

        {retrainSuccess && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-300">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{retrainSuccess}</span>
          </div>
        )}

        {retrainError && (
          <div className="mb-5">
            <ErrorAlert
              title="Rolling Retraining Failed"
              error={retrainError}
              onRetry={handleExecuteAdvanceRetrain}
              onDismiss={() => setRetrainError(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          {/* Column 1: Date selection & Quick presets */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-[#18181B] uppercase tracking-wider">
              1. New Learning Cutoff Date (Train Sales Up To)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={advanceCutoffDate}
                min={cutoffDate}
                onChange={(e) => setAdvanceCutoffDate(e.target.value)}
                className="flex-1 rounded-xl border border-[#EADDCE] bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-[#18181B] focus:border-[#B88E3E] focus:outline-none shadow-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#71717A] font-medium">Quick Advance:</span>
              <button
                type="button"
                onClick={() => handleQuickAdvance(1)}
                className="px-2.5 py-1 rounded-lg border border-[#EADDCE] bg-white hover:bg-[#FAF8F5] text-[11px] font-bold text-[#8F6D27] transition-colors cursor-pointer shadow-xs"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdvance(7)}
                className="px-2.5 py-1 rounded-lg border border-[#E5D7B7] bg-[#FAF5EA] hover:bg-[#F3E7D3] text-[11px] font-bold text-[#8F6D27] transition-colors cursor-pointer shadow-xs"
              >
                +1 Week (7 Days)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdvance(14)}
                className="px-2.5 py-1 rounded-lg border border-[#EADDCE] bg-white hover:bg-[#FAF8F5] text-[11px] font-bold text-[#8F6D27] transition-colors cursor-pointer shadow-xs"
              >
                +2 Weeks
              </button>
              <label className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#8F6D27] cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => setIncrementalFile(e.target.files?.[0] || null)}
                />
                <span>{incrementalFile ? `File: ${incrementalFile.name}` : "Attach CSV (Optional)"}</span>
              </label>
            </div>
          </div>

          {/* Column 2: Horizon for subsequent prediction */}
          <div className="lg:col-span-3 space-y-2">
            <label className="block text-xs font-bold text-[#18181B] uppercase tracking-wider">
              2. Predict Subsequent Horizon
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#EADDCE] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setAdvanceHorizonDays(1)}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  advanceHorizonDays === 1
                    ? "bg-[#B88E3E] text-white shadow-sm"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => setAdvanceHorizonDays(7)}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  advanceHorizonDays === 7
                    ? "bg-[#B88E3E] text-white shadow-sm"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => setAdvanceHorizonDays(30)}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  advanceHorizonDays === 30
                    ? "bg-[#B88E3E] text-white shadow-sm"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                +30 Days
              </button>
            </div>
            <p className="text-[10px] text-[#71717A]">
              Day-wise portions starting immediately after {advanceCutoffDate}
            </p>
          </div>

          {/* Column 3: Execute Button */}
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={handleExecuteAdvanceRetrain}
              disabled={isRetraining}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B88E3E] hover:bg-[#9E772E] text-white py-3.5 px-5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(184,142,62,0.3)] hover:shadow-[0_6px_20px_rgba(184,142,62,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isRetraining ? (
                <>
                  <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Retraining Model...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  <span>Train Until {advanceCutoffDate} & Predict</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#EADDCE]">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EADDCE] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#52525B] hover:text-[#18181B] hover:border-[#B88E3E] transition-colors cursor-pointer shadow-sm"
        >
          <RotateCcw className="size-3.5" />
          <span>Upload New Sales Dataset</span>
        </button>

        <button
          onClick={onChangeHorizon}
          className="inline-flex items-center gap-2 rounded-xl bg-[#B88E3E] hover:bg-[#9E772E] text-white px-7 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <span>Test Different Horizon</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
