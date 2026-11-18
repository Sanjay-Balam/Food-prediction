/**
 * Centralized API Client Module for Food Quantity Forecast API
 * Reads backend URL dynamically from .env (NEXT_PUBLIC_API_URL).
 *
 * ALL network requests (GET, POST, DELETE, PATCH, PUT) flow through `PrismaAPI<T>()`.
 * This function contains the single `fetch` call used across the application.
 */

import { ComparisonSummary, DayForecast, ItemPrediction, PeriodTotals } from "@/data/demoDataset";

// Environment-driven configurations from .env
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const DEFAULT_RESTAURANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID || "hyderabad_demo";

/**
 * Each demo upload gets its own restaurant so datasets never merge and an older live model
 * (trained past a new cutoff) can never block a fair test. Fits the backend rule [A-Za-z0-9_-]{1,64}.
 */
// shortcut: one folder per demo upload on the server, never cleaned up; add a cleanup job if disk use matters
export const createDemoRestaurantId = () =>
  `demo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

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
    category: string; // "" when the upload had no category for this item
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
  // accuracy values are null when nothing was sold (100% minus WAPE is undefined for 0 sold)
  summary: {
    accuracy_per_item_per_day: number | null;
    accuracy_daily_total: number | null;
    actual_inside_range_percent: number;
    accuracy_per_item_period: number | null;
    accuracy_period_total: number | null;
    // null when the upload had no category column
    accuracy_per_category_per_day: number | null;
    accuracy_per_category_period: number | null;
    predicted_total: number;
    actual_total: number;
  };
  daily_totals: Array<{
    date: string;
    predicted: number;
    actual: number;
    accuracy: number | null;
    inside_range_percent: number;
  }>;
  items: Array<{
    item: string;
    predicted: number;
    actual: number;
    difference: number;
    accuracy: number | null;
  }>;
  categories: Array<{
    category: string; // items without one are grouped as "uncategorized"
    predicted: number;
    actual: number;
    difference: number;
    accuracy: number | null;
  }>; // empty when the upload had no category column
  rows: Array<{
    date: string;
    item: string;
    category?: string;
    low: number;
    likely: number;
    high: number;
    actual: number;
    difference: number;
    inside_range: boolean;
    accuracy: number | null;
    method: "lightgbm" | "same_weekday_average";
  }>;
}

export interface MessageApiResponse {
  date: string;
  message: string;
  source: string;
}

/** POST /sales/upload: what changed, plus a summary of all sales now stored for the restaurant */
export interface SalesUploadResponse {
  added: number;
  replaced: number;
  total_rows: number;
  from: string;
  to: string;
  days: number; // days that have sales
  items: number;
  categories: number; // 0 when the upload had no category column
  total_qty: number;
}

/** POST /days/upload */
export interface DaysUploadResponse {
  added: number;
  replaced: number;
  total_days: number;
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
): Promise<SalesUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return PrismaAPI.post<SalesUploadResponse>(`/restaurants/${restaurantId}/sales/upload`, formData, {
    timeoutMs: 90000,
  });
}

/**
 * Upload day metadata: POST /restaurants/{restaurantId}/days/upload
 */
export async function uploadDaysApi(
  file: File,
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<DaysUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return PrismaAPI.post<DaysUploadResponse>(`/restaurants/${restaurantId}/days/upload`, formData, {
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
  const forecastRes = await forecastApi(daysAhead, newCutoffDate, restaurantId);

  // 3. Compare with unseen holdout sales
  const compareRes = await compareApi("day", restaurantId);

  return buildComparisonSummary(
    compareRes,
    forecastRes.model_version
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
 * Maps the FastAPI /compare?period=day response onto the UI shape, one field to one field.
 * Every number shown comes straight from the API: nothing is computed, adjusted or defaulted here.
 * Only the date is formatted (weekday name, display date), read in UTC so no timezone shifts the day.
 */
export function buildComparisonSummary(
  apiData: CompareApiResponse,
  modelVersion: string
): ComparisonSummary {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const days: DayForecast[] = apiData.daily_totals.map((dt) => {
    const d = new Date(dt.date); // YYYY-MM-DD parses as UTC midnight
    const weekday = d.getUTCDay();
    const items: ItemPrediction[] = apiData.rows
      .filter((r) => r.date === dt.date)
      .map((r) => ({
        item: r.item,
        low: r.low,
        likely: r.likely,
        high: r.high,
        actual: r.actual,
        difference: r.difference,
        insideRange: r.inside_range,
        accuracy: r.accuracy,
        method: r.method,
        category: r.category,
      }));

    return {
      date: dt.date,
      formattedDate: d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      dayOfWeek: dayNames[weekday],
      isWeekend: weekday === 0 || weekday === 5 || weekday === 6,
      predictedTotal: dt.predicted,
      actualTotal: dt.actual,
      dayAccuracy: dt.accuracy,
      rangeHitPercent: dt.inside_range_percent,
      items,
    };
  });

  return {
    period: apiData.period,
    daysCount: apiData.days_compared,
    startDate: apiData.from,
    endDate: apiData.to,
    totalPredictedPortions: apiData.summary.predicted_total,
    totalActualPortions: apiData.summary.actual_total,
    accuracyTotal: apiData.summary.accuracy_daily_total,
    accuracyPerItem: apiData.summary.accuracy_per_item_per_day,
    insideRangePercent: apiData.summary.actual_inside_range_percent,
    accuracyPerItemPeriod: apiData.summary.accuracy_per_item_period,
    accuracyPeriodTotal: apiData.summary.accuracy_period_total,
    accuracyPerCategoryDay: apiData.summary.accuracy_per_category_per_day,
    accuracyPerCategoryPeriod: apiData.summary.accuracy_per_category_period,
    modelVersion,
    days,
    itemAggregates: apiData.items.map((item) => toPeriodTotals(item.item, item)),
    categoryAggregates: apiData.categories.map((category) => toPeriodTotals(category.category, category)),
    raw: apiData,
  };
}

/** Same numbers as the API's per-item / per-category totals, under one shape the tables share. */
function toPeriodTotals(
  name: string,
  totals: { predicted: number; actual: number; difference: number; accuracy: number | null }
): PeriodTotals {
  return {
    name,
    totalLikely: totals.predicted,
    totalActual: totals.actual,
    difference: totals.difference,
    accuracy: totals.accuracy,
  };
}
