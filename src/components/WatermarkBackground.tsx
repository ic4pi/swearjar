import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The "Tic Happens" doodle wall as a fixed, low-opacity site background,
 * with a slow scroll-linked parallax drift and a film grain overlay.
 */
export function WatermarkBackground() {
  const layerA = useRef<HTMLDivElement>(null);
  const layerB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(layerA.current, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 1.2 },
      });
      gsap.to(layerB.current, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 1.6 },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {/* Primary layer — tall 9:16 wall, centered */}
        <div
          ref={layerA}
          className="absolute -inset-y-[12%] inset-x-0 opacity-[0.07]"
          style={{
            backgroundImage: "url(/assets/tic-happens-watermark.png)",
            backgroundSize: "min(78vh, 100vw) auto",
            backgroundPosition: "center top",
            backgroundRepeat: "repeat-y",
          }}
        />
        {/* Secondary layer — zoomed crop drifting the other way for depth */}
        <div
          ref={layerB}
          className="absolute -inset-y-[10%] inset-x-0 opacity-[0.045]"
          style={{
            backgroundImage: "url(/assets/tic-happens-watermark.png)",
            backgroundSize: "min(130vh, 170vw) auto",
            backgroundPosition: "center 40%",
            backgroundRepeat: "repeat-y",
          }}
        />
        {/* Vignette so content always reads */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,11,0.72)_100%)]" />
      </div>
      <div className="grain-overlay" aria-hidden />
    </>
  );
}
