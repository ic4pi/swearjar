import { useEffect, useRef } from "react";

type MarqueeProps = {
  items: string[];
  reverse?: boolean;
  className?: string;
  textClassName?: string;
};

/**
 * Infinite marquee ribbon with hand-drawn separators. Subscribes to the
 * global scroll velocity (set by Lenis in Home) — the faster you scroll,
 * the faster the ribbon runs. Idle, it just cruises.
 */
export function Marquee({ items, reverse = false, className = "", textClassName = "" }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let pos = 0;
    const baseSpeed = reverse ? -0.6 : 0.6;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const velocity = (window as unknown as { __scrollVelocity?: number }).__scrollVelocity ?? 0;
      const boost = Math.min(Math.abs(velocity) / 12, 6);
      const dir = velocity < -0.5 ? -1 : velocity > 0.5 ? 1 : reverse ? -1 : 1;
      pos -= dir * (Math.abs(baseSpeed) + boost) * (dt / 16.7);
      const half = track.scrollWidth / 2;
      if (half > 0) {
        if (pos <= -half) pos += half;
        if (pos > 0) pos -= half;
      }
      track.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className={`whitespace-nowrap px-6 font-display uppercase ${textClassName}`}>{item}</span>
          <svg viewBox="0 0 24 24" className="h-[0.5em] w-[0.5em] shrink-0 text-teal" fill="currentColor" aria-hidden>
            <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0Z" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`relative overflow-hidden border-y-2 border-white/15 py-4 ${className}`} aria-hidden>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
