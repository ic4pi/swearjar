import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, MapPin, ExternalLink, Mic2 } from 'lucide-react';
import { useShows } from '@/hooks/useSiteData';
import { getNextThreeShows, getFilteredShows } from '@/utils/showUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  onDonateClick: () => void;
  onBookClick: () => void;
}

export function AboutSection({ onBookClick }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showsRef = useRef<HTMLDivElement>(null);
  const [showAllShows, setShowAllShows] = useState(false);
  const { shows } = useShows();
  const nextThreeShows = getNextThreeShows(shows);
  const allShows = getFilteredShows(shows);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Content animation
      const contentItems = contentRef.current?.querySelectorAll('.animate-item');
      if (contentItems && contentItems.length > 0) {
        gsap.fromTo(
          contentItems,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: contentRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Shows animation
      const showItems = showsRef.current?.querySelectorAll('.show-item');
      if (showItems && showItems.length > 0) {
        gsap.fromTo(
          showItems,
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: showsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative min-h-screen watermark-bg py-20 lg:py-32 z-20"
      style={{ '--wm-pos': 'center 22%' } as React.CSSProperties}
    >

      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto relative">
        {/* Layer 2 - Semi-transparent black background */}
        <div className="absolute inset-0 bg-card/10 rounded-lg" />

        {/* Two Column Layout - Shows and About Info */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 relative z-10 p-8">
          {/* Left Column - Shows List */}
          <div ref={showsRef} id="shows" className="space-y-6">
            <div className="show-item">
              <h3 className="font-display font-black text-2xl lg:text-3xl tracking-tight mb-6">
                UPCOMING <span className="text-primary">SHOWS</span>
              </h3>
            </div>

            {/* Shows List - Only Next 3 Shows */}
            <div className="space-y-4">
              {nextThreeShows.map((show) => (
                <div
                  key={show.id}
                  className="show-item group bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>{show.date}</span>
                      </div>
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {show.venue}
                      </h4>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{show.location}</span>
                      </div>
                    </div>
                    <a
                      href={show.link}
                      className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* See All / Book */}
            <div className="show-item pt-4 flex flex-wrap items-center gap-5">
              <button
                onClick={() => setShowAllShows(true)}
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                See all dates
              </button>
              <button
                onClick={onBookClick}
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                <Mic2 className="w-4 h-4" />
                Book Zach for your venue
              </button>
            </div>
          </div>

          {/* Right Column - Quick About Info */}
          <div className="space-y-6">
            <div className="animate-item">
              <h3 className="font-display font-black text-2xl lg:text-3xl tracking-tight mb-6">
                ABOUT <span className="text-primary">ZACH</span>
              </h3>
            </div>
            
            {/* Quick About Info */}
            <div className="animate-item">
              <div className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-all">
                <p className="text-muted-foreground">
                  Zach "Tourette's" Tippett uses comedy to spread awareness about Tourette's Syndrome while performing stand-up across the country.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAllShows} onOpenChange={setShowAllShows}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-2xl">
              ALL <span className="text-primary">SHOWS</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {allShows.map((show) => (
              <div
                key={show.id}
                className="bg-background border border-border rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{show.date}</span>
                  </div>
                  <h4 className="font-bold text-foreground">{show.venue}</h4>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{show.location}</span>
                  </div>
                </div>
                {show.link && show.link !== '#' && (
                  <a
                    href={show.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
            {allShows.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No shows scheduled right now — check back soon.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
