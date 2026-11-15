import { existsSync } from "node:fs";
import { join } from "node:path";
import { DotField } from "@/components/DotField";
import { ForecastPreview } from "@/components/ForecastPreview";
import { HeroVideo } from "@/components/HeroVideo";
import { Reveal, RevealWords } from "@/components/Reveal";

// Drop the Google Flow video at public/hero.mp4 and it plays behind the hero; until then the dot field shows.
const HAS_VIDEO = existsSync(join(process.cwd(), "public", "hero.mp4"));

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-ink text-white">
      <DotField className="absolute inset-0 -z-20 h-full w-full opacity-70" />
      {HAS_VIDEO && <HeroVideo src="/hero.mp4" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/45" />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-44">
        <div>
          <Reveal>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-serif text-2xl font-semibold text-mint">Foresight</span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-on-ink-muted">Kitchen intelligence platform</span>
            </p>
          </Reveal>
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <RevealWords text="Know tomorrow’s orders" />
            <RevealWords text="tonight." delay={0.3} className="italic font-medium text-mint" />
          </h1>
          <Reveal delay={0.5}>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-on-ink-muted">
              Logeeca Foresight predicts what every dish will sell, keeps your stock in step, cuts waste and protects your
              revenue — so your kitchen plans instead of guessing.
            </p>
          </Reveal>
          <Reveal delay={0.65}>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#contact" className="rounded-full bg-mint px-7 py-3.5 font-semibold text-ink transition hover:bg-white">
                Book a demo
              </a>
              <a href="#how-it-works" className="rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:border-white">
                See how it works
              </a>
            </div>
          </Reveal>
        </div>
        <ForecastPreview />
      </div>
    </section>
  );
}
