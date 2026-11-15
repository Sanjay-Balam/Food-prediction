"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Text that rises in word by word (in the spirit of React Bits' SplitText). Screen readers get the plain text. */
export function RevealWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          className="inline-block whitespace-pre"
          initial={reduceMotion ? false : { opacity: 0, y: "0.45em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: delay + index * 0.07, ease: EASE_OUT }}
        >
          {`${word} `}
        </motion.span>
      ))}
    </span>
  );
}
