"use client";

import React from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/**
 * Apple India & Lenis-grade Smooth Momentum Scroller
 * Configured with Apple's signature exponential decay easing curve and inertia dampening.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.075, // Apple-smooth inertia dampening
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple exponential decay
        wheelMultiplier: 1.05,
        touchMultiplier: 1.5,
        smoothWheel: true,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
