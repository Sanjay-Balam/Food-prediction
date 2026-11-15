"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";

/** Background video that fades in once it can play; skipped for reduced motion (the dot field shows instead). */
export function HeroVideo({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-70" : "opacity-0"}`}
    />
  );
}
