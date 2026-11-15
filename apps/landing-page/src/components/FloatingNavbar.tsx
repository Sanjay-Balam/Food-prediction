"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const NAV_LINKS = [
  { href: "#manifesto", label: "Manifesto" },
  { href: "#workflow", label: "Workflow" },
  { href: "#cockpit", label: "Simulator" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#accuracy", label: "Accuracy" },
  { href: "#testimonials", label: "Proof" },
  { href: "#faq", label: "FAQ" },
];

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none">
        <nav
          aria-label="Main navigation"
          className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-3 transition-all duration-500 ${
            scrolled
              ? "glass-pill shadow-[0_18px_48px_rgba(0,0,0,0.6)] border-champagne/20"
              : "bg-surface/85 border border-champagne/15 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          }`}
        >
          {/* Brand Logo */}
          <a
            href="#top"
            className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
            aria-label="Logeeca Foresight, return to top"
          >
            <Image
              src="/logeeca-logo-light.png"
              alt="Logeeca"
              width={1026}
              height={202}
              className="h-6 sm:h-7 w-auto"
              priority
            />
            <span className="hidden sm:inline-block rounded-full bg-champagne/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-champagne border border-champagne/25">
              Foresight
            </span>
          </a>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-6 text-sm text-lichen font-medium">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="transition-colors duration-200 hover:text-alabaster"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-champagne px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink transition-all duration-300 hover:bg-champagne-light hover:shadow-[0_0_24px_rgba(232,213,181,0.5)] cursor-pointer"
            >
              <span>Book Demo</span>
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            {/* Mobile Burger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-9 place-items-center rounded-full bg-surface-elevated border border-champagne/15 text-alabaster md:hidden hover:bg-surface-elevated/80"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 z-40 rounded-3xl glass-pill p-6 md:hidden text-alabaster border border-champagne/20"
          >
            <ul className="flex flex-col gap-4 text-base font-medium">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-lichen hover:text-champagne transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-4 border-t border-champagne/15">
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-champagne py-3 font-semibold text-ink hover:bg-champagne-light transition-all"
                >
                  <span>Book Private Demo</span>
                  <ArrowRight className="size-4" />
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
