import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WatermarkBackground } from '@/components/WatermarkBackground';
import { CustomCursor } from '@/components/CustomCursor';
import { Navigation } from '@/components/Navigation';
import { Marquee } from '@/components/Marquee';
import { DonateModal, ContactModal } from '@/components/Modals';
import {
  HeroSection,
  ShowsSection,
  AboutSection,
  AboutStatsSection,
  CtaSection,
  ProductsSection,
  PhotosSection,
  Footer,
} from '@/sections';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [donateOpen, setDonateOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Lenis smooth scroll, synced to GSAP's ticker. Scroll velocity is
  // published globally so the marquee ribbons react to it.
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09 });
    (window as unknown as { __scrollVelocity: number }).__scrollVelocity = 0;
    lenis.on('scroll', (e: { velocity: number }) => {
      (window as unknown as { __scrollVelocity: number }).__scrollVelocity = e.velocity;
      ScrollTrigger.update();
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  // Ctrl+Shift+D still opens the dashboard, same shortcut as before —
  // it's now a real route instead of a modal.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        window.location.href = '/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen">
      <WatermarkBackground />
      <CustomCursor />
      <Navigation onDonate={() => setDonateOpen(true)} />

      <main className="relative z-10">
        <HeroSection />

        <Marquee
          items={['Tic Happens', 'Same Brain. Different Day.', 'More Awareness. Less Stigma.', 'Ha Ha Ha']}
          textClassName="text-3xl md:text-5xl text-white/85"
        />

        <ShowsSection />

        <Marquee
          items={['1 in 100', "It's not just a bad habit", 'Laugh · Learn · Support']}
          reverse
          textClassName="text-2xl md:text-4xl text-teal/80"
        />

        <AboutSection />
        <ProductsSection />
        <AboutStatsSection />
        <CtaSection onDonate={() => setDonateOpen(true)} onContact={() => setContactOpen(true)} />

        <Marquee
          items={['Tics & Jokes', 'Real People. Real Tics. Still Funny.', "Tourette's Awareness"]}
          textClassName="text-2xl md:text-4xl text-white/70"
        />

        <PhotosSection />
        <Footer />
      </main>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
