import React from "react";
import { PeriodTotals } from "@/data/demoDataset";
import { formatPercent } from "@/lib/utils";

interface PeriodTotalsTableProps {
  nameHeader: string; // "Menu Item" or "Category"
  rows: PeriodTotals[];
  emptyMessage: string;
}

function differenceColor(difference: number): string {
  if (difference > 0) return "text-amber-700 font-bold"; // sold more than predicted
  if (difference < 0) return "text-emerald-700 font-bold";
  return "text-[#71717A]";
}

/** Predicted vs actual portions summed over the compared period, one row per item or per category. */
export function PeriodTotalsTable({ nameHeader, rows, emptyMessage }: PeriodTotalsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[#EADDCE] bg-[#FAF8F5] text-[#52525B] font-mono uppercase tracking-wider text-[11px]">
            <th className="py-3.5 px-5">{nameHeader}</th>
            <th className="py-3.5 px-4 text-right">Total Predicted (Likely)</th>
            <th className="py-3.5 px-4 text-right">Total Actual Sold</th>
            <th className="py-3.5 px-4 text-right">Cumulative Diff</th>
            <th className="py-3.5 px-5 text-right">Accuracy Over Period</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EADDCE]/60">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-[#71717A] font-mono">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.name} className="hover:bg-[#FAF8F5] transition-colors">
                <td className="py-3.5 px-5 font-semibold text-[#18181B] text-sm">{row.name}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#B88E3E] text-sm">
                  {row.totalLikely}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#18181B] text-sm">
                  {row.totalActual}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-xs">
                  <span className={differenceColor(row.difference)}>
                    {row.difference > 0 ? `+${row.difference}` : row.difference}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right font-mono">
                  <span className="font-bold text-emerald-700 text-sm">{formatPercent(row.accuracy)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
