"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Children, useRef } from "react";

/**
 * Cards that stick and pile up as you scroll; each one tilts 4° (alternating left/right) as the next slides over it.
 * The same effect as MaestroClass's "What the 48 Hours Hold" cards.
 */
export function CardStack({ children }: { children: React.ReactNode }) {
  const stack = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: stack, offset: ["start start", "end end"] });
  const cards = Children.toArray(children);

  return (
    <ol ref={stack}>
      {cards.map((card, index) => (
        <StackedCard key={index} index={index} total={cards.length} progress={scrollYProgress}>
          {card}
        </StackedCard>
      ))}
    </ol>
  );
}

type StackedCardProps = { index: number; total: number; progress: MotionValue<number>; children: React.ReactNode };

function StackedCard({ index, total, progress, children }: StackedCardProps) {
  const reduceMotion = useReducedMotion();
  const tilt = index % 2 === 0 ? -4 : 4;
  const rotate = useTransform(progress, [index / total, (index + 1) / total], [0, index === total - 1 ? 0 : tilt]);

  return (
    <li className="sticky top-[8svh] flex h-[84svh] items-center justify-center">
      <motion.div className="w-full" style={{ marginTop: index * 12, rotate: reduceMotion ? 0 : rotate }}>
        {children}
      </motion.div>
    </li>
  );
}
