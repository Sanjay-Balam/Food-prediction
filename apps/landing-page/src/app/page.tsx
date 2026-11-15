import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Hero } from "@/sections/Hero";
import { Manifesto } from "@/sections/Manifesto";
import { Problem } from "@/sections/Problem";
import { AppleMaestroScroller } from "@/components/AppleMaestroScroller";
import { AppleHorizontalReel } from "@/components/AppleHorizontalReel";
import { LiveForecastCockpit } from "@/components/LiveForecastCockpit";
import { Features } from "@/sections/Features";
import { ParallaxPhotoRow } from "@/components/ParallaxPhotoRow";
import { Accuracy } from "@/sections/Accuracy";
import { WhyUs } from "@/sections/WhyUs";
import { Testimonials } from "@/sections/Testimonials";
import { FAQ } from "@/sections/FAQ";
import { CallToAction } from "@/sections/CallToAction";

export default function Home() {
  return (
    <>
      <FloatingNavbar />
      <main>
        <Hero />
        <Manifesto />
        <Problem />
        {/* Pinned Apple India x MaestroClass Lenis Scrollytelling Experience */}
        <AppleMaestroScroller />
        {/* Apple Horizontal Pinned Reel */}
        <AppleHorizontalReel />
        {/* Live Interactive Simulator */}
        <LiveForecastCockpit />
        <Features />
        <ParallaxPhotoRow />
        <Accuracy />
        <WhyUs />
        <Testimonials />
        <FAQ />
        <CallToAction />
      </main>
    </>
  );
}
