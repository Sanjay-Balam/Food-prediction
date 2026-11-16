"use client";

import React from "react";
import Image from "next/image";
import { Cpu, RotateCcw } from "lucide-react";
import { ApiHealthStatus } from "@/lib/api";

interface HeaderProps {
  onReset: () => void;
  apiHealth?: ApiHealthStatus;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="border-b border-[#EADDCE] bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with Official Logeeca Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2">
            <Image
              src="/logeeca-logo-dark.png"
              alt="Logeeca"
              width={140}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </a>
          <span className="h-4 w-px bg-[#EADDCE]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9C792E] bg-[#FAF5EA] px-2.5 py-0.5 rounded-full border border-[#E5D7B7]">
            Foresight Engine
          </span>
        </div>

        {/* Engine Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {/* Model Engine Badge */}
          <div className="flex items-center gap-2 rounded-lg border border-[#E5D7B7] bg-[#FAF6EE] px-3 py-1 text-xs font-medium text-[#7D5F23]">
            <Cpu className="size-3.5 text-[#B88E3E]" />
            <span>Forecasting Model</span>
          </div>

          {/* Reset Action Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-[#EADDCE] bg-white px-3.5 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#B88E3E] transition-all cursor-pointer"
            title="Reset to Step 1"
          >
            <RotateCcw className="size-3.5 text-[#9C792E]" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
