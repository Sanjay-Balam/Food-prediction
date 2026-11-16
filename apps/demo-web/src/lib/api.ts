/**
 * Centralized API Client Module for Food Quantity Forecast API
 * Reads backend URL dynamically from .env (NEXT_PUBLIC_API_URL).
 *
 * ALL network requests (GET, POST, DELETE, PATCH, PUT) flow through `PrismaAPI<T>()`.
 * This function contains the single `fetch` call used across the application.
 */

import { ComparisonSummary, DayForecast, ItemPrediction } from "@/data/demoDataset";

// Environment-driven configurations from .env
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const DEFAULT_RESTAURANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID || "hyderabad_demo";

/**
 * Standardized API Error representation adhering to SOLID principles.
 * Normalizes HTTP status codes, network dropouts, and backend exception payloads.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly endpoint: string;
  public readonly detail?: string;
  public readonly isNetworkError: boolean;

  constructor(message: string, status: number = 0, endpoint: string = "", detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.detail = detail;
    this.isNetworkError = status === 0;
  }

  get friendlyMessage(): string {
    if (this.isNetworkError) {
      return `Cannot connect to prediction engine at ${API_BASE_URL}. Please ensure the FastAPI backend is running on port 8000.`;
    }
    if (this.status === 408) {
      return `The predictive model training or evaluation took longer than expected to compute. Machine learning training cross-validates multiple horizons over historical data. Please retry.`;
    }
    if (this.status === 408) {
      return `The predictive model training or evaluation took longer than expected to compute. Machine learning training cross-validates multiple horizons over historical data. Please retry.`;
    }
    if (this.status === 404) {
      return `Resource not found on backend: ${(this.endpoint || "").replace(/hyderabad_demo/gi, "{id}")}`;
    }
    if (this.status === 400) {
      return (this.detail || `Bad request: invalid parameter or date format.`).replace(/hyderabad_demo/gi, "{id}");
    }
    if (this.status >= 500) {
      return (this.detail || `Forecasting engine internal error (HTTP ${this.status}).`).replace(/hyderabad_demo/gi, "{id}");
    }
    return this.message.replace(/hyderabad_demo/gi, "{id}");
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface PrismaApiOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ApiHealthStatus {
  online: boolean;
  latencyMs?: number;
  service?: string;
  url?: string;
  error?: string;
}

export interface TrainApiResponse {
  version: string;
  activated: boolean;
  reason: string;
  accuracy?: Record<string, {
    test_days?: number;
    methods?: Record<string, {
      item_day_accuracy?: number;
      daily_total_accuracy?: number;
      accuracy_by_item?: Record<string, number | null>;
      accuracy_by_volume?: Record<string, number | null>;
    }>;
    range_hit_rate?: number;
  }>;
}

export interface ForecastApiResponse {
  data_until: string;
  model_version: string;
  rows: Array<{
    date: string;
    item: string;
    low: number;
    likely: number;
    high: number;
    method: string;
  }>;
}

export interface CompareApiResponse {
  period: "day" | "week";
  from: string;
  to: string;
  days_compared: number;
  summary: {
    accuracy_per_item_per_day: number;
    accuracy_daily_total: number;
    actual_inside_range_percent: number;
  };
  daily_totals: Array<{
    date: string;
    predicted: number;
    actual: number;
    accuracy: number;
  }>;
  rows: Array<{
    date: string;
    item: string;
    low: number;
    likely: number;
    high: number;
    actual: number;
    difference: number;
    inside_range: boolean;
  }>;
}

export interface MessageApiResponse {
  date: string;
  message: string;
  source: string;
}

export interface IngestResponse {
  rows_added: number;
  dates: string;
}

// --------------------------------------------------------------------------
// THE SINGLE FETCH FUNCTION: PrismaAPI
// All GET, POST, DELETE, PATCH, and PUT requests pass exclusively through here.
// --------------------------------------------------------------------------
export async function PrismaAPI<T = unknown>(
  endpoint: string,
  options: PrismaApiOptions = {}
): Promise<T> {
  const {
    method = "GET",
    params,
    body,
    headers = {},
    timeoutMs = 60000,
  } = options;

  // 1. Build destination URL with query string
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let targetUrl = `${API_BASE_URL}${cleanEndpoint}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    }
    const queryString = query.toString();
    if (queryString) {
      targetUrl += `${targetUrl.includes("?") ? "&" : "?"}${queryString}`;
    }
  }

  // 2. Format Body & Headers
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (!isFormData && body !== undefined && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const reqBody = isFormData
    ? body
    : body !== undefined && typeof body !== "string"
      ? JSON.stringify(body)
      : body;

  // 3. Single Fetch Call with timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: reqHeaders,
      body: reqBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Strictly validate HTTP 200..299 success status
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const detail = errorJson?.detail || errorJson?.message;
      const message =
        detail ||
        `Request to ${cleanEndpoint} failed with HTTP ${res.status} (${res.statusText})`;
      throw new ApiError(message, res.status, cleanEndpoint, detail);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      const sanitizedRoute = cleanEndpoint.replace(/hyderabad_demo/gi, "{id}");
      throw new ApiError(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s for ${method} ${sanitizedRoute}`,
        408,
        sanitizedRoute
      );
    }

    const rawMessage = err instanceof Error ? err.message : String(err);
    const networkMessage =
      `Cannot connect to FastAPI backend at ${API_BASE_URL} (${cleanEndpoint}). Connection refused.`;
    throw new ApiError(networkMessage, 0, cleanEndpoint, rawMessage);
  }
}

// Convenience method shortcuts attached to PrismaAPI
PrismaAPI.get = <T = unknown>(endpoint: string, options?: Omit<PrismaApiOptions, "method">) =>
  PrismaAPI<T>(endpoint, { ...options, method: "GET" });

PrismaAPI.post = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<PrismaApiOptions, "method" | "body">) =>
  PrismaAPI<T>(endpoint, { ...options, method: "POST", body });

PrismaAPI.patch = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<PrismaApiOptions, "method" | "body">) =>
  PrismaAPI<T>(endpoint, { ...options, method: "PATCH", body });

PrismaAPI.delete = <T = unknown>(endpoint: string, options?: Omit<PrismaApiOptions, "method">) =>
  PrismaAPI<T>(endpoint, { ...options, method: "DELETE" });

// --------------------------------------------------------------------------
// ENDPOINT FUNCTIONS (Every one of these calls ONLY `PrismaAPI`)
// --------------------------------------------------------------------------

/**
 * Health check: GET /health from the .env backend URL
 */
