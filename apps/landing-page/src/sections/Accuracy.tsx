import { CountUp } from "@/components/CountUp";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";

const RESULTS = [
  { value: 86, label: "daily accuracy, whole-restaurant total" },
  { value: 91, label: "weekly accuracy, whole-restaurant total" },
];

export function Accuracy() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 lg:grid-cols-2 lg:py-32">
        <Reveal>
          <Eyebrow onDark>Measured, not promised</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Forecasts you can <em className="font-medium text-mint">plan on.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-ink-muted">
            Every new model is tested on days it has never seen, and goes live only when it beats a simple average.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-8">
          {RESULTS.map((result, index) => (
            <Reveal key={result.label} delay={index * 0.15} className="border-t border-white/15 pt-6">
              <p className="font-serif text-6xl font-semibold text-mint sm:text-7xl">
                <CountUp to={result.value} suffix="%" />
              </p>
              <p className="mt-3 text-on-ink-muted">{result.label}*</p>
            </Reveal>
          ))}
          <p className="col-span-2 text-sm text-on-ink-muted">
            *Back-tested on two years of real restaurant sales, on days the model had never seen. Results vary by restaurant.
          </p>
        </div>
      </div>
    </section>
  );
}
