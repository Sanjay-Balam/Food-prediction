"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect } from "react";

/** Position (% of the parent), largest size in px, how far it follows the pointer, and how long one float takes. */
const SPHERES = [
  { left: "7%", top: "14%", size: 130, depth: 28, floatSeconds: 7 },
  { left: "86%", top: "9%", size: 80, depth: 16, floatSeconds: 6 },
  { left: "80%", top: "30%", size: 180, depth: 40, floatSeconds: 9 },
  { left: "3%", top: "38%", size: 64, depth: 12, floatSeconds: 5 },
];

/** Glass balls floating over the hero; they drift against the pointer for depth. Decorative only. */
export function GlassSpheres({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 50, damping: 18 });
  const smoothY = useSpring(pointerY, { stiffness: 50, damping: 18 });

  useEffect(() => {
    if (reduceMotion) return;
    const followPointer = (event: PointerEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", followPointer, { passive: true });
    return () => window.removeEventListener("pointermove", followPointer);
  }, [reduceMotion, pointerX, pointerY]);

  return (
    <div aria-hidden="true" className={className}>
      {SPHERES.map((sphere) => (
        <Sphere key={sphere.left + sphere.top} {...sphere} pointerX={smoothX} pointerY={smoothY} still={!!reduceMotion} />
      ))}
    </div>
  );
}

type SphereProps = (typeof SPHERES)[number] & { pointerX: MotionValue<number>; pointerY: MotionValue<number>; still: boolean };

function Sphere({ left, top, size, depth, floatSeconds, pointerX, pointerY, still }: SphereProps) {
  const x = useTransform(pointerX, (value) => value * -depth);
  const y = useTransform(pointerY, (value) => value * -depth);
  const diameter = `min(${size}px, ${size / 9}vw)`;

  return (
    <motion.div className="absolute" style={{ left, top, x, y }}>
      <motion.div
        className="glass-sphere"
        style={{ width: diameter, height: diameter }}
        animate={still ? undefined : { y: [0, -floatSeconds * 2, 0] }}
        transition={{ duration: floatSeconds, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
