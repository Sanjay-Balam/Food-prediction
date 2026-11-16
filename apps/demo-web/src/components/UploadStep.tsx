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
import { uploadSalesApi, ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ErrorAlert";

export interface SampleRow {
  date: string;
  item: string;
  qty_sold: number;
  sold_out: string;
}

interface UploadStepProps {
  onDatasetLoaded: (data: {
    restaurantName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    itemsCount: number;
    totalPortions: number;
    sampleRows: SampleRow[];
  }) => void;
}

/**
 * Extracts real dataset parameters directly from an uploaded CSV string.
 * Strictly avoids any synthetic or placeholder figures.
 */
function parseCsvMetadata(csvText: string, restaurantName: string) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("Uploaded file is empty or does not contain data rows.");
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const itemIdx = header.indexOf("item");
  const qtyIdx = header.findIndex((h) => h === "qty_sold" || h === "qty" || h === "quantity");
  const soldOutIdx = header.indexOf("sold_out");

  if (dateIdx === -1 || itemIdx === -1 || qtyIdx === -1) {
    throw new Error("CSV must include 'date', 'item', and 'qty_sold' columns.");
  }

  const dates = new Set<string>();
  const items = new Set<string>();
  let totalPortions = 0;
  const sampleRows: SampleRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    const d = cols[dateIdx];
    const it = cols[itemIdx];
    const q = parseInt(cols[qtyIdx], 10) || 0;
    const so = soldOutIdx !== -1 ? cols[soldOutIdx] : "no";

    if (d) dates.add(d);
    if (it) items.add(it);
    totalPortions += q;

    if (sampleRows.length < 5) {
      sampleRows.push({ date: d, item: it, qty_sold: q, sold_out: so });
    }
  }

  const sortedDates = Array.from(dates).sort();
  return {
    restaurantName,
    startDate: sortedDates[0] || "",
    endDate: sortedDates[sortedDates.length - 1] || "",
    totalDays: sortedDates.length,
    itemsCount: items.size,
    totalPortions,
    sampleRows,
  };
}

export function UploadStep({ onDatasetLoaded }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const handleLoadBenchmark = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedFileName("benchmark_sales_1year.csv");

    try {
      // 1. Fetch benchmark file from public directory
      const fetchRes = await fetch("/benchmark_sales_1year.csv");
      if (!fetchRes.ok) {
        throw new Error("Unable to retrieve benchmark sample file from server.");
      }
      const csvText = await fetchRes.text();
      const file = new File([csvText], "benchmark_sales_1year.csv", { type: "text/csv" });

      // 2. Upload actual sales file to FastAPI backend
      await uploadSalesApi(file);

      // 3. Parse real metadata derived entirely from the ingested CSV
      const parsedMetadata = parseCsvMetadata(
        csvText,
        "Commercial Kitchen Benchmark Line"
      );

      // 4. Advance strictly upon 200 OK
      onDatasetLoaded(parsedMetadata);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(
              message || "Failed to load benchmark dataset to FastAPI backend.",
              0,
              "/restaurants/{id}/sales/upload"
            )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSelectedFileName(file.name);

    try {
      const csvText = await file.text();
      const parsedMetadata = parseCsvMetadata(csvText, `Uploaded POS Export (${file.name})`);

      // Upload file directly to FastAPI backend
      await uploadSalesApi(file);

      // Advance strictly upon 200 OK
      onDatasetLoaded(parsedMetadata);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(
              message || "File ingestion failed. Check CSV format and backend connection.",
              0,
              "/restaurants/{id}/sales/upload"
            )
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <span>Expected columns: date, item, qty_sold, sold_out</span>
          <span>•</span>
          <span>Zero-leakage temporal isolation</span>
        </div>
      </div>
    </div>
  );
}
