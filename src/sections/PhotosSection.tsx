import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePhotos } from '@/hooks/useSiteData';

gsap.registerPlugin(ScrollTrigger);

export function PhotosSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { photos } = usePhotos();

  useEffect(() => {
    if (!sectionRef.current || photos.length === 0) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('.photo-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [photos.length]);

  // No admin-added photos yet - the section simply doesn't render, same as
  // the empty-state rule everywhere else on this site.
  if (photos.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="photos"
      className="relative watermark-bg py-20 lg:py-32 z-30"
      style={{ '--wm-pos': 'center 85%' } as React.CSSProperties}
    >
      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-display font-black text-4xl lg:text-6xl tracking-tight mb-2">
            ON THE <span className="text-primary">ROAD</span>
          </h2>
          <div className="animate-item h-1 w-64 mx-auto bg-primary rounded-full" />
        </div>

        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="photo-card group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <img
                src={photo.url}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.title && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-sm font-semibold">{photo.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
