"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Database,
  ArrowRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { uploadSalesApi, ApiError, createDemoRestaurantId, SalesUploadResponse } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";

/** One uploaded dataset. Every number comes from the upload API; the file is never parsed in the browser. */
export interface DatasetInfo {
  restaurantId: string;
  restaurantName: string; // display label only
  upload: SalesUploadResponse; // POST /sales/upload response, as returned
}

interface UploadStepProps {
  onDatasetLoaded: (data: DatasetInfo) => void;
}

export function UploadStep({ onDatasetLoaded }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  /**
   * Uploads a sales file into a fresh restaurant (the API validates it) and moves on only after a 200 response,
   * carrying the API's own summary of the stored sales. `getFile` runs inside the same error handling.
   */
  const uploadAsNewDataset = async (
    fileName: string,
    getFile: () => Promise<File>,
    restaurantName: string,
    failureMessage: string
  ) => {
    setIsLoading(true);
    setError(null);
    setSelectedFileName(fileName);

    try {
      const restaurantId = createDemoRestaurantId();
      const upload = await uploadSalesApi(await getFile(), restaurantId);
      onDatasetLoaded({ restaurantId, restaurantName, upload });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(message || failureMessage, 0, "/restaurants/{id}/sales/upload")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBenchmarkFile = async () => {
    const response = await fetch("/benchmark_sales_1year.csv");
    if (!response.ok) {
      throw new Error("Unable to retrieve benchmark sample file from server.");
    }
    return new File([await response.text()], "benchmark_sales_1year.csv", { type: "text/csv" });
  };

  const handleLoadBenchmark = () =>
    uploadAsNewDataset(
      "benchmark_sales_1year.csv",
      fetchBenchmarkFile,
      "Commercial Kitchen Benchmark Line",
      "Failed to load benchmark dataset to FastAPI backend."
    );

  const processUploadedFile = (file: File) =>
    uploadAsNewDataset(
      file.name,
      async () => file,
      `Uploaded POS Export (${file.name})`,
      "File ingestion failed. Check CSV format and backend connection."
    );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D7B7] bg-[#FAF5EA] px-3.5 py-1 text-xs font-semibold text-[#8F6D27] mb-3">
          <Database className="size-3.5 text-[#B88E3E]" />
          <span>STEP 1 · DATA INGESTION</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18181B]">
          Upload Real-Time POS Sales Data
        </h2>
        <p className="mt-2 text-sm text-[#52525B] max-w-xl mx-auto">
          Upload commercial dining and delivery records (.csv or .json) with date, dish name, and portion counts.
          The engine cleans censored demand and prepares multi-horizon features.
        </p>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="mb-6">
          <ErrorAlert
            title="Backend Ingestion Failed"
            error={error}
            onRetry={handleLoadBenchmark}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Main 1-Click Production Dataset Card */}
      <div className="mb-6 rounded-2xl border border-[#E5D7B7] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(184,142,62,0.06)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F6D27] uppercase tracking-wider mb-1.5">
              <Sparkles className="size-3.5 text-[#B88E3E]" />
              <span>Recommended For Immediate Client Walkthrough</span>
            </div>
            <h3 className="text-xl font-bold text-[#18181B]">
              Load Commercial Kitchen Benchmark Dataset
            </h3>
            <p className="mt-1 text-xs text-[#52525B] max-w-lg leading-relaxed">
              1 full year of verified commercial POS records (15 Nov 2025 – 14 Nov 2026), 10 menu items,
              covering high-volume weekend dining, weekday lunch corporate velocity, and festival surge cycles.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono">
              <span className="rounded-md bg-[#FAF8F5] border border-[#EADDCE] px-2.5 py-1 text-[#52525B]">
                365 Days Scope
              </span>
              <span className="rounded-md bg-[#FAF8F5] border border-[#EADDCE] px-2.5 py-1 text-[#52525B]">
                10 Menu Items
              </span>
              <span className="rounded-md bg-[#FAF5EA] border border-[#E5D7B7] px-2.5 py-1 text-[#8F6D27] font-semibold">
                3,316 Transaction Rows
              </span>
            </div>
          </div>

          <button
            onClick={handleLoadBenchmark}
            disabled={isLoading}
            className="group inline-flex items-center gap-2 rounded-xl bg-[#B88E3E] hover:bg-[#9E772E] text-white px-6 py-3.5 font-bold text-sm transition-all shadow-[0_4px_14px_rgba(184,142,62,0.3)] hover:shadow-[0_6px_20px_rgba(184,142,62,0.4)] cursor-pointer shrink-0 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Ingesting to Backend...</span>
              </>
            ) : (
              <>
                <span>Load Benchmark Dataset</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            processUploadedFile(file);
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? "border-[#B88E3E] bg-[#FAF5EA]/50"
            : "border-[#E5D7B7] bg-[#FDFBF7] hover:border-[#B88E3E]"
        }`}
      >
        <div className="mx-auto size-12 rounded-xl bg-white border border-[#EADDCE] flex items-center justify-center text-[#B88E3E] mb-4 shadow-sm">
          <UploadCloud className="size-6" />
        </div>

        <h4 className="text-sm font-semibold text-[#18181B]">
          Or upload your restaurant&apos;s custom sales export
        </h4>
        <p className="mt-1 text-xs text-[#52525B] max-w-sm mx-auto">
          Drag and drop your file here, or click browse. Supports .csv or .json formats.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-[#EADDCE] bg-white hover:bg-[#FAF8F5] hover:border-[#B88E3E] px-4 py-2 text-xs font-semibold text-[#27272A] cursor-pointer transition-colors shadow-sm">
            <span>Browse File</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
          </label>
          <a
            href="/benchmark_sales_1year.csv"
            download="benchmark_sales_1year.csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5D7B7] bg-[#FAF5EA] hover:bg-[#FAF0DC] px-4 py-2 text-xs font-semibold text-[#8F6D27] transition-colors shadow-sm"
          >
            <Download className="size-3.5 text-[#B88E3E]" />
            <span>Download 1-Year Sample CSV</span>
          </a>
        </div>

        {selectedFileName && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#8F6D27] font-mono bg-[#FAF5EA] px-3 py-1 rounded-md border border-[#E5D7B7]">
            <CheckCircle2 className="size-3.5 text-[#B88E3E]" />
            <span>Active: {selectedFileName}</span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#EADDCE]/60 flex items-center justify-center gap-6 text-[11px] text-[#71717A] font-mono">
          <span>Expected columns: date, item, qty_sold, optional sold_out and category</span>
          <span>•</span>
          <span>Zero-leakage temporal isolation</span>
        </div>
      </div>
    </div>
  );
}
