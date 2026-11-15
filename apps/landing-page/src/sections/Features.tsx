import { Eyebrow } from "@/components/Eyebrow";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { features } from "@/content/site";

export function Features() {
  return (
    <section id="features" className="bg-tint">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 lg:grid-cols-[0.85fr_1.15fr] lg:py-36">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <Eyebrow>The solution</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Five features. <em className="font-medium text-teal">One answer</em> to each problem.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-body">
              Logeeca Foresight replaces the nightly guess with a plan. Each feature answers one of the problems above.
            </p>
          </Reveal>
        </div>

        <div className="flex flex-col gap-6">
          {features.map((feature, index) => (
            <Reveal key={feature.title}>
              <article className="rounded-3xl bg-white p-8 ring-1 ring-hairline transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(11,33,41,0.10)]">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-tint text-teal">
                    <Icon name={feature.icon} className="size-6" />
                  </span>
                  <span className="font-serif text-xl italic text-mint-deep">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif text-2xl font-semibold">{feature.title}</h3>
                </div>
                <p className="mt-4 text-sm">
                  <span className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal">Solves</span>
                  <span className="font-serif text-base italic text-muted">{feature.solves}</span>
                </p>
                <p className="mt-3 leading-relaxed text-body">{feature.text}</p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {feature.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-center gap-2 text-sm font-semibold text-teal">
                      <Icon name="check" className="size-4 text-mint-deep" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
