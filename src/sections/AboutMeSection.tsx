import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink, Mail, Heart } from 'lucide-react';
import { shows, aboutMeText, emailAddress, location } from '@/data/siteData';

gsap.registerPlugin(ScrollTrigger);

export function AboutMeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showsRef = useRef<HTMLDivElement>(null);

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
      id="about-me"
      className="relative min-h-screen py-20 lg:py-32 z-20"
    >
      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto relative">
        {/* Layer 2 - Semi-transparent black background */}
        <div className="absolute inset-0 bg-card/10 rounded-lg" />

        {/* Content */}
        <div className="relative z-10 p-8">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16">
          <h2 className="animate-item font-display font-black text-4xl lg:text-5xl tracking-tight mb-4">
            MEET <span className="text-primary">ZACH</span>
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - About Content */}
          <div ref={contentRef} className="space-y-8">
            {/* Widget Box Behind About Content */}
            <div className="bg-card border border-border rounded-xl p-6">
              {/* Intro */}
              <div className="animate-item">
                <p className="text-xl lg:text-2xl font-bold leading-relaxed text-foreground">
                  Hello Humans! my name is Zachariah Tippett but, you can call me Tourette&apos;s and I have Tourette&apos;s Syndrome
                </p>
              </div>

              {/* Google Me Link */}
              <div className="animate-item">
                <a
                  href="https://www.google.com/search?q=Zachariah+Tippett"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Me
                </a>
              </div>

              {/* Full Bio */}
              <div className="animate-item space-y-4">
                {aboutMeText.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Location */}
              <div className="animate-item flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-semibold">{location}</span>
              </div>

              {/* Email */}
              <div className="animate-item">
                <a
                  href={`mailto:${emailAddress}`}
                  className="inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold">{emailAddress}</span>
                </a>
              </div>

              {/* Book Button */}
              <div className="animate-item">
                <Button className="btn-primary">
                  Book Zach
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Full Shows List */}
          <div ref={showsRef} id="full-shows" className="space-y-6">
            <div className="show-item">
              <h3 className="font-display font-black text-2xl lg:text-3xl tracking-tight mb-6">
                ALL <span className="text-primary">SHOWS</span>
              </h3>
            </div>

            {/* Full Shows List */}
            <div className="space-y-4">
              {shows.map((show) => (
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
          </div>
        </div>
      </div>
    </div>
    </section>
  );
}
