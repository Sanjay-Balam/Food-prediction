import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Shows an API percentage as-is; the API sends null when nothing was sold, which has no accuracy
export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

// Helper: Safely add days to an ISO YYYY-MM-DD string without timezone offset shifts
export function addDaysToIso(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
