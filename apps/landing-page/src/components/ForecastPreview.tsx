"use client";

import { motion, useReducedMotion } from "motion/react";

const PAST = "M0 80 L36 95 L72 155 L108 170 L144 165 L180 155 L216 125 L252 75 L288 90 L324 150 L360 165 L396 160 L432 150 L468 120";
const FORECAST = "M468 120 L530 68 L586 82 L642 140";
const RANGE = "468,120 530,46 586,58 642,116 642,166 586,108 530,92";

/** The product in one picture: two weeks of sales, today, and tomorrow's forecast with its safe range. */
export function ForecastPreview() {
  const reduceMotion = useReducedMotion();
  const draw = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.6, delay, ease: "easeInOut" as const } };
  const fadeIn = (delay: number) =>
    reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.8, delay } };

  return (
    <div className="relative w-full max-w-[642px]">
      <svg
        viewBox="0 0 642 250"
        className="w-full overflow-visible"
        role="img"
        aria-label="Example chart: two weeks of sales, then tomorrow’s forecast with a safe range"
      >
        <g stroke="#E8D5B5" strokeOpacity="0.08">
          {[40, 100, 160, 220].map((y) => <line key={y} x1="0" y1={y} x2="642" y2={y} />)}
        </g>
        <motion.path
          d={PAST}
          fill="none"
          stroke="#F5F3EF"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          {...draw(0.3)}
        />
        <motion.g {...fadeIn(1.6)}>
          <line x1="468" y1="22" x2="468" y2="220" stroke="#E8D5B5" strokeOpacity="0.3" strokeDasharray="3 4" />
          <text x="468" y="12" textAnchor="middle" fill="#F5F3EF" fillOpacity="0.65" fontSize="12" fontWeight="600" letterSpacing="1.4">TODAY</text>
          <polygon points={RANGE} fill="#4E9B7E" fillOpacity="0.2" />
          <text x="642" y="30" textAnchor="end" fill="#E8D5B5" fontSize="12" fontWeight="600" letterSpacing="1.4">FORECAST</text>
          <circle cx="468" cy="120" r="4" fill="#F5F3EF" />
        </motion.g>
        <motion.path
          d={FORECAST}
          fill="none"
          stroke="#4E9B7E"
          strokeWidth="2.4"
          strokeDasharray="6 5"
          strokeLinecap="round"
          {...draw(1.8)}
        />
        <motion.g {...fadeIn(2.6)}>
          <line x1="530" y1="68" x2="530" y2="236" stroke="#4E9B7E" strokeOpacity="0.8" strokeWidth="1.2" />
          <circle cx="530" cy="68" r="14" fill="#E8D5B5" fillOpacity="0.25" />
          <circle cx="530" cy="68" r="6" fill="#E8D5B5" />
        </motion.g>
      </svg>

      <motion.div
        className="ml-auto -mt-2 w-[280px] rounded-2xl border border-champagne/20 bg-surface/90 backdrop-blur-xl p-5 text-alabaster shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: [0, -6, 0] }}
        transition={reduceMotion ? undefined : { opacity: { duration: 0.6, delay: 2.6 }, y: { duration: 5, delay: 2.6, repeat: Infinity, ease: "easeInOut" } }}
      >
        <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-lichen">
          <span>TOMORROW · SAT</span>
          <span className="rounded-full bg-celadon/15 border border-celadon/25 px-2 py-0.5 font-medium tracking-normal text-celadon-light">
            Verified Model
          </span>
        </div>
        <p className="mt-2 text-[15px] font-semibold text-alabaster">Chicken Dum Biryani</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-serif text-4xl font-semibold leading-none text-champagne">185</span>
          <span className="text-sm text-lichen">portions</span>
        </p>
        <div className="relative mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
          <span className="absolute inset-y-0 left-[28%] right-[26%] rounded-full bg-champagne" />
          <span className="absolute -top-1 left-[51%] h-3.5 w-[3px] rounded bg-white shadow-sm" />
        </div>
        <p className="mt-2 flex justify-between text-sm text-lichen">
          <span>Safe range</span>
          <span className="font-semibold text-champagne">160 – 210</span>
        </p>
      </motion.div>
    </div>
  );
}
