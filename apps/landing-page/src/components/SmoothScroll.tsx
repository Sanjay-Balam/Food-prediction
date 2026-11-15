"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/** Lenis smooth scrolling for the whole page; off for visitors who ask for reduced motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.09, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
