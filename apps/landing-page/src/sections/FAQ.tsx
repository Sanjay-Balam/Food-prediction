"use client";

import React, { useState } from "react";
import { faqs } from "@/content/site";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-paper py-28 lg:py-36 border-b border-hairline">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <Eyebrow>Everything Answered</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
            Frequently Asked <em className="font-normal italic text-teal">Questions</em>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-body font-light">
            Clear, honest answers about how Logeeca fits your existing kitchen setup.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <Reveal key={faq.q} delay={index * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-hairline bg-white transition-all duration-200">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif text-xl font-semibold text-ink pr-6">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-tint text-teal"
                    >
                      <ChevronDown className="size-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-0 text-base leading-relaxed text-body border-t border-hairline/60">
                          <p className="pt-4">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
