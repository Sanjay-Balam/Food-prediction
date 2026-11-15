"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

type Line = { text: string; accent?: boolean };

/** Big quote whose words light up one by one as you scroll through it. The text stays real text for screen readers. */
export function ScrollRevealText({ lines, className }: { lines: Line[]; className?: string }) {
  const quote = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: quote, offset: ["start 85%", "end 45%"] });
  const reduceMotion = useReducedMotion();
  const words = lines.flatMap((line) => line.text.split(" ").map((word) => ({ word, accent: line.accent })));

  return (
    <p ref={quote} className={className}>
      {words.map(({ word, accent }, index) => (
        <Word key={index} progress={scrollYProgress} range={[index / words.length, (index + 1) / words.length]}
          still={!!reduceMotion} className={accent ? "italic font-medium text-teal" : undefined}
        >
          {word}
        </Word>
      ))}
    </p>
  );
}

type WordProps = { progress: MotionValue<number>; range: [number, number]; still: boolean; className?: string; children: string };

function Word({ progress, range, still, className, children }: WordProps) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span className={className} style={{ opacity: still ? 1 : opacity }}>
      {children}{" "}
    </motion.span>
  );
}