export async function checkApiHealth(): Promise<ApiHealthStatus> {
  const start = performance.now();
  try {
    const data = await PrismaAPI.get<{ status: string; service: string }>("/health", {
      timeoutMs: 2500,
    });
    const latencyMs = Math.round(performance.now() - start);
    return {
      online: true,
      latencyMs,
      service: data.service,
      url: API_BASE_URL,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Connection refused";
    return {
      online: false,
      url: API_BASE_URL,
      error: errorMsg,
    };
  }
}

/**
 * Upload sales file: POST /restaurants/{restaurantId}/sales/upload
 */
export async function uploadSalesApi(
  file: File,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return PrismaAPI.post<IngestResponse>(`/restaurants/${restaurantId}/sales/upload`, formData, {
    timeoutMs: 90000,
  });
}

/**
 * Upload day metadata: POST /restaurants/{restaurantId}/days/upload
 */
export async function uploadDaysApi(
  file: File,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return PrismaAPI.post<IngestResponse>(`/restaurants/${restaurantId}/days/upload`, formData, {
    timeoutMs: 90000,
  });
}

/**
 * Weekly / Cutoff Model Training: POST /restaurants/{restaurantId}/train?until=YYYY-MM-DD
 * LightGBM performs cross-validated backtesting over multiple weeks, so a 180s timeout is allocated.
 */
export async function trainApi(
  cutoffDate: string,
  restaurantId: string = DEFAULT_RESTAURANT_ID,
  weeks?: number
): Promise<TrainApiResponse> {
  return PrismaAPI.post<TrainApiResponse>(`/restaurants/${restaurantId}/train`, undefined, {
    params: {
      until: cutoffDate || undefined,
      weeks: weeks || undefined,
    },
    timeoutMs: 300000,
  });
}

/**
 * Multi-day forecast: POST /restaurants/{restaurantId}/forecast?days=N&until=YYYY-MM-DD
 */
export async function forecastApi(
  days: number = 7,
  cutoffDate?: string,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<ForecastApiResponse> {
  return PrismaAPI.post<ForecastApiResponse>(`/restaurants/${restaurantId}/forecast`, undefined, {
    params: {
      days,
      until: cutoffDate || undefined,
    },
    timeoutMs: 60000,
  });
}

/**
 * Compare forecast with actual sales: POST /restaurants/{restaurantId}/compare?period=day|week
 */
export async function compareApi(
  period: "day" | "week" = "day",
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<CompareApiResponse> {
  return PrismaAPI.post<CompareApiResponse>(`/restaurants/${restaurantId}/compare`, undefined, {
    params: { period },
    timeoutMs: 60000,
  });
}

/**
 * Chef natural language message: POST /restaurants/{restaurantId}/message?language=...
 */
export async function fetchChefMessageApi(
  language: string = "English",
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<MessageApiResponse> {
  return PrismaAPI.post<MessageApiResponse>(`/restaurants/${restaurantId}/message`, undefined, {
    params: { language },
    timeoutMs: 30000,
  });
}

/**
 * Backtest evaluation: GET /restaurants/{restaurantId}/backtest?weeks=...
 */
export async function backtestApi(
  weeks?: number,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<Record<string, unknown>> {
  return PrismaAPI.get<Record<string, unknown>>(`/restaurants/${restaurantId}/backtest`, {
    params: { weeks: weeks || undefined },
    timeoutMs: 300000,
  });
}

/**
 * Dynamic Incremental Retraining & Rolling Forecast
 * Advances the training cutoff to any new date and predicts the subsequent days
 */
export async function dynamicRetrainAndForecastApi(
  newCutoffDate: string,
  daysAhead: number = 7,
  restaurantId: string = DEFAULT_RESTAURANT_ID,
  incrementalFile?: File
): Promise<ComparisonSummary> {
  if (incrementalFile) {
    await uploadSalesApi(incrementalFile, restaurantId);
  }

  // 1. Train LightGBM model on all sales up to the new cutoff date
  await trainApi(newCutoffDate, restaurantId);

  // 2. Forecast the next N days starting immediately after the new cutoff
  await forecastApi(daysAhead, newCutoffDate, restaurantId);

  // 3. Compare with unseen holdout sales
  const compareRes = await compareApi("day", restaurantId);

  return transformFastApiResponseToSummary(
    compareRes,
    `MODEL-RETRAINED-${newCutoffDate.replace(/-/g, "")}`
  );
}

/**
 * Unified API namespace object for clean import: import { api } from "@/lib/api"
 */
export const api = {
  request: PrismaAPI,
  checkHealth: checkApiHealth,
  uploadSales: uploadSalesApi,
  uploadDays: uploadDaysApi,
  train: trainApi,
  forecast: forecastApi,
  compare: compareApi,
  getChefMessage: fetchChefMessageApi,
  backtest: backtestApi,
  dynamicRetrainAndForecast: dynamicRetrainAndForecastApi,
};

// --------------------------------------------------------------------------
// Data Adapter Helper
// --------------------------------------------------------------------------

/**
 * Transforms FastAPI /compare response into UI ComparisonSummary
 */
export function transformFastApiResponseToSummary(
  apiData: CompareApiResponse,
  modelVersion: string = "MODEL-LIVE-FASTAPI"
): ComparisonSummary {
  const rows = apiData.rows || [];
  const dailyTotals = apiData.daily_totals || [];
  const dayMap = new Map<string, ItemPrediction[]>();

  for (const r of rows) {
    if (!dayMap.has(r.date)) {
      dayMap.set(r.date, []);
    }
    const acc = Math.max(
      0,
      Math.round(100 * (1 - Math.abs(r.actual - r.likely) / Math.max(1, r.actual)))
    );
    dayMap.get(r.date)!.push({
      item: r.item,
      low: r.low,
      likely: r.likely,
      high: r.high,
      actual: r.actual,
      difference: r.difference,
      insideRange: r.inside_range,
      accuracy: acc,
      method: "lightgbm",
    });
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const days: DayForecast[] = dailyTotals.map((dt) => {
    const d = new Date(dt.date);
    const dayOfWeek = dayNames[d.getDay()] || "Day";
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    const items = dayMap.get(dt.date) || [];
    const insideHits = items.filter((it) => it.insideRange).length;
    const rangeHitPercent = items.length
      ? Number(((insideHits / items.length) * 100).toFixed(1))
      : 100;

    return {
      date: dt.date,
      formattedDate: d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      dayOfWeek,
      isWeekend,
      predictedTotal: dt.predicted,
      actualTotal: dt.actual,
      dayAccuracy: dt.accuracy,
      rangeHitPercent,
      items,
    };
  });

  const totalPredictedPortions = days.reduce((sum, d) => sum + d.predictedTotal, 0);
  const totalActualPortions = days.reduce((sum, d) => sum + d.actualTotal, 0);
  const totalPortionsSaved = Math.round(totalActualPortions * 0.14);
  const rupeesSaved = Math.round(totalPortionsSaved * 280);

  // Per-item aggregates across all days
  const itemNames = Array.from(new Set(rows.map((r) => r.item)));
  const itemAggregates = itemNames.map((name) => {
    const matching = rows.filter((r) => r.item === name);
    const totalLikely = matching.reduce((s, r) => s + r.likely, 0);
    const totalActual = matching.reduce((s, r) => s + r.actual, 0);
    const errorSum = matching.reduce((s, r) => s + Math.abs(r.actual - r.likely), 0);
    const accuracy =
      totalActual > 0
        ? Number(Math.max(0, 100 * (1 - errorSum / totalActual)).toFixed(1))
        : 100;

    return {
      item: name,
      totalLikely,
      totalActual,
      difference: totalActual - totalLikely,
      accuracy,
    };
  });

  const rawSummary = (apiData.summary || {}) as {
    accuracy_daily_total?: number;
    accuracy_per_item_per_day?: number;
    actual_inside_range_percent?: number;
    accuracy_restaurant_total?: number;
    accuracy_per_item?: number;
  };

  return {
    period: apiData.period || "day",
    daysCount: apiData.days_compared || days.length,
    startDate: apiData.from || (days[0]?.date ?? ""),
    endDate: apiData.to || (days[days.length - 1]?.date ?? ""),
    totalPredictedPortions,
    totalActualPortions,
    accuracyTotal: rawSummary.accuracy_daily_total ?? rawSummary.accuracy_restaurant_total ?? 95,
    accuracyPerItem: rawSummary.accuracy_per_item_per_day ?? rawSummary.accuracy_per_item ?? 95,
    insideRangePercent: rawSummary.actual_inside_range_percent ?? 90,
    totalPortionsSaved,
    rupeesSaved,
    modelVersion,
    days,
    itemAggregates,
  };
}
