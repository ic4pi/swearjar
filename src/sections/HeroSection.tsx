import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useVideos } from '@/hooks/useSiteData';
import { getVideoSource } from '@/utils/videoUtils';
import { aboutMeText } from '@/data/siteData';

gsap.registerPlugin(ScrollTrigger);

// Hero keeps its own playlist small - realistically 1-2 videos, 3 at most.
// Managed from the dashboard's Videos tab.
const HERO_MAX_VIDEOS = 3;

// Just the opener, to tease the full bio further down the page.
const heroBioIntro = aboutMeText.split('\n\n').slice(0, 2);

// Unmuting jumps past the silent lead-in to where he says "what's good
// everybody" - the muted ambient loop still plays from 0:00.
const HERO_VIDEO_UNMUTE_START = 3;

/**
 * Full-screen video hero. A self-hosted clip autoplays muted as a moving,
 * full-bleed backdrop; a YouTube-embedded one shows its poster with a play
 * button instead (YouTube's own chrome can't be forced silent across
 * browsers, so it only loads once someone actually presses play — same
 * rule the site has always used). Giant display type reveals character by
 * character, the video drifts with parallax on scroll.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const videoWrap = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videos } = useVideos();

  const heroVideos = videos.slice(0, HERO_MAX_VIDEOS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const safeIndex = heroVideos.length > 0 ? Math.min(activeIndex, heroVideos.length - 1) : 0;
  const heroVideo = heroVideos[safeIndex];
  const source = getVideoSource(heroVideo);

  const selectVideo = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
    setMuted(true);
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      // Unmuting during the silent lead-in leaves playback right where it
      // is. Unmuting after the line has already started (or already
      // passed, e.g. on a later loop) jumps back to its start, so sound
      // never comes in mid-sentence - but never further back than that.
      if (v.currentTime >= HERO_VIDEO_UNMUTE_START) {
        v.currentTime = HERO_VIDEO_UNMUTE_START;
      }
      v.muted = false;
      v.play().catch(() => {});
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v && source.kind === 'file') {
      v.muted = true;
      v.play().catch(() => {});
    }
  }, [source.kind === 'file' ? source.url : null]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-char',
        { yPercent: 110, opacity: 0, filter: 'blur(12px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power4.out',
          stagger: 0.035,
          delay: 0.25,
        }
      );
      gsap.fromTo(
        '.hero-fade',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 1 }
      );
      gsap.to('.hero-squiggle', {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: 'power2.inOut',
        delay: 1.4,
      });
      gsap.to(videoWrap.current, {
        yPercent: 18,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-content', {
        yPercent: -22,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '70% top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const name = 'ZACHARIAH TIPPETT';

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={root} id="top" className="relative flex h-[100svh] items-end overflow-hidden">
      {/* Video backdrop — full-bleed, always in motion */}
      <div ref={videoWrap} className="absolute inset-0 will-change-transform bg-[#141415]">
        {source.kind === 'file' ? (
          <video
            ref={videoRef}
            key={source.url}
            className="absolute inset-0 h-full w-full object-cover"
            src={source.url}
            poster={heroVideo?.thumbnail}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : source.kind === 'youtube' && isPlaying ? (
          <iframe
            key={source.id}
            src={`https://www.youtube.com/embed/${source.id}?autoplay=1&playsinline=1`}
            title={heroVideo?.title || 'Stand-up clip'}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <>
            <img
              src={heroVideo?.thumbnail || '/video_reel.jpg'}
              alt={heroVideo?.title || 'Stand-up clip'}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {source.kind === 'youtube' && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center"
                aria-label="Play video"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-teal bg-[#0a0a0b]/70 transition-transform hover:scale-110 md:h-24 md:w-24">
                  <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 text-teal" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/45 to-[#0a0a0b]/55" />
      </div>

      {/* Sound toggle — pinned to the video's corner, outside the parallax
          wrapper so it doesn't drift on scroll. Self-hosted clips only;
          unmuting restarts from the top. */}
      {source.kind === 'file' && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Unmute video (restarts from the beginning)' : 'Mute video'}
          className="absolute right-5 top-20 z-20 flex h-10 w-10 items-center justify-center border-2 border-white/25 bg-[#0a0a0b]/60 text-white/85 backdrop-blur-sm transition-colors hover:border-teal hover:text-teal md:right-10 md:top-24"
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
        </button>
      )}

      {/* Content */}
      <div className="hero-content relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
        <p className="hero-fade mb-3 font-hand text-2xl text-teal md:text-3xl">
          stand-up comic · tourette's advocate
        </p>

        <h1 className="display-xl overflow-hidden" aria-label={name}>
          {name.split('').map((ch, i) =>
            ch === ' ' ? (
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
            className="hero-squiggle squiggle-path"
            d="M4 14 C 60 4, 110 22, 165 12 S 285 4, 330 14 S 400 10, 416 12"
            fill="none"
            stroke="#42c8e3"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        <div className="hero-fade mt-6 max-w-2xl space-y-3 text-sm leading-relaxed text-white/70 md:text-base">
          {heroBioIntro.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <button
            onClick={scrollToAbout}
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-teal hover:underline"
          >
            Read More
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 4v16m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>


        {/* Playlist — only shows once the dashboard has more than one video */}
        {heroVideos.length > 1 && (
          <div className="hero-fade mt-6 flex gap-2.5">
            {heroVideos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => selectVideo(i)}
                className={`h-12 w-20 shrink-0 overflow-hidden border-2 transition-colors md:h-14 md:w-24 ${
                  i === safeIndex ? 'border-teal' : 'border-white/25 hover:border-white/50'
                }`}
                aria-label={v.title}
              >
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

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
