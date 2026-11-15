"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { areas } from "@/content/site";

export function ParallaxPhotoRow() {
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });
  const reduceMotion = useReducedMotion();

  // 2nd and 4th columns lift and glide with faster parallax motion
  const lift = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={rowRef} className="bg-paper py-28 lg:py-36 overflow-hidden border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">
            Every Touchpoint Aligned
          </span>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl font-semibold text-ink">
            From the Cold Room to <em className="italic font-normal text-teal">the Final Bill</em>
          </h2>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {areas.map((card, index) => {
            const isLifted = index % 2 === 1;
            return (
              <motion.li
                key={card.name}
                style={isLifted && !reduceMotion ? { y: lift } : undefined}
                className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-tint border border-hairline shadow-[0_16px_40px_rgba(11,33,41,0.08)]"
              >
                <Image
                  src={card.photo}
                  alt={card.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent transition-opacity group-hover:from-ink/95" />

                <div className="absolute inset-x-5 bottom-6 text-white flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
                      {card.name}
                    </span>
                    <span className="text-mint text-xl font-serif">✳</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-on-ink-muted leading-relaxed font-light">
                    {card.subtitle}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
