import { Accuracy } from "@/sections/Accuracy";
import { CallToAction } from "@/sections/CallToAction";
import { Features } from "@/sections/Features";
import { Hero } from "@/sections/Hero";
import { HowItWorks } from "@/sections/HowItWorks";
import { Navbar } from "@/sections/Navbar";
import { Problem } from "@/sections/Problem";
import { WhyUs } from "@/sections/WhyUs";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Accuracy />
        <HowItWorks />
        <WhyUs />
        <CallToAction />
      </main>
    </>
  );
}
