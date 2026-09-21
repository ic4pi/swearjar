import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { useShows } from '@/hooks/useSiteData';
import { getNextThreeShows } from '@/utils/showUtils';

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  onDonateClick: () => void;
}

export function AboutSection({ onDonateClick }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showsRef = useRef<HTMLDivElement>(null);
  const { shows } = useShows();
  const nextThreeShows = getNextThreeShows(shows);

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
      className="relative min-h-screen bg-background py-20 lg:py-32 z-20"
    >

      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto relative">
        {/* Layer 2 - Semi-transparent black background */}
        <div className="absolute inset-0 bg-card/10 rounded-lg" />
        
        {/* Watermark behind the shows/about cards */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: 'url(/tic-happens-watermark.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        />
        
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

            {/* See All Link */}
            <div className="show-item pt-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                See all dates
              </a>
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
    </section>
  );
}
