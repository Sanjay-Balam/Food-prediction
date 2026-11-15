import { CountUp } from "@/components/CountUp";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { problems } from "@/content/site";

export function Problem() {
  return (
    <section id="problem" className="mx-auto max-w-6xl px-6 py-28 lg:py-36">
      <Reveal>
        <Eyebrow>The problem</Eyebrow>
        <h2 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Every kitchen runs on <em className="font-medium text-teal">a guess.</em>
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Reveal delay={0.1}>
          <p className="text-lg leading-relaxed text-body">
            Every night, someone decides how much biryani to cook, how much mutton to order and how many naans to prep — from
            memory and yesterday’s numbers. Guess high and good food is thrown away. Guess low and guests hear “sold out”.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="font-serif text-5xl font-semibold text-teal">
            <CountUp to={290} suffix=" million" />
          </p>
          <p className="mt-3 text-body">tonnes of food were wasted by restaurants and other food service worldwide in 2022.</p>
          <p className="mt-2 text-sm text-muted">Source: UNEP Food Waste Index Report 2024</p>
        </Reveal>
      </div>

      <ol className="mt-16 border-t border-hairline">
        {problems.map((problem, index) => (
          <li key={problem.title} className="border-b border-hairline">
            <Reveal delay={index * 0.05} className="grid gap-2 py-7 sm:grid-cols-[80px_1fr]">
              <span className="font-serif text-2xl italic text-mint-deep">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-serif text-2xl font-semibold">{problem.title}</h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-body">{problem.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
