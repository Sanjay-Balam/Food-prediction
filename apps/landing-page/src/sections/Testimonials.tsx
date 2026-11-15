"use client";

import React from "react";
import { testimonials } from "@/content/site";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Quote, Star } from "lucide-react";

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-paper-warm py-28 lg:py-36 border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Voice from the Pass</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
            Trusted by the kitchens <br />
            <em className="font-normal italic text-teal">that feed the city.</em>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <Reveal key={t.author} delay={index * 0.1}>
              <div className="h-full rounded-3xl border border-hairline bg-white p-8 shadow-[0_12px_36px_rgba(11,33,41,0.05)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="font-serif text-lg leading-relaxed text-ink italic font-normal">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-8 border-t border-hairline pt-6">
                  <p className="font-serif text-base font-bold text-ink">{t.author}</p>
                  <p className="text-xs font-medium text-teal mt-0.5">{t.role}</p>
                  <p className="text-xs text-muted mt-0.5">{t.restaurant}, {t.city}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
