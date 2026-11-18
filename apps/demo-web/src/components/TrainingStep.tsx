"use client";

import React, { useState } from "react";
import {
  Calendar,
  Cpu,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import { trainApi, ApiError, TrainApiResponse } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";
import { addDaysToIso } from "@/lib/utils";
import {
  describeCutoffProblem,
  earliestTrainingCutoff,
  latestTrainingCutoff,
  splitTrainingAndHoldoutDays,
} from "@/lib/trainingCutoff";
import { DatasetInfo } from "@/components/UploadStep";

interface TrainingStepProps {
  datasetInfo: DatasetInfo;
  onTrainingComplete: (cutoffDate: string) => void;
  initialCutoff?: string;
}

const DEFAULT_PRESETS = [
  {
    date: "2026-11-06",
    label: "Current Benchmark (Postman Demo)",
    note: "Trains through 06 Nov 2026 · Validates on subsequent days",
  },
  {
    date: "2026-06-18",
    label: "Mid-Year Validation (19–25 June Test)",
    note: "Matches Postman 'Predict 19-25 June' flow",
  },
  {
    date: "2026-03-31",
    label: "Festive Season Benchmark",
    note: "Tests seasonal Haleem & banquet surge cycles",
  },
];

export function TrainingStep({
  datasetInfo,
  onTrainingComplete,
  initialCutoff = "2026-11-06",
}: TrainingStepProps) {
  const { upload } = datasetInfo; // the upload API response, shown as returned
  const startDate = upload.from;
  const endDate = upload.to;
  const isDefaultBenchmark = startDate === "2025-11-15";
  const earliestCutoff = earliestTrainingCutoff(startDate);
  const latestCutoff = latestTrainingCutoff(endDate);

  const activePresets = React.useMemo(() => {
    const daysOfData = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000);
    if (isDefaultBenchmark || daysOfData < 20) {
      return DEFAULT_PRESETS;
    }
    const oneMonthBack = addDaysToIso(endDate, -30);
    const twoWeeksBack = addDaysToIso(endDate, -14);
    const oneWeekBack = addDaysToIso(endDate, -7);
    return [
      {
        date: oneMonthBack,
        label: "1-Month Holdout Verification",
        note: `Trains through ${oneMonthBack} · Validates full final month`,
      },
      {
        date: twoWeeksBack,
        label: "Mid-Period Validation (14-Day Test)",
        note: `Trains through ${twoWeeksBack} · Validates on subsequent 14 days`,
      },
      {
        date: oneWeekBack,
        label: "Final Week Horizon Benchmark",
        note: `Trains through ${oneWeekBack} · Evaluates on the final 7 days`,
      },
    ].filter((preset) => preset.date >= earliestCutoff);
  }, [startDate, endDate, isDefaultBenchmark, earliestCutoff]);

  const firstCutoffToShow = React.useMemo(() => {
    const isOutsideData = initialCutoff > endDate || initialCutoff < earliestCutoff;
    return isOutsideData ? activePresets[0]?.date || earliestCutoff : initialCutoff;
  }, [endDate, initialCutoff, activePresets, earliestCutoff]);

  const [cutoffDate, setCutoffDate] = useState<string>(() => firstCutoffToShow);
  const { trainingDays, holdoutDays, trainingPercent } = splitTrainingAndHoldoutDays(startDate, endDate, cutoffDate);
  const cutoffProblem = describeCutoffProblem(cutoffDate, startDate, endDate);

  const [isTraining, setIsTraining] = useState(false);
  const [trainingStage, setTrainingStage] = useState(0);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [trainedModel, setTrainedModel] = useState<TrainApiResponse | null>(null);
  const [trainingError, setTrainingError] = useState<ApiError | Error | null>(null);

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingComplete(false);
    setTrainingError(null);
    setTrainedModel(null);
    setTrainingStage(1);

    // Progress animation timers
    const timer1 = setTimeout(() => setTrainingStage(2), 2500);
    const timer2 = setTimeout(() => setTrainingStage(3), 6000);
    const timer3 = setTimeout(() => setTrainingStage(4), 12000);

    try {
      // STRICT REQUIREMENT: Only mark as trained when API returns 200 OK
      const res = await trainApi(cutoffDate, datasetInfo.restaurantId);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setTrainedModel(res);
      setTrainingComplete(true);
      setTrainingError(null);
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const message = err instanceof Error ? err.message : String(err);
      // NEVER show success or activated model on failure
      setTrainingComplete(false);
      setTrainedModel(null);
      setTrainingError(
        err instanceof ApiError
          ? err
          : new ApiError(
              message || "Model training failed. Please verify the FastAPI backend status.",
              0,
              `/restaurants/{id}/train?until=${cutoffDate}`
            )
      );
    } finally {
      setIsTraining(false);
      setTrainingStage(0);
    }
  };

  const handleProceed = () => {
    if (!trainingComplete || !trainedModel) return;

    onTrainingComplete(cutoffDate);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D7B7] bg-[#FAF5EA] px-3.5 py-1 text-xs font-semibold text-[#8F6D27] mb-3">
          <Calendar className="size-3.5 text-[#B88E3E]" />
          <span>STEP 2 · TEMPORAL CUTOFF & TRAINING</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18181B]">
          Till Which Date Do You Want to Train?
        </h2>
        <p className="mt-2 text-sm text-[#52525B] max-w-xl mx-auto">
          Specify the training cutoff. All sales records up to this date will train the forecasting models.
          Everything after remains strictly unseen to verify authentic out-of-sample accuracy.
        </p>
      </div>

      {/* Dataset Context Bar */}
      <div className="mb-6 rounded-2xl border border-[#E5D7B7] bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-[#71717A] block text-xs uppercase tracking-wider font-medium">Active Kitchen Facility</span>
            <span className="font-semibold text-[#18181B] text-base">{datasetInfo.restaurantName}</span>
          </div>
          <div>
            <span className="text-[#71717A] block text-xs font-medium">Historical Range</span>
            <span className="text-[#18181B] font-mono">{startDate} → {endDate}</span>
          </div>
        </div>

        {/* POST /sales/upload response, field for field */}
        <div className="mt-4 pt-4 border-t border-[#EADDCE] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {(
            [
              ["Rows added", upload.added],
              ["Rows replaced", upload.replaced],
              ["Rows stored", upload.total_rows],
              ["Days with sales", upload.days],
              ["Menu items", upload.items],
              ["Categories", upload.categories],
              ["Portions sold", upload.total_qty],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <span className="text-[#71717A] block font-medium">{label}</span>
              <span className="text-[#18181B] font-mono font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Date Selection Card */}
      <div className="rounded-2xl border border-[#E5D7B7] bg-white p-6 sm:p-8 mb-6 shadow-[0_4px_24px_rgba(184,142,62,0.06)] relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3">
          Select Training Cutoff Date
        </label>

        {/* Quick Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {activePresets.map((p) => {
            const isSelected = cutoffDate === p.date;
            return (
              <button
                key={p.date}
                type="button"
                onClick={() => {
                  setCutoffDate(p.date);
                  setTrainingComplete(false);
                  setTrainedModel(null);
                  setTrainingError(null);
                }}
                disabled={isTraining}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-2 border-[#B88E3E] bg-[#FAF5EA] shadow-sm"
                    : "border-[#EADDCE] bg-white hover:border-[#B88E3E]/60 hover:bg-[#FAF8F5]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm text-[#18181B]">{p.date}</span>
                  {isSelected && (
                    <span className="size-2 rounded-full bg-[#B88E3E]" />
                  )}
                </div>
                <div className="text-xs font-semibold text-[#8F6D27] mb-1">{p.label}</div>
                <div className="text-[11px] text-[#71717A] leading-tight">{p.note}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Date Input */}
        <div className="p-4 rounded-xl border border-[#EADDCE] bg-[#FAF8F5] mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="custom-cutoff" className="block text-xs font-bold text-[#18181B] mb-0.5">
                Custom Cutoff Date (YYYY-MM-DD)
              </label>
              <p className="text-[11px] text-[#71717A]">
                Train strictly on sales prior to this calendar date.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="custom-cutoff"
                type="date"
                value={cutoffDate}
                min={earliestCutoff}
                max={latestCutoff}
                aria-invalid={cutoffProblem !== null}
                aria-describedby="cutoff-problem"
                onChange={(e) => {
                  setCutoffDate(e.target.value);
                  setTrainingComplete(false);
                  setTrainedModel(null);
                  setTrainingError(null);
                }}
                disabled={isTraining}
                className="rounded-lg border border-[#EADDCE] bg-white px-3 py-2 text-xs font-mono font-bold text-[#18181B] focus:border-[#B88E3E] focus:outline-none shadow-sm cursor-pointer"
              />
            </div>
          </div>
          {cutoffProblem && (
            <p id="cutoff-problem" role="alert" className="mt-3 text-xs font-semibold text-amber-800">
              {cutoffProblem}
            </p>
          )}
        </div>

        {/* Split Visualization */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-mono">
            <span className="text-[#8F6D27] font-semibold">
              Training Portion: {startDate} to {cutoffDate} ({trainingDays} days)
            </span>
            <span className="text-emerald-800 font-semibold text-right">
              {holdoutDays > 0
                ? `Holdout Verification: ${addDaysToIso(cutoffDate, 1)} to ${endDate} (${holdoutDays} days)`
                : "Holdout Verification: none (cutoff is the last sales day)"}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#FAF5EA] border border-[#EADDCE] overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-[#B88E3E] to-[#9E772E] transition-all"
              style={{ width: `${trainingPercent}%` }}
            />
            <div className="h-full bg-emerald-500 flex-1" />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
            <Lock className="size-3 text-[#B88E3E]" />
            <span>
              Zero data leakage guarantee: Prediction models will have no access to future sales records, ensuring authentic out-of-sample prediction.
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert Display */}
      {trainingError && (
        <div className="mb-6">
          <ErrorAlert
            title="Model Training Failed"
            error={trainingError}
            onRetry={handleTrain}
            onDismiss={() => setTrainingError(null)}
          />
        </div>
      )}

      {/* Live Training Execution Progress */}
      {isTraining && (
        <div className="mb-6 rounded-2xl border border-[#E5D7B7] bg-[#FAF8F5] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-8 rounded-lg bg-[#FAF5EA] border border-[#E5D7B7] flex items-center justify-center text-[#B88E3E]">
              <Cpu className="size-4 animate-spin" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18181B]">
                Training Forecasting Model & Quantiles Online...
              </div>
              <div className="text-xs text-[#71717A] font-mono">
                Cutoff enforced: {cutoffDate} · Calling POST /restaurants/&#123;id&#125;/train
              </div>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className={`flex items-center gap-2.5 transition-opacity ${trainingStage >= 1 ? "opacity-100 text-[#18181B]" : "opacity-40 text-[#71717A]"}`}>
              {trainingStage > 1 ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <div className="size-4 rounded-full border-2 border-[#B88E3E] border-t-transparent animate-spin shrink-0" />
              )}
              <span>[1/4] Calculating zero-leakage multi-horizon lag features (1d, 7d, 28d, rolling means)</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-opacity ${trainingStage >= 2 ? "opacity-100 text-[#18181B]" : "opacity-40 text-[#71717A]"}`}>
              {trainingStage > 2 ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : trainingStage === 2 ? (
                <div className="size-4 rounded-full border-2 border-[#B88E3E] border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="size-4 rounded-full border border-[#EADDCE] shrink-0" />
              )}
              <span>[2/4] Fitting Primary Regressor for compound dish count distributions</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-opacity ${trainingStage >= 3 ? "opacity-100 text-[#18181B]" : "opacity-40 text-[#71717A]"}`}>
              {trainingStage > 3 ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : trainingStage === 3 ? (
                <div className="size-4 rounded-full border-2 border-[#B88E3E] border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="size-4 rounded-full border border-[#EADDCE] shrink-0" />
              )}
              <span>[3/4] Fitting Pinball Loss Quantiles (P5 Safe Lower Bound & P95 Safe Upper Bound)</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-opacity ${trainingStage >= 4 ? "opacity-100 text-[#18181B]" : "opacity-40 text-[#71717A]"}`}>
              {trainingStage === 4 ? (
                <div className="size-4 rounded-full border-2 border-[#B88E3E] border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="size-4 rounded-full border border-[#EADDCE] shrink-0" />
              )}
              <span>[4/4] Cross-validating against SameWeekdayAverage baseline model</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Ready Report: STRICTLY DISPLAYED ONLY ON VERIFIED HTTP 200 OK */}
      {trainingComplete && trainedModel && !isTraining && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADDCE]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Model Ready & Activated (HTTP 200)
                </div>
                <h4 className="text-xl font-bold text-[#18181B]">
                  Forecasting Model & Quantiles Online
                </h4>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5D7B7] bg-[#FAF5EA] px-4 py-2 text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] block font-medium">Model Version</span>
              <span className="font-mono text-xs sm:text-sm text-[#8F6D27] font-bold">
                {trainedModel.version}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
            <div className="p-3 rounded-xl border border-[#EADDCE] bg-[#FAF8F5]">
              <span className="text-[11px] text-[#71717A] block mb-0.5 font-medium">Cutoff Enforced</span>
              <span className="font-mono text-sm font-bold text-[#18181B]">{cutoffDate}</span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADDCE] bg-[#FAF8F5]">
              <span className="text-[11px] text-[#71717A] block mb-0.5 font-medium">Status</span>
              <span
                className={`font-mono text-sm font-bold ${trainedModel.activated ? "text-emerald-700" : "text-amber-700"}`}
              >
                {trainedModel.activated ? "Activated Live" : "Not Activated"}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADDCE] bg-[#FAF8F5]">
              <span className="text-[11px] text-[#71717A] block mb-0.5 font-medium">Evaluation Decision</span>
              <span className="font-mono text-xs font-bold text-[#8F6D27] line-clamp-2" title={trainedModel.reason}>
                {trainedModel.reason}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADDCE] bg-[#FAF8F5]">
              <span className="text-[11px] text-[#71717A] block mb-0.5 font-medium">Out-of-Sample Accuracy (100 − WAPE)</span>
              <span className="font-mono text-sm font-bold text-emerald-700">
                {trainedModel.accuracy?.["1"]?.methods?.lightgbm?.item_day_accuracy != null
                  ? `${trainedModel.accuracy["1"].methods.lightgbm.item_day_accuracy}% Accuracy`
                  : trainedModel.accuracy?.["7"]?.methods?.lightgbm?.item_day_accuracy != null
                  ? `${trainedModel.accuracy["7"].methods.lightgbm.item_day_accuracy}% Accuracy`
                  : "Validated on Unseen Days"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#52525B]">
              <Info className="size-4 text-[#B88E3E] shrink-0" />
              <span>Training verified on backend. You can now forecast the Next Day or Next Week.</span>
            </div>
            <button
              onClick={handleProceed}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B88E3E] hover:bg-[#9E772E] text-white px-7 py-3.5 font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              <span>Choose Prediction Horizon</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Train CTA */}
      {!trainingComplete && !isTraining && (
        <div className="flex justify-center">
          <button
            onClick={handleTrain}
            disabled={cutoffProblem !== null}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-[#B88E3E] hover:bg-[#9E772E] text-white px-8 py-4 font-bold text-base transition-all shadow-[0_4px_16px_rgba(184,142,62,0.3)] hover:shadow-[0_6px_22px_rgba(184,142,62,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#B88E3E]"
          >
            <Zap className="size-5" />
            <span>Train Model on Sales up to {cutoffDate}</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
