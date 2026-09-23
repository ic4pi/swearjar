import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RollButton } from '@/components/RollButton';

gsap.registerPlugin(ScrollTrigger);

/**
 * The support band — donate + get-in-touch, side by side on a teal field
 * that slides in as you scroll into it.
 */
export function CtaSection({ onDonate, onContact }: { onDonate: () => void; onContact: () => void }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-panel',
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="contact" className="relative z-10 px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donate */}
        <div className="cta-panel relative overflow-hidden border-2 border-teal bg-teal p-10 text-[#0a0a0b] md:p-14">
          <svg viewBox="0 0 24 24" className="absolute -right-8 -top-8 h-48 w-48 text-[#0a0a0b]/10" fill="currentColor" aria-hidden>
            <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0Z" />
          </svg>
          <p className="font-hand text-3xl">more awareness. less stigma.</p>
          <h3 className="display-lg mt-2">Fuel the mission</h3>
          <p className="mt-4 max-w-md font-medium leading-relaxed text-[#0a0a0b]/75">
            Every show, every design, every conversation about Tourette's — donations keep it all moving.
          </p>
          <div className="mt-8">
            <RollButton onClick={onDonate} variant="outline" className="!border-[#0a0a0b] !text-[#0a0a0b] hover:!text-[#155e6e] hover:!border-[#155e6e]">
              Donate
            </RollButton>
          </div>
        </div>

        {/* Contact */}
        <div className="cta-panel border-2 border-white/20 p-10 md:p-14">
          <p className="font-hand text-3xl text-teal">say hi. book a show.</p>
          <h3 className="display-lg mt-2">Get in touch</h3>
          <p className="mt-4 max-w-md leading-relaxed text-white/65">
            General questions or booking — clubs, colleges, events. Two lanes, one click.
          </p>
          <div className="mt-8">
            <RollButton onClick={onContact} variant="outline">
              Open the lines
            </RollButton>
          </div>
        </div>
      </div>
    </section>
  );
}
