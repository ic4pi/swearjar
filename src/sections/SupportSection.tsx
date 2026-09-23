import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Heart, Coffee, ExternalLink } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteData';

gsap.registerPlugin(ScrollTrigger);

interface SupportSectionProps {
  onDonateClick?: () => void;
}

export function SupportSection({ onDonateClick: _onDonateClick }: SupportSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings } = useSiteSettings();
  const cashAppTag = settings.cashAppTag;

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="support"
      className="relative watermark-bg py-16 lg:py-20 z-20"
      style={{ '--wm-pos': 'center 65%' } as React.CSSProperties}
    >
      <div className="w-full px-6 lg:px-16 max-w-4xl mx-auto relative">
        {/* Content */}
        <div ref={contentRef} className="text-center space-y-8 relative z-10 p-8">
          {/* Header */}
          <div className="animate-item">
            <h2 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-4">
              SUPPORT <span className="text-primary">ZACH</span>
            </h2>
          </div>

          {/* Donation Options */}
          <div className="animate-item grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* What Donation Is For */}
            <div className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-all">
              <h3 className="font-bold text-lg mb-3">What Your Support Does</h3>
              <p className="text-muted-foreground">
                Your donations help fund tours, create content, and spread awareness about Tourette's Syndrome through comedy.
              </p>
            </div>

            {/* Cash App Donation */}
            <div className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Donate Now</h3>
                  <p className="text-sm text-muted-foreground">Cash App</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Quick and easy. Every dollar makes a difference.
              </p>
              <a
                href={`https://cash.app/${cashAppTag}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full inline-flex justify-center"
              >
                <Heart className="w-5 h-5 mr-2" />
                Donate {cashAppTag}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
