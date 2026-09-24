import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProducts } from '@/hooks/useSiteData';
import { StripeCheckout } from '@/components/StripeCheckoutNew';
import { ShippingDialog } from '@/components/ShippingDialog';
import type { Product, ShippingInfo } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_META = {
  activism: {
    hand: 'for the mission',
    title: 'Multipurpose Apparel',
    tagline: 'Designs with something to say.',
  },
  funny: {
    hand: 'for the laughs',
    title: 'Just Funny',
    tagline: 'No cause, no message — just funny hoodie designs.',
  },
  accessories: {
    hand: 'random sh*t',
    title: 'Little Things. Big Impact.',
    tagline: 'Mugs, stickers, and everyday reminders that awareness can be part of any routine.',
  },
} as const;

function ProductCard({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="product-card group relative border-2 border-white/15 transition-colors duration-300 hover:border-teal">
      <div className="relative aspect-square overflow-hidden bg-[#141415]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 border border-white/25 bg-[#0a0a0b]/80 px-2.5 py-1 font-display text-sm tracking-wide">
          ${product.price * quantity}
        </span>
      </div>

      <div className="p-5">
        <h4 className="font-display text-lg uppercase leading-tight">{product.name}</h4>
        {product.description && <p className="mt-2 text-sm leading-snug text-white/55">{product.description}</p>}

        {product.variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.variants.map((variant) => (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  selectedVariant === variant
                    ? 'border-teal bg-teal text-[#0a0a0b]'
                    : 'border-white/20 text-white/55 hover:border-teal hover:text-teal'
                }`}
              >
                {variant}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-white/45">Qty</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 border border-white/20 bg-[#0a0a0b] px-2 py-1 text-sm text-white outline-none focus:border-teal"
          />
        </div>

        <div className="mt-4">
          {done ? (
            <p className="text-center text-sm font-bold uppercase tracking-widest text-teal">order placed — thank you!</p>
          ) : shippingInfo ? (
            <StripeCheckout
              items={[{
                id: product.id,
                name: product.name,
                price: product.price,
                quantity,
                variant: selectedVariant,
              }]}
              shippingInfo={shippingInfo}
              onSuccess={() => setDone(true)}
              onError={(error) => alert(`Payment failed: ${error}`)}
            />
          ) : (
            <button
              onClick={() => setShippingOpen(true)}
              className="btn-roll w-full bg-teal text-[#0a0a0b] hover:bg-white"
            >
              <span className="roll-window">
                <span className="roll-track">
                  <span>Buy Now</span>
                  <span aria-hidden>Buy Now</span>
                </span>
              </span>
            </button>
          )}

          <ShippingDialog
            open={shippingOpen}
            onOpenChange={setShippingOpen}
            onSubmit={(info) => {
              setShippingInfo(info);
              setShippingOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CategoryBlock({ category, products }: { category: keyof typeof CATEGORY_META; products: Product[] }) {
  if (products.length === 0) return null;
  const meta = CATEGORY_META[category];
  return (
    <div className="category-block mb-24 last:mb-0">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-white/15 pb-6">
        <div>
          <p className="mb-1 font-hand text-2xl text-teal md:text-3xl">{meta.hand}</p>
          <h3 className="display-md md:text-5xl">{meta.title}</h3>
        </div>
        <p className="max-w-xs text-right text-sm text-white/50">{meta.tagline}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export function ProductsSection() {
  const root = useRef<HTMLElement>(null);
  const { products } = useProducts();

  const activism = products.filter((p) => p.category === 'apparel' && p.series === 'activism');
  const funny = products.filter((p) => p.category === 'apparel' && p.series === 'funny');
  const accessories = products.filter((p) => p.category === 'accessories');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.category-block').forEach((block) => {
        gsap.fromTo(
          block.querySelectorAll('.product-card'),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: block, start: 'top 78%' },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [products.length]);

  return (
    <section ref={root} id="merch" className="relative z-10 mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
      <div className="mb-16 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-hand text-2xl text-teal md:text-3xl">wear it. share it.</p>
          <h2 className="display-lg">
            The <span className="outline-text-teal">Merch</span>
          </h2>
        </div>
        <span className="hidden font-display text-7xl text-white/10 md:block">03</span>
      </div>

      <CategoryBlock category="activism" products={activism} />
      <CategoryBlock category="funny" products={funny} />
      <CategoryBlock category="accessories" products={accessories} />

      <p className="mt-8 text-center font-hand text-2xl text-white/45">
        printed &amp; shipped by our friends at merchize
      </p>
    </section>
  );
}
