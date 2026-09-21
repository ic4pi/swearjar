import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, ExternalLink, ChevronDown, Calendar, MapPin } from 'lucide-react';
import { useVideos, useShows } from '@/hooks/useSiteData';
import { getNextThreeShows } from '@/utils/showUtils';
import { getVideoSource } from '@/utils/videoUtils';

gsap.registerPlugin(ScrollTrigger);

// Hero keeps its own playlist small - realistically 1-2 videos, 3 at most.
// The full list lives further down the page in "Watch the Set".
const HERO_MAX_VIDEOS = 3;

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoGalleryRef = useRef<HTMLDivElement>(null);
  const blurbRef = useRef<HTMLDivElement>(null);
  // A YouTube iframe used as an ambient background shows its own title/
  // controls/logo no matter what params are passed - controls=0 isn't
  // reliably honored on mobile - so a YouTube video only plays once
  // someone actually presses play, and its own chrome is then expected.
  // A self-hosted file has no such problem and autoplays muted+looped
  // straight away, same as any other ambient background video.
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const { videos } = useVideos();
  const { shows } = useShows();
  const nextTwoShows = getNextThreeShows(shows).slice(0, 2);

  const heroVideos = videos.slice(0, HERO_MAX_VIDEOS);
  const safeIndex = heroVideos.length > 0 ? Math.min(activeVideoIndex, heroVideos.length - 1) : 0;
  const heroVideo = heroVideos[safeIndex];
  const heroSource = getVideoSource(heroVideo);
  const heroEmbedSrc = heroSource.kind === 'youtube' ? `https://www.youtube.com/embed/${heroSource.id}?autoplay=1&playsinline=1` : null;

  const selectVideo = (index: number) => {
    setActiveVideoIndex(index);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Initial load animation
      const loadTl = gsap.timeline({ delay: 0.2 });

      // Video gallery entrance
      loadTl.fromTo(
        videoGalleryRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );

      // Blurb entrance
      loadTl.fromTo(
        blurbRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%', // Increased from 130% to accommodate sneak peek
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%): Hold position (already animated on load)
      // SETTLE (30-70%): Static
      // EXIT (70-100%): Elements exit

      scrollTl.fromTo(
        videoGalleryRef.current,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0.3, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        blurbRef.current,
        { y: 0, opacity: 1 },
        { y: '5vh', opacity: 0.3, ease: 'power2.in' },
        0.72
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section-pinned bg-background flex flex-col z-10"
    >
      {/* Watermark - fills the whole hero, including the empty space above the video */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: 'url(/tic-happens-watermark.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 lg:px-8 py-12 lg:py-16">

        {/* Headline */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight leading-none drop-shadow-lg">
            <span className="text-white">MEET</span> <span className="text-primary">ZACHARIAH TIPPETT</span>
          </h1>
        </div>

        {/* Video Gallery - Main Feature */}
        <div
          ref={videoGalleryRef}
          className="relative w-full max-w-5xl mb-4"
        >
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black">
            {heroSource.kind === 'file' ? (
              <video
                key={heroSource.url}
                autoPlay
                muted
                loop
                playsInline
                poster={heroVideo?.thumbnail}
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={heroSource.url} type="video/mp4" />
              </video>
            ) : isPlaying && heroEmbedSrc ? (
              <iframe
                key={heroSource.kind === 'youtube' ? heroSource.id : undefined}
                src={heroEmbedSrc}
                title={heroVideo?.title || 'Stand-up clip'}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <>
                <img
                  src={heroVideo?.thumbnail || '/video_reel.jpg'}
                  alt={heroVideo?.title || 'Stand-up clip'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {heroSource.kind === 'youtube' && (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                    aria-label="Play video"
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
                      <Play className="w-8 h-8 lg:w-10 lg:h-10 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Small playlist - hero stays capped at HERO_MAX_VIDEOS; the full
              list is further down the page in "Watch the Set". */}
          {heroVideos.length > 1 && (
            <div className="flex justify-center gap-3 mt-4">
              {heroVideos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => selectVideo(index)}
                  className={`shrink-0 w-24 sm:w-28 text-left rounded-lg overflow-hidden border-2 transition-colors ${
                    index === safeIndex ? 'border-primary' : 'border-transparent hover:border-border'
                  }`}
                >
                  <div className="aspect-video bg-muted">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Intro blurb - sits below the video so nothing covers the footage */}
          <div ref={blurbRef} className="max-w-3xl mx-auto mt-6 text-center">
            <p className="text-foreground text-base sm:text-lg lg:text-xl font-bold leading-relaxed mb-3">
              Hello Humans! my name is Zachariah Tippett but, you can call me Tourette&apos;s and I have Tourette&apos;s Syndrome
            </p>

            {/* Links Row */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.google.com/search?q=Zachariah+Tippett"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Google Me
              </a>

              <span className="text-muted-foreground">|</span>

              <button
                onClick={scrollToAbout}
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
              >
                Read More
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upcoming shows - 2 widgets, responsive positioning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-w-2xl mx-auto">
            {nextTwoShows.map((show) => (
              <a
                key={show.id}
                href={show.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{show.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {show.venue}
                  </h4>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{show.location}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
