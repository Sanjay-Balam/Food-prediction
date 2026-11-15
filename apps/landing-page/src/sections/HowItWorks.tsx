"use client";

import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { steps } from "@/content/site";

/** The four steps on a timeline whose line fills in as you scroll through it. */
export function HowItWorks() {
  const timeline = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: timeline, offset: ["start 75%", "end 55%"] });

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28 lg:py-36">
      <Reveal>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          From last night’s sales to <em className="font-medium text-teal">this morning’s plan.</em>
        </h2>
      </Reveal>

      <ol ref={timeline} className="relative mt-16 flex max-w-3xl flex-col gap-12 pl-16">
        <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-px bg-hairline" />
        <motion.span aria-hidden="true" style={{ scaleY: scrollYProgress }}
          className="absolute bottom-4 left-[19px] top-4 w-px origin-top bg-teal" />
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <span className="absolute -left-16 top-0 grid size-10 place-items-center rounded-full bg-ink font-serif text-lg italic text-mint">
              {index + 1}
            </span>
            <Reveal delay={0.05}>
              <h3 className="font-serif text-2xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-lg leading-relaxed text-body">{step.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
