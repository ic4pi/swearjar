import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePhotos } from '@/hooks/useSiteData';

gsap.registerPlugin(ScrollTrigger);

export function PhotosSection() {
  const root = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { photos } = usePhotos();

  useEffect(() => {
    if (photos.length === 0) return;
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('.photo-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 80%' },
          }
        );
      }
    }, root);
    return () => ctx.revert();
  }, [photos.length]);

  // No admin-added photos yet — the section simply doesn't render, same
  // empty-state rule the rest of the site follows.
  if (photos.length === 0) return null;

  return (
    <section ref={root} id="photos" className="relative z-10 mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
      <div className="mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-hand text-2xl text-teal md:text-3xl">life on tour</p>
          <h2 className="display-lg">
            On the <span className="outline-text-teal">Road</span>
          </h2>
        </div>
        <span className="hidden font-display text-7xl text-white/10 md:block">04</span>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-card group relative aspect-square overflow-hidden border-2 border-white/15 transition-colors duration-300 hover:border-teal">
            <img
              src={photo.url}
              alt={photo.title || 'Photo'}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {photo.title && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#0a0a0b]/85 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="font-hand text-xl text-teal">{photo.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
