/**
 * Domain Data Models & Typing Contracts for Commercial Kitchen Forecasting
 * Formatted directly after FastAPI /compare and /forecast response schemas.
 */
import type { CompareApiResponse } from "@/lib/api";

export interface MenuItem {
  id: string;
  name: string;
  category: "Biryani" | "Starters" | "Curries & Breads" | "Desserts" | "Seasonal";
  baseDaily: number;
  unitPrice: number;
  ingredients: { name: string; qtyPerPortion: number; unit: string }[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "chicken-biryani",
    name: "Chicken Dum Biryani",
    category: "Biryani",
    baseDaily: 185,
    unitPrice: 340,
    ingredients: [
      { name: "Farm Chicken (Curry Cut)", qtyPerPortion: 0.22, unit: "kg" },
      { name: "Aged Basmati Rice", qtyPerPortion: 0.16, unit: "kg" },
      { name: "Pure Cow Ghee", qtyPerPortion: 0.035, unit: "kg" },
    ],
  },
  {
    id: "mutton-biryani",
    name: "Mutton Dum Biryani",
    category: "Biryani",
    baseDaily: 92,
    unitPrice: 480,
    ingredients: [
      { name: "Tender Mutton (Potli Cut)", qtyPerPortion: 0.24, unit: "kg" },
      { name: "Aged Basmati Rice", qtyPerPortion: 0.16, unit: "kg" },
      { name: "Saffron & Spices", qtyPerPortion: 0.015, unit: "kg" },
    ],
  },
  {
    id: "veg-biryani",
    name: "Veg Dum Biryani",
    category: "Biryani",
    baseDaily: 48,
    unitPrice: 260,
    ingredients: [
      { name: "Mixed Farm Vegetables", qtyPerPortion: 0.18, unit: "kg" },
      { name: "Basmati Rice", qtyPerPortion: 0.15, unit: "kg" },
      { name: "Fried Onions (Birista)", qtyPerPortion: 0.02, unit: "kg" },
    ],
  },
  {
    id: "chicken-65",
    name: "Chicken 65",
    category: "Starters",
    baseDaily: 84,
    unitPrice: 310,
    ingredients: [
      { name: "Boneless Chicken Breast", qtyPerPortion: 0.18, unit: "kg" },
      { name: "Curry Leaves & Green Chili", qtyPerPortion: 0.01, unit: "kg" },
    ],
  },
  {
    id: "apollo-fish",
    name: "Apollo Fish",
    category: "Starters",
    baseDaily: 42,
    unitPrice: 390,
    ingredients: [
      { name: "Fresh Murrel / Basa Fillet", qtyPerPortion: 0.19, unit: "kg" },
      { name: "Spiced Batter & Yogurt", qtyPerPortion: 0.04, unit: "kg" },
    ],
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    category: "Curries & Breads",
    baseDaily: 58,
    unitPrice: 280,
    ingredients: [
      { name: "Malai Paneer Cubes", qtyPerPortion: 0.15, unit: "kg" },
      { name: "Butter & Cream Gravy", qtyPerPortion: 0.12, unit: "kg" },
    ],
  },
  {
    id: "butter-naan",
    name: "Butter Naan",
    category: "Curries & Breads",
    baseDaily: 240,
    unitPrice: 65,
    ingredients: [
      { name: "Refined Flour (Maida)", qtyPerPortion: 0.12, unit: "kg" },
      { name: "Butter Glaze", qtyPerPortion: 0.02, unit: "kg" },
    ],
  },
  {
    id: "double-ka-meetha",
    name: "Double ka Meetha",
    category: "Desserts",
    baseDaily: 52,
    unitPrice: 150,
    ingredients: [
      { name: "Fried Milk Bread", qtyPerPortion: 0.08, unit: "kg" },
      { name: "Rabri & Cardamom Syrup", qtyPerPortion: 0.09, unit: "kg" },
    ],
  },
  {
    id: "qubani-ka-meetha",
    name: "Qubani ka Meetha",
    category: "Desserts",
    baseDaily: 36,
    unitPrice: 170,
    ingredients: [
      { name: "Dried Turkish Apricots", qtyPerPortion: 0.1, unit: "kg" },
      { name: "Fresh Malai Cream", qtyPerPortion: 0.04, unit: "kg" },
    ],
  },
  {
    id: "royal-haleem",
    name: "Special Royal Haleem",
    category: "Seasonal",
    baseDaily: 110,
    unitPrice: 320,
    ingredients: [
      { name: "Pounded Mutton", qtyPerPortion: 0.22, unit: "kg" },
      { name: "Broken Wheat & Lentils", qtyPerPortion: 0.14, unit: "kg" },
      { name: "Pure Ghee", qtyPerPortion: 0.05, unit: "kg" },
    ],
  },
];

export interface ItemPrediction {
  item: string;
  low: number;
  likely: number;
  high: number;
  actual: number;
  difference: number;
  insideRange: boolean;
  accuracy: number | null; // null when 0 were sold
  method: "lightgbm" | "same_weekday_average";
  category?: string; // menu section from the upload; "" or absent when none was given
}

export interface DayForecast {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  isWeekend: boolean;
  eventNote?: string;
  predictedTotal: number;
  actualTotal: number;
  dayAccuracy: number | null;
  rangeHitPercent: number;
  items: ItemPrediction[];
}

/** One item's or one category's portions summed over the compared period (API `items` / `categories`). */
export interface PeriodTotals {
  name: string;
  totalLikely: number;
  totalActual: number;
  difference: number;
  accuracy: number | null;
}

export interface ComparisonSummary {
  period: CompareApiResponse["period"];
  daysCount: number;
  startDate: string;
  endDate: string;
  totalPredictedPortions: number;
  totalActualPortions: number;
  accuracyTotal: number | null; // accuracy_daily_total
  accuracyPerItem: number | null; // accuracy_per_item_per_day
  insideRangePercent: number;
  accuracyPerItemPeriod: number | null; // accuracy_per_item_period
  accuracyPeriodTotal: number | null; // accuracy_period_total
  accuracyPerCategoryDay: number | null; // accuracy_per_category_per_day; null without categories
  accuracyPerCategoryPeriod: number | null; // accuracy_per_category_period; null without categories
  modelVersion: string;
  days: DayForecast[];
  itemAggregates: PeriodTotals[];
  categoryAggregates: PeriodTotals[]; // empty without categories
  raw: CompareApiResponse; // the /compare response exactly as received
}

/**
 * Calculates 100% minus WAPE
 */
export function calculateWapeAccuracy(actuals: number[], predicteds: number[]): number {
  const actualSum = actuals.reduce((a, b) => a + b, 0);
  if (actualSum === 0) return 0;
  const errorSum = actuals.reduce((sum, act, i) => sum + Math.abs(act - predicteds[i]), 0);
  return Number(Math.max(0, 100 * (1 - errorSum / actualSum)).toFixed(1));
}
