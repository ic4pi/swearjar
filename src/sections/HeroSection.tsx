import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trpc } from "@/providers/trpc";
import { FALLBACK_SETTINGS } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_VIDEO = "/video/zach-kill-tony.mp4";
const DEFAULT_POSTER = "/video/zach-kill-tony-poster.jpg";

/**
 * Full-screen video hero. Streams Zach's Kill Tony clip as a moving,
 * full-bleed backdrop (object-fit cover — always the whole frame,
 * never a freeze-frame close-up). The URL comes from the dashboard
 * (Settings → Hero video URL). Giant display type reveals character by
 * character, the video drifts with parallax on scroll.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const videoWrap = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data } = trpc.site.publicSettings.useQuery(undefined, { retry: 1 });
  const settings = { ...FALLBACK_SETTINGS, ...(data ?? {}) };

  const videoUrl = settings.heroVideoUrl?.trim() || DEFAULT_VIDEO;
  const isLocal = videoUrl.startsWith("/");
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      // Unmuting is a deliberate gesture — restart the clip from the top
      // so the audio lands from the beginning, not mid-sentence.
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => {});
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  };

  // Keep the video actually playing even if autoplay gets blocked
  // or a later render leaves it paused.
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }
  }, [videoUrl]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-char",
        { yPercent: 110, opacity: 0, filter: "blur(12px)" },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.035,
          delay: 0.25,
        }
      );
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 1 }
      );
      gsap.to(".squiggle-path", {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: "power2.inOut",
        delay: 1.4,
      });
      gsap.to(videoWrap.current, {
        yPercent: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-content", {
        yPercent: -22,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const name = "ZACHARIAH TIPPETT";

  return (
    <section ref={root} id="top" className="relative flex h-[100svh] items-end overflow-hidden">
      {/* Video backdrop — full-bleed, always in motion */}
      <div ref={videoWrap} className="absolute inset-0 will-change-transform">
        <video
          ref={videoRef}
          key={videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          poster={isLocal ? DEFAULT_POSTER : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/45 to-[#0a0a0b]/55" />
      </div>

      {/* Content */}
      <div className="hero-content relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
        <p className="hero-fade mb-3 font-hand text-2xl text-teal md:text-3xl">
          stand-up comic · tourette's advocate
        </p>

        <h1 className="display-xl overflow-hidden" aria-label={name}>
          {name.split("").map((ch, i) =>
            ch === " " ? (
              <span key={i} className="inline-block w-[0.35em]" />
            ) : (
              <span key={i} className="hero-char inline-block will-change-transform" aria-hidden>
                {ch}
              </span>
            )
          )}
        </h1>

        <svg viewBox="0 0 420 24" className="mt-2 h-6 w-64 md:w-96" aria-hidden>
          <path
            className="squiggle-path"
            d="M4 14 C 60 4, 110 22, 165 12 S 285 4, 330 14 S 400 10, 416 12"
            fill="none"
            stroke="#42c8e3"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-4">
          <span className="hero-fade border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 md:text-sm">
            1 in 100 kids have TS
          </span>
          <span className="hero-fade border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 md:text-sm">
            Only ~10% swear
          </span>
          <span className="hero-fade border-2 border-teal/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal md:text-sm">
            100% funny
          </span>
        </div>
      </div>

      {/* Sound toggle — unmuting restarts the clip from the top */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Unmute video (restarts from the beginning)" : "Mute video"}
        className="hero-fade group absolute bottom-6 left-5 z-10 flex items-center gap-2.5 border-2 border-white/25 bg-[#0a0a0b]/60 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm transition-colors hover:border-teal hover:text-teal md:left-10"
      >
        {muted ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinejoin="round" />
            <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinejoin="round" />
            <path d="M15.5 8.5a5 5 0 010 7M18.5 6a9 9 0 010 12" strokeLinecap="round" />
          </svg>
        )}
        <span>{muted ? "Sound on" : "Mute"}</span>
      </button>

      {/* Scroll cue */}
      <div className="hero-fade absolute bottom-6 right-6 z-10 hidden md:flex flex-col items-center gap-2 text-white/60">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] [writing-mode:vertical-lr]">scroll</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
