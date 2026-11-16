"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/Stepper";
import { UploadStep, SampleRow } from "@/components/UploadStep";
import { TrainingStep } from "@/components/TrainingStep";
import { HorizonStep } from "@/components/HorizonStep";
import { ResultsStep } from "@/components/ResultsStep";
import { ComparisonSummary } from "@/data/demoDataset";
import {
  checkApiHealth,
  forecastApi,
  compareApi,
  dynamicRetrainAndForecastApi,
  transformFastApiResponseToSummary,
  ApiHealthStatus,
  DEFAULT_RESTAURANT_ID,
} from "@/lib/api";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({ online: false });

  // Ingested dataset metadata
  const [datasetInfo, setDatasetInfo] = useState<{
    restaurantName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    itemsCount: number;
    totalPortions: number;
    sampleRows: SampleRow[];
  } | null>(null);

  // Training parameters
  const [cutoffDate, setCutoffDate] = useState<string>("2026-11-06");
  const [modelInfo, setModelInfo] = useState<{
    version: string;
    trainingRows: number;
    holdoutDays: number;
    baselineAdvantage: string;
  } | null>(null);

  // Horizon & Simulation output
  const [results, setResults] = useState<ComparisonSummary | null>(null);

  // FastAPI health probe on mount and step change (no continuous polling)
  useEffect(() => {
    checkApiHealth()
      .then(setApiHealth)
      .catch(() => setApiHealth({ online: false }));
  }, [currentStep]);

  // Handlers
  const handleDatasetLoaded = (data: typeof datasetInfo) => {
    setDatasetInfo(data);
    setCurrentStep(2);
  };

  const handleTrainingComplete = (
    selectedCutoff: string,
    info: {
      version: string;
      trainingRows: number;
      holdoutDays: number;
      baselineAdvantage: string;
    }
  ) => {
    setCutoffDate(selectedCutoff);
    setModelInfo(info);
    setCurrentStep(3);
  };

  const handleSelectHorizon = async (daysAhead: number) => {
    // 1. Generate live forecast from FastAPI backend
    await forecastApi(daysAhead, cutoffDate, DEFAULT_RESTAURANT_ID);

    // 2. Compare with real holdout sales (always query 'day' to retrieve full daily totals & dish rows)
    const compareRes = await compareApi("day", DEFAULT_RESTAURANT_ID);

    // 3. Transform verified 200 response to domain summary
    const liveSummary = transformFastApiResponseToSummary(
      compareRes,
      modelInfo?.version || "MODEL-LIVE-FASTAPI"
    );
    setResults(liveSummary);
    setCurrentStep(4);
  };

  const handleAdvanceRetrain = async (
    newCutoffDate: string,
    daysAhead: number = 7,
    incrementalFile?: File
  ) => {
    setCutoffDate(newCutoffDate);
    const liveResult = await dynamicRetrainAndForecastApi(
      newCutoffDate,
      daysAhead,
      DEFAULT_RESTAURANT_ID,
      incrementalFile
    );
    setResults(liveResult);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setDatasetInfo(null);
    setCutoffDate("2026-11-06");
    setModelInfo(null);
    setResults(null);
  };

  const handleChangeHorizon = () => {
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] flex flex-col font-sans selection:bg-[#FAF5EA] selection:text-[#8F6D27]">
      {/* Top Professional Header with Live API Indicator */}
      <Header onReset={handleReset} apiHealth={apiHealth} />

      {/* 4-Step Interactive Progress Tracker */}
      <Stepper
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Step Content Router */}
      <main className="flex-1 pb-24">
        {currentStep === 1 && (
          <UploadStep onDatasetLoaded={handleDatasetLoaded} />
        )}

        {currentStep === 2 && datasetInfo && (
          <TrainingStep
            datasetInfo={datasetInfo}
            initialCutoff={cutoffDate}
            onTrainingComplete={handleTrainingComplete}
          />
        )}

        {currentStep === 3 && (
          <HorizonStep
            cutoffDate={cutoffDate}
            onSelectHorizon={handleSelectHorizon}
          />
        )}

        {currentStep === 4 && results && (
          <ResultsStep
            results={results}
            cutoffDate={cutoffDate}
            onReset={handleReset}
            onChangeHorizon={handleChangeHorizon}
            onAdvanceRetrain={handleAdvanceRetrain}
          />
        )}
      </main>

      {/* Global White & Gold Shaded Footer */}
      <footer className="border-t border-[#EADDCE] bg-white py-6 text-center text-xs text-[#71717A]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#18181B]">Logeeca Foresight</span>
            <span className="text-[#D4D4D8]">•</span>
            <span>Client Evaluation Console</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-[#52525B]">
            <span>FastAPI Port :8000</span>
            <span className="text-[#D4D4D8]">•</span>
            <span>Predictive Model Engine</span>
            <span className="text-[#D4D4D8]">•</span>
            <span>Quantile Operational AI</span>
          </div>

          <div className="text-[11px] text-[#8F6D27] font-medium bg-[#FAF5EA] px-3 py-1 rounded-full border border-[#E5D7B7]">
            Zero-Leakage Temporal Gates Enforced
          </div>
        </div>
      </footer>
    </div>
  );
}