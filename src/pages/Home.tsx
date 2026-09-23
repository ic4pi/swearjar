import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Navigation } from "@/components/Navigation";
import { CustomCursor } from "@/components/CustomCursor";
import { WatermarkBackground } from "@/components/WatermarkBackground";
import { HeroSection } from "@/sections/HeroSection";
import { ShowsSection } from "@/sections/ShowsSection";
import { AboutSection } from "@/sections/AboutSection";
import { ProductsSection } from "@/sections/ProductsSection";
import { CtaSection } from "@/sections/CtaSection";
import { Footer } from "@/sections/Footer";
import { Marquee } from "@/components/Marquee";
import { DonateModal, ContactModal } from "@/components/Modals";

gsap.registerPlugin(ScrollTrigger);

const RIBBON = ["tic happens", "1 in 100", "laugh loudly", "tourette's awareness", "100% funny", "only ~10% swear", "be kind"];

export default function Home() {
  const [donateOpen, setDonateOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenisRef.current = lenis;

    lenis.on("scroll", (e: any) => {
      (window as any).__scrollVelocity = e.velocity ?? 0;
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <CustomCursor />
      <WatermarkBackground />
      <Navigation onDonate={() => setDonateOpen(true)} />

      <main className="relative z-10">
        <HeroSection />

        <Marquee items={RIBBON} className="bg-[#0a0a0b] font-display text-2xl md:text-4xl" />

        <div id="shows">
          <ShowsSection />
        </div>

        <AboutSection />

        <Marquee items={RIBBON} reverse className="border-t-0 bg-[#0a0a0b] font-display text-2xl md:text-4xl" />

        <div id="merch">
          <ProductsSection />
        </div>

        <div id="contact">
          <CtaSection onDonate={() => setDonateOpen(true)} onContact={() => setContactOpen(true)} />
        </div>
      </main>

      <Footer />

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
