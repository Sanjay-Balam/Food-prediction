"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export type PhotoCard = { name: string; photo: string | null };

/** Plain cards until real photos are added: each a different teal, so the row still reads as four pictures. */
const PLAIN_CARD_BACKGROUNDS = [
  "radial-gradient(circle at 25% 15%, #2A8F7C, #0B2129 75%)",
  "radial-gradient(circle at 75% 20%, #5CC2A8, #12695C 45%, #0B2129 90%)",
  "radial-gradient(circle at 30% 85%, #187563, #0B2129 70%)",
  "radial-gradient(circle at 70% 70%, #3FA58D, #12303A 65%)",
];

/** Four portrait cards in a row; the 2nd and 4th rise faster than the others as you scroll (as on MaestroClass). */
export function ParallaxPhotoRow({ cards }: { cards: PhotoCard[] }) {
  const row = useRef<HTMLUListElement>(null);
  const { scrollYProgress } = useScroll({ target: row, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const reduceMotion = useReducedMotion();

  return (
    <ul ref={row} className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {cards.map((card, index) => (
        <motion.li key={card.name} style={index % 2 === 1 && !reduceMotion ? { y: lift } : undefined}
          className="relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10"
        >
          {card.photo ? (
            <Image src={card.photo} alt="" fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: PLAIN_CARD_BACKGROUNDS[index % PLAIN_CARD_BACKGROUNDS.length] }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <p className="absolute inset-x-4 bottom-4 flex items-baseline justify-between text-white">
            <span className="font-serif text-xl font-semibold sm:text-2xl">{card.name}</span>
            <span aria-hidden="true" className="text-mint">✳</span>
          </p>
        </motion.li>
      ))}
    </ul>
  );
}
