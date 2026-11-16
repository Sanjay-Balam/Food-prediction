"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";

export interface ErrorAlertProps {
  title?: string;
  error: Error | ApiError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Reusable, accessible Error Alert component following SOLID principles.
 * Surfaces clean, human-readable error messages with optional technical diagnostics and retry action.
 */
export function ErrorAlert({
  title = "API Request Failed",
  error,
  onRetry,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : (error as { status?: number })?.status;
  
  const sanitize = (text?: string): string => {
    if (!text) return "";
    return text.replace(/hyderabad_demo/gi, "{id}").replace(/hyderabad/gi, "Facility");
  };

  const rawEndpoint = isApiError ? error.endpoint : (error as { endpoint?: string })?.endpoint;
  const endpoint = sanitize(rawEndpoint);
  const technicalDetail = sanitize(isApiError ? error.detail : undefined);
  const rawFriendlyMessage = isApiError
    ? error.friendlyMessage
    : typeof error === "string"
    ? error
    : error.message || "An unexpected error occurred.";
  const friendlyMessage = sanitize(rawFriendlyMessage);

  const isConnectionRefused =
    status === 0 ||
    friendlyMessage.toLowerCase().includes("cannot connect") ||
    friendlyMessage.toLowerCase().includes("connection refused") ||
    friendlyMessage.toLowerCase().includes("failed to fetch");

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-rose-300 bg-rose-50/80 p-5 text-rose-950 shadow-sm transition-all duration-200 animate-in fade-in ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="size-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
          <AlertCircle className="size-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-rose-900 tracking-tight">
              {title}
              {status ? (
                <span className="ml-2 font-mono text-[11px] font-semibold text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-md">
                  HTTP {status}
                </span>
              ) : isConnectionRefused ? (
                <span className="ml-2 font-mono text-[11px] font-semibold text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-md">
                  Server Offline
                </span>
              ) : null}
            </h4>

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-rose-500 hover:text-rose-800 transition-colors cursor-pointer p-0.5 rounded-md"
                aria-label="Dismiss error"
              >
                <XCircle className="size-4" />
              </button>
            )}
          </div>

          <p className="mt-1 text-xs text-rose-800 leading-relaxed font-medium">
            {friendlyMessage}
          </p>

          {isConnectionRefused && (
            <div className="mt-2.5 rounded-lg bg-white/80 border border-rose-200 p-2.5 text-[11px] text-rose-900">
              <span className="font-semibold block mb-0.5">Quick Recovery:</span>
              Start the FastAPI engine in your terminal:
              <code className="block mt-1 bg-rose-100/70 border border-rose-200 rounded px-2 py-1 font-mono text-rose-950 select-all">
                cd apps/api && python -m uvicorn forecast.api:app --reload
              </code>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Retry Request</span>
              </button>
            )}

            {(endpoint || technicalDetail || typeof error !== "string") && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
              >
                <span>{showDetails ? "Hide Diagnostics" : "View Technical Diagnostics"}</span>
                {showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            )}
          </div>

          {/* Technical Diagnostics Details */}
          {showDetails && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-white p-3 text-[11px] font-mono text-zinc-700 space-y-1 overflow-x-auto">
              {endpoint && (
                <div>
                  <span className="text-zinc-400">Endpoint: </span>
                  <span className="font-semibold text-zinc-900">{endpoint}</span>
                </div>
              )}
              {status !== undefined && (
                <div>
                  <span className="text-zinc-400">Status Code: </span>
                  <span className="font-semibold text-zinc-900">{status || "0 (No Response)"}</span>
                </div>
              )}
              {technicalDetail && (
                <div>
                  <span className="text-zinc-400">Detail: </span>
                  <span className="text-rose-700">{technicalDetail}</span>
                </div>
              )}
              {error instanceof Error && error.stack && (
                <div className="pt-1 mt-1 border-t border-zinc-100 text-[10px] text-zinc-500 whitespace-pre-wrap">
                  {error.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
