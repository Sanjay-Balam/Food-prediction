"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DotField } from "@/components/DotField";
import { Reveal } from "@/components/Reveal";
import { contact, demoPoints } from "@/content/site";
import { ArrowRight, Phone, Mail, MapPin, CheckCircle2, Sparkles } from "lucide-react";

export function CallToAction() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: "",
    outletCity: "Hyderabad",
    phone: "",
    covers: "150–300 daily",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative isolate overflow-hidden bg-canvas text-alabaster pt-28 lg:pt-36 border-t border-champagne/15">
      {/* 3D Dot field in background */}
      <DotField className="absolute inset-0 -z-10 h-full w-full opacity-35" />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-champagne/10 blur-[150px]"
      />

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          {/* Left Column */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-champagne">
              <Sparkles className="size-3.5 text-champagne" />
              <span>Free 14-Day Kitchen Evaluation</span>
            </div>

            <h2 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-alabaster leading-tight">
              See Foresight on <br />
              <em className="font-normal italic text-champagne">your own sales history.</em>
            </h2>

            <p className="mt-6 text-lg font-light leading-relaxed text-lichen max-w-lg">
              Share 30 days of past POS export. We will run our LightGBM model out-of-sample and show you exactly what tomorrow’s prep would have saved your kitchen.
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {demoPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-lichen">
                  <CheckCircle2 className="size-4 text-celadon shrink-0" />
                  <span className="text-alabaster/90">{point}</span>
                </li>
              ))}
            </ul>

            {/* Direct Contact Info */}
            <div className="mt-12 flex flex-col sm:flex-row gap-6 pt-8 border-t border-champagne/15 text-sm text-lichen">
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-champagne" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-champagne" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 text-champagne" />
                <span>{contact.address}</span>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Demo Form Card */}
          <Reveal delay={0.2}>
            <div className="rounded-3xl border border-champagne/20 bg-surface/90 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mx-auto size-14 rounded-full bg-celadon/20 border border-celadon text-celadon grid place-items-center mb-4">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-alabaster">
                    Audit Request Received
                  </h3>
                  <p className="mt-2 text-sm text-lichen leading-relaxed">
                    Our Hyderabad culinary engineering team will contact you on WhatsApp within 3 business hours to configure your test forecast.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-alabaster">
                      Book a 15-Minute Audit
                    </h3>
                    <p className="mt-1 text-xs text-lichen">
                      No software to install. We test against your actual billing records.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-lichen block mb-1.5">
                      Restaurant / Outlet Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jewel of Nizam, Banjara Hills"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                      className="w-full rounded-xl bg-surface-elevated/80 border border-champagne/20 px-4 py-3 text-sm text-alabaster placeholder:text-lichen/60 focus:border-champagne focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-lichen block mb-1.5">
                        City
                      </label>
                      <select
                        value={formData.outletCity}
                        onChange={(e) => setFormData({ ...formData, outletCity: e.target.value })}
                        className="w-full rounded-xl bg-surface-elevated/80 border border-champagne/20 px-4 py-3 text-sm text-alabaster focus:border-champagne focus:outline-none transition-colors"
                      >
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Chennai">Chennai</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-lichen block mb-1.5">
                        Daily Covers
                      </label>
                      <select
                        value={formData.covers}
                        onChange={(e) => setFormData({ ...formData, covers: e.target.value })}
                        className="w-full rounded-xl bg-surface-elevated/80 border border-champagne/20 px-4 py-3 text-sm text-alabaster focus:border-champagne focus:outline-none transition-colors"
                      >
                        <option value="< 150 daily">&lt; 150 daily</option>
                        <option value="150–300 daily">150–300 daily</option>
                        <option value="300–800 daily">300–800 daily</option>
                        <option value="800+ multi-outlet">800+ multi-outlet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-lichen block mb-1.5">
                      Executive / GM WhatsApp Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98490 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl bg-surface-elevated/80 border border-champagne/20 px-4 py-3 text-sm text-alabaster placeholder:text-lichen/60 focus:border-champagne focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-3 group relative inline-flex items-center justify-center gap-2 rounded-full bg-champagne py-4 font-semibold text-ink transition-all duration-300 hover:bg-champagne-light hover:shadow-[0_0_30px_rgba(232,213,181,0.5)] cursor-pointer"
                  >
                    <span>Request Confidential Kitchen Audit</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <p className="text-[11px] text-center text-lichen/80">
                    Strict non-disclosure agreements signed prior to data ingestion.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-champagne/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-lichen">
          <div className="flex items-center gap-3">
            <Image
              src="/logeeca-logo-light.png"
              alt="Logeeca"
              width={1026}
              height={202}
              className="h-5 w-auto opacity-75"
            />
            <span>© 2026 Logeeca Intelligence Pvt Ltd. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#top" className="hover:text-champagne transition-colors">Back to top ↑</a>
            <a href="#" className="hover:text-champagne transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-champagne transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </section>
  );
}
