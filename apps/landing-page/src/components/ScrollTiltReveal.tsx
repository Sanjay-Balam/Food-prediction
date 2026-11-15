"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/** Starts tipped back and slightly small, and lies flat at full size as it scrolls up the screen. */
export function ScrollTiltReveal({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "start 20%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const reduceMotion = useReducedMotion();

  return (
    <div ref={frame} style={{ perspective: 1400 }}>
      <motion.div style={reduceMotion ? undefined : { rotateX, scale, transformOrigin: "50% 0%" }}>{children}</motion.div>
    </div>
  );
}
