import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useShows } from '@/hooks/useSiteData';
import { getUpcomingShows } from '@/utils/showUtils';
import { RollButton } from '@/components/RollButton';
import type { Show } from '@/types';

gsap.registerPlugin(ScrollTrigger);

function isRecurring(date: string) {
  return /^(mon|tue|wed|thu|fri|sat|sun)/i.test(date.trim());
}

function ShowListing({ show, featured }: { show: Show; featured: boolean }) {
  const recurring = isRecurring(show.date);
  const hasLink = show.link && show.link !== '#';

  return (
    <div className="show-row brutal-row group grid grid-cols-1 gap-3 px-2 py-6 md:grid-cols-12 md:items-center md:gap-6 md:px-6 md:py-8">
      <div className="md:col-span-4">
        <div className={`font-display uppercase leading-none ${featured ? 'text-3xl text-teal md:text-5xl' : 'text-2xl md:text-3xl'}`}>
          {show.date}
        </div>
        {recurring && (
          <span className="mt-1 inline-block font-hand text-lg text-white/60">every week</span>
        )}
      </div>
      <div className="md:col-span-5">
        <div className={`font-bold uppercase tracking-wide ${featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          {show.venue}
        </div>
        <div className="text-sm uppercase tracking-[0.2em] text-white/55">{show.location}</div>
      </div>
      <div className="md:col-span-3 md:text-right">
        {hasLink ? (
          <a
            href={show.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-2 border-teal px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-teal transition-colors duration-300 group-hover:bg-teal group-hover:text-[#0a0a0b]"
          >
            Tickets
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : (
          <span className="inline-block border-2 border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Details soon
          </span>
        )}
      </div>
    </div>
  );
}

export function ShowsSection() {
  const root = useRef<HTMLElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { shows: allShows } = useShows();
  const shows = getUpcomingShows(allShows);
  const nextTwo = shows.slice(0, 2);
  const rest = shows.slice(2);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.show-row').forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [shows.length]);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      const el = extraRef.current;
      if (el) {
        if (next) {
          gsap.set(el, { height: 'auto' });
          gsap.from(el, { height: 0, duration: 0.6, ease: 'expo.inOut' });
        } else {
          gsap.to(el, { height: 0, duration: 0.5, ease: 'expo.inOut' });
        }
      }
      return next;
    });
  };

  return (
    <section ref={root} id="shows" className="relative z-10 mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
      <div className="mb-4 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-hand text-2xl text-teal md:text-3xl">come laugh. learn something.</p>
          <h2 className="display-lg">
            Next <span className="outline-text-teal">Shows</span>
          </h2>
        </div>
        <span className="hidden font-display text-7xl text-white/10 md:block">01</span>
      </div>

      {shows.length === 0 ? (
        <div className="border-2 border-dashed border-white/20 p-12 text-center">
          <p className="font-display text-2xl uppercase text-white/60">New dates brewing</p>
          <p className="mt-2 font-hand text-xl text-teal">check back soon — or book him below</p>
        </div>
      ) : (
        <>
          <div>
            {nextTwo.map((s) => (
              <ShowListing key={s.id} show={s} featured />
            ))}
          </div>

          {rest.length > 0 && (
            <>
              <div ref={extraRef} className="overflow-hidden" style={{ height: 0 }}>
                {rest.map((s) => (
                  <ShowListing key={s.id} show={s} featured={false} />
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <RollButton variant="outline" onClick={toggle}>
                  {expanded ? 'Hide the rest' : `See all ${shows.length} shows`}
                </RollButton>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
