import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aboutMeText } from '@/data/siteData';

gsap.registerPlugin(ScrollTrigger);

export function AboutSection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-polaroid',
        { opacity: 0, y: 80, rotate: 8 },
        {
          opacity: 1,
          y: 0,
          rotate: 3,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-polaroid', start: 'top 85%' },
        }
      );
      gsap.utils.toArray<HTMLElement>('.about-line').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="about" className="relative z-10 mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
      <div className="mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-hand text-2xl text-teal md:text-3xl">hello humans!</p>
          <h2 className="display-lg">
            Same brain.<br />
            <span className="outline-text">Different day.</span>
          </h2>
        </div>
        <span className="hidden font-display text-7xl text-white/10 md:block">02</span>
      </div>

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
        {/* Polaroid */}
        <div className="lg:col-span-4">
          <div className="about-polaroid polaroid mx-auto max-w-sm will-change-transform lg:sticky lg:top-32">
            <span className="tape" />
            <img src="/assets/hero_polaroid.jpg" alt="Zachariah Tippett on stage" />
            <p className="mt-3 text-center font-hand text-2xl text-[#1a1a1a]">you can call me Tourette's</p>
          </div>
        </div>

        {/* Bio */}
        <div className="lg:col-span-8">
          {aboutMeText.split('\n\n').map((para, i) => (
            <p key={i} className="about-line mb-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
