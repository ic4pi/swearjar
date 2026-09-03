import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Volume2, VolumeX, ExternalLink, ChevronDown, Calendar, MapPin } from 'lucide-react';
import { useVideos, useShows } from '@/hooks/useSiteData';
import { getNextThreeShows } from '@/utils/showUtils';

gsap.registerPlugin(ScrollTrigger);

// Pulls the video ID out of a "/embed/<id>" YouTube URL for building a
// player URL with our own autoplay/loop/mute params.
function getYouTubeEmbedId(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([^/?]+)/);
  return match ? match[1] : null;
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoGalleryRef = useRef<HTMLDivElement>(null);
  const blurbRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const { videos } = useVideos();
  const { shows } = useShows();
  const nextTwoShows = getNextThreeShows(shows).slice(0, 2);

  // Clamp in case the list shrank (a video was removed) since the index was set.
  const safeIndex = videos.length > 0 ? Math.min(activeVideoIndex, videos.length - 1) : 0;
  const heroVideo = videos[safeIndex];
  const heroVideoId = heroVideo?.embedUrl ? getYouTubeEmbedId(heroVideo.embedUrl) : null;
  const heroEmbedSrc = heroVideoId
    ? `https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`
    : null;

  const postPlayerCommand = (func: 'mute' | 'unMute') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*'
    );
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      postPlayerCommand(prev ? 'mute' : 'unMute');
      return !prev;
    });
  };

  // Every video loads muted (browser autoplay policy); if sound was already
  // on, re-apply unmute once the newly selected video's player is ready.
  const handlePlayerLoad = () => {
    if (soundEnabled) {
      setTimeout(() => postPlayerCommand('unMute'), 300);
    }
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-8 py-12 lg:py-16">
        
        {/* Video Gallery - Main Feature */}
        <div
          ref={videoGalleryRef}
          className="relative w-full max-w-5xl mb-4"
        >
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black">
            {heroEmbedSrc ? (
              <iframe
                ref={iframeRef}
                key={heroVideoId}
                src={heroEmbedSrc}
                title={heroVideo?.title || 'Stand-up clip'}
                className="absolute inset-0 w-full h-full pointer-events-none"
                allow="autoplay; encrypted-media"
                frameBorder="0"
                onLoad={handlePlayerLoad}
              />
            ) : (
              <img
                src={heroVideo?.thumbnail || '/video_reel.jpg'}
                alt={heroVideo?.title || 'Stand-up clip'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Gradient overlay so the bottom text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Bottom Overlay - Intro Blurb */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-20">
              <div className="max-w-3xl">
                <p className="text-white text-lg lg:text-xl font-bold leading-relaxed mb-4">
                  Hello Humans! my name is Zachariah Tippett but, you can call me Tourette&apos;s and I have Tourette&apos;s Syndrome
                </p>
                
                {/* Links Row */}
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="https://www.google.com/search?q=Zachariah+Tippett"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google Me
                  </a>
                  
                  <span className="text-white/40">|</span>
                  
                  <button
                    onClick={scrollToAbout}
                    className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
                  >
                    Read More
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sound Enable Prompt */}
            {!soundEnabled && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <button
                  onClick={toggleSound}
                  className="flex flex-col items-center gap-3 bg-black/70 hover:bg-black/90 px-6 py-4 rounded-xl transition-colors"
                >
                  <Volume2 className="w-8 h-8 text-primary" />
                  <span className="text-white font-semibold text-sm">Tap to Enable Sound</span>
                </button>
              </div>
            )}
          </div>

          {/* Playlist - only shown once there's more than one video to pick from */}
          {videos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto mt-4 pb-1">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideoIndex(index)}
                  className={`shrink-0 w-32 sm:w-36 text-left rounded-lg overflow-hidden border-2 transition-colors ${
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
                  <p className="text-xs font-semibold mt-1 truncate">{video.title}</p>
                </button>
              ))}
            </div>
          )}

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
