"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/Stepper";
import { UploadStep, DatasetInfo } from "@/components/UploadStep";
import { TrainingStep } from "@/components/TrainingStep";
import { HorizonStep } from "@/components/HorizonStep";
import { ResultsStep } from "@/components/ResultsStep";
import { ComparisonSummary } from "@/data/demoDataset";
import {
  checkApiHealth,
  forecastApi,
  compareApi,
  dynamicRetrainAndForecastApi,
  buildComparisonSummary,
  ApiHealthStatus,
} from "@/lib/api";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({ online: false });

  // Ingested dataset metadata
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);

  // Training parameters
  const [cutoffDate, setCutoffDate] = useState<string>("2026-11-06");

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

  // the model version shown with results comes from the /forecast response, not from training
  const handleTrainingComplete = (selectedCutoff: string) => {
    setCutoffDate(selectedCutoff);
    setCurrentStep(3);
  };

  const handleSelectHorizon = async (daysAhead: number) => {
    // 1. Generate live forecast from FastAPI backend
    const forecastRes = await forecastApi(daysAhead, cutoffDate, datasetInfo!.restaurantId);

    // 2. Compare with real holdout sales (always query 'day' to retrieve full daily totals & dish rows)
    const compareRes = await compareApi("day", datasetInfo!.restaurantId);

    // 3. Map the response as-is; model_version is the one that actually produced this forecast
    const liveSummary = buildComparisonSummary(compareRes, forecastRes.model_version);
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
      datasetInfo!.restaurantId,
      incrementalFile
    );
    setResults(liveResult);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setDatasetInfo(null);
    setCutoffDate("2026-11-06");
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