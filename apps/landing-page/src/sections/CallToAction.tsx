import Image from "next/image";
import { DotField } from "@/components/DotField";
import { Reveal } from "@/components/Reveal";
import { contact } from "@/content/site";

const CONTACT_ROWS = [
  { label: "Call", value: contact.phone },
  { label: "Email", value: contact.email },
  { label: "Web", value: contact.website },
];

export function CallToAction() {
  return (
    <section id="contact" className="relative isolate overflow-hidden bg-ink text-white">
      <DotField className="absolute inset-0 -z-10 h-full w-full opacity-50" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 lg:grid-cols-[1.3fr_1fr] lg:py-36">
        <Reveal>
          <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
            See Foresight on <em className="font-medium text-mint">your own sales.</em>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-ink-muted">
            Book a demo: share your past sales, and we will show you tomorrow’s forecast for your kitchen.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <dl className="grid gap-4 rounded-3xl border border-white/15 bg-ink/60 p-8 backdrop-blur-sm">
            {CONTACT_ROWS.map((row) => (
              <div key={row.label} className="flex items-baseline gap-4">
                <dt className="w-14 text-xs font-semibold uppercase tracking-[0.16em] text-mint">{row.label}</dt>
                <dd className="text-lg font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-on-ink-muted">
          <Image src="/logeeca-logo-light.png" alt="Logeeca" width={1026} height={202} className="h-6 w-auto" />
          <p>© 2026 Logeeca · Foresight</p>
        </div>
      </footer>
    </section>
  );
}
