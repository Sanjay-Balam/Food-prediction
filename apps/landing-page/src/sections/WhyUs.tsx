import { Reveal } from "@/components/Reveal";
import { reasons } from "@/content/site";

export function WhyUs() {
  return (
    <section className="bg-tint">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-3">
        {reasons.map((reason, index) => (
          <Reveal key={reason.title} delay={index * 0.1} className="border-t border-teal/20 pt-6">
            <h3 className="font-serif text-2xl font-semibold text-teal">{reason.title}</h3>
            <p className="mt-3 leading-relaxed text-body">{reason.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
