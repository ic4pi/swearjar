import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Play, X, Youtube } from 'lucide-react';
import { useVideos } from '@/hooks/useSiteData';

gsap.registerPlugin(ScrollTrigger);

export function VideoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { videos } = useVideos();
  const safeIndex = videos.length > 0 ? Math.min(activeIndex, videos.length - 1) : 0;

  const selectVideo = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(
        videoContainerRef.current,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      const contentItems = contentRef.current?.querySelectorAll('.animate-item');
      if (contentItems && contentItems.length > 0) {
        scrollTl.fromTo(
          contentItems,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, ease: 'power2.out' },
          0.1
        );
      }

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        videoContainerRef.current,
        { scale: 1, opacity: 1 },
        { scale: 0.9, opacity: 0.3, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        contentRef.current,
        { y: 0, opacity: 1 },
        { y: '-5vh', opacity: 0.3, ease: 'power2.in' },
        0.72
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const featuredVideo = videos[safeIndex];

  return (
    <section
      ref={sectionRef}
      id="video"
      className="section-pinned bg-background flex items-center justify-center z-30"
    >
      {/* Decorative elements */}

      <div className="w-full h-full flex flex-col items-center justify-center px-6 lg:px-16 py-20">
        {/* Content */}
        <div ref={contentRef} className="text-center mb-8 lg:mb-12">
          {/* MEET ZACH text */}
          <div className="animate-item mb-6">
            <h2 className="font-display font-black text-5xl lg:text-7xl tracking-tight">
              <span className="text-white">MEET</span> <span className="text-primary">ZACH</span>
            </h2>
          </div>
          
          <h2 className="animate-item font-display font-black text-4xl lg:text-6xl tracking-tight mb-4">
            WATCH THE <span className="text-primary">SET</span>
          </h2>
          <p className="animate-item text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            A tight 10 about tics, timing, and taking back the narrative.
          </p>
        </div>

        {/* Video Container */}
        <div
          ref={videoContainerRef}
          className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white/10"
        >
          {!featuredVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
              No videos added yet.
            </div>
          ) : !isPlaying ? (
            <>
              {/* Thumbnail */}
              <img
                src={featuredVideo.thumbnail}
                alt={featuredVideo.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-between p-8">
                <div className="flex flex-col items-center justify-center flex-1">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="group relative"
                  >
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
                      <Play className="w-8 h-8 lg:w-10 lg:h-10 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  </button>
                  <p className="mt-6 text-white font-bold text-lg lg:text-xl drop-shadow-lg">
                    {featuredVideo.title}
                  </p>
                </div>

                {/* Bottom text overlay */}
                <div className="w-full text-center">
                  <p className="text-white text-lg lg:text-xl font-bold leading-relaxed drop-shadow-lg">
                    Hello Humans! my name is Zachariah Tippett but, you can call me Tourette&apos;s and I have Tourette&apos;s Syndrome
                    <br />
                    <span className="text-primary hover:underline cursor-pointer" onClick={() => window.open('https://www.google.com/search?q=Zachariah+Tippett', '_blank')}>Google Me</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="relative w-full h-full">
              <iframe
                src={featuredVideo.embedUrl}
                title={featuredVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Playlist - only shown once there's more than one video to pick from */}
        {videos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto mt-6 max-w-4xl w-full pb-1">
            {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
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

        {/* CTA */}
        <div className="mt-8 lg:mt-12">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold"
            onClick={() => window.open('https://youtube.com', '_blank')}
          >
            <Youtube className="w-5 h-5 mr-2" />
            Subscribe on YouTube
          </Button>
        </div>
      </div>
    </section>
  );
}
