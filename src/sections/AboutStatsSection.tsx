import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { big: '1 in 100', small: "school-aged kids have Tourette's Syndrome" },
  { big: '~10%', small: "of people with TS swear — it's not the punchline you think" },
  { big: '1', small: 'laugh at a time. That\'s how awareness spreads' },
];

export function AboutStatsSection() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.stat-block').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.92 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: i * 0.12,
            ease: 'back.out(1.4)',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative z-10 mx-auto max-w-[1600px] px-5 pb-24 md:px-10 md:pb-36">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.big} className="stat-block border-2 border-white/15 p-6 transition-colors duration-300 hover:border-teal/60">
            <div className="font-display text-4xl text-teal md:text-5xl">{s.big}</div>
            <p className="mt-3 text-sm leading-snug text-white/65">{s.small}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
