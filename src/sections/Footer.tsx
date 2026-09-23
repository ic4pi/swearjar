import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteSettings } from '@/hooks/useSiteData';
import { TicLogo } from '@/components/TicLogo';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const { settings: s } = useSiteSettings();

  const socials = [
    { label: 'Instagram', url: s.instagramUrl },
    { label: 'TikTok', url: s.tiktokUrl },
    { label: 'YouTube', url: s.youtubeUrl },
    { label: 'Twitch', url: s.twitchUrl },
  ].filter((x) => x.url);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-giant',
        { yPercent: 40, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 40%', scrub: 0.6 },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={root} className="relative z-10 overflow-hidden border-t-2 border-white/15 px-5 pb-10 pt-20 md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <h2 className="footer-giant display-xl text-center">
          Go see <span className="text-teal">a show.</span>
        </h2>

        <div className="mt-16 flex flex-col items-center justify-between gap-8 border-t border-white/10 pt-10 md:flex-row">
          <TicLogo className="h-7" />

          {socials.length > 0 && (
            <nav className="flex gap-6">
              {socials.map((soc) => (
                <a
                  key={soc.label}
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-teal"
                >
                  {soc.label}
                </a>
              ))}
            </nav>
          )}

          <div className="text-center text-xs uppercase tracking-[0.2em] text-white/45 md:text-right">
            <a href={`mailto:${s.contactEmail}`} className="transition-colors hover:text-teal">{s.contactEmail}</a>
            <p className="mt-1">{s.location}</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/30">
          <span>Tic happens. Keep laughing.</span>
          <a href="/admin" className="transition-colors hover:text-teal/70">backstage</a>
        </div>
      </div>
    </footer>
  );
}
