/**
 * Training-cutoff rules, kept out of the page so they are easy to read and test on their own.
 * They mirror the API: training needs 14 days of sales to learn from plus a 7-day test (Backtester.evaluate),
 * and the demo compares the forecast with sales after the cutoff, so at least one later day must remain.
 * All dates are YYYY-MM-DD strings, which compare correctly as text.
 */
import { addDaysToIso } from "@/lib/utils";

export const DAYS_NEEDED_TO_TRAIN = 21; // 14 to learn from + a 7-day test

export function earliestTrainingCutoff(firstSalesDate: string): string {
  return addDaysToIso(firstSalesDate, DAYS_NEEDED_TO_TRAIN - 1);
}

export function latestTrainingCutoff(lastSalesDate: string): string {
  return addDaysToIso(lastSalesDate, -1);
}

/** Why a cutoff can't be used, or null when it can. A date input's min/max only limit the picker, not typing. */
export function describeCutoffProblem(cutoff: string, firstSalesDate: string, lastSalesDate: string): string | null {
  const earliest = earliestTrainingCutoff(firstSalesDate);
  const latest = latestTrainingCutoff(lastSalesDate);
  if (!cutoff) {
    return "Enter a cutoff date.";
  }
  if (cutoff < earliest) {
    return (
      `Too early: training needs at least ${DAYS_NEEDED_TO_TRAIN} days of sales up to the cutoff ` +
      `(14 to learn from + a 7-day test). The earliest cutoff for this data is ${earliest}.`
    );
  }
  if (cutoff > latest) {
    return `Too late: pick ${latest} or earlier, so there are later sales to compare the forecast with.`;
  }
  return null;
}

/** Calendar days before and after the cutoff, for the training / holdout bar. */
export function splitTrainingAndHoldoutDays(firstSalesDate: string, lastSalesDate: string, cutoff: string) {
  const dayNumber = (isoDate: string) => Date.parse(isoDate) / 86_400_000; // YYYY-MM-DD parses as UTC midnight
  const totalDays = dayNumber(lastSalesDate) - dayNumber(firstSalesDate) + 1;
  const trainingDays = Math.min(Math.max(dayNumber(cutoff) - dayNumber(firstSalesDate) + 1, 0), totalDays);
  return {
    trainingDays,
    holdoutDays: totalDays - trainingDays,
    trainingPercent: totalDays > 0 ? (trainingDays / totalDays) * 100 : 100,
  };
}
