"use client";

import React from "react";
import { Check, Database, Calendar, Layers, BarChart3 } from "lucide-react";

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 1, title: "1. Data Ingestion", subtitle: "POS receipts upload", icon: Database },
  { id: 2, title: "2. Training Cutoff", subtitle: "Set learning boundary", icon: Calendar },
  { id: 3, title: "3. Forecast Horizon", subtitle: "Day / Week", icon: Layers },
  { id: 4, title: "4. Accuracy & Output", subtitle: "WAPE & day-wise targets", icon: BarChart3 },
];

export function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full border-b border-[#EADDCE] bg-white/70 backdrop-blur-sm py-4">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
                disabled={!isCompleted}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-[#FAF5EA] border-2 border-[#B88E3E] shadow-sm"
                    : isCompleted
                    ? "bg-white border border-[#E5D7B7] hover:border-[#B88E3E] cursor-pointer"
                    : "opacity-45 border border-[#EADDCE] bg-[#FAF9F7] cursor-not-allowed"
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isActive
                      ? "bg-[#B88E3E] text-white shadow-sm"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-white text-[#71717A] border border-[#EADDCE]"
                  }`}
                >
                  {isCompleted ? <Check className="size-4 stroke-[3]" /> : <Icon className="size-4" />}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isActive ? "text-[#18181B] font-bold" : isCompleted ? "text-[#27272A]" : "text-[#71717A]"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-[#71717A] truncate mt-0.5">{step.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
