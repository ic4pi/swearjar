import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, CreditCard } from 'lucide-react';
import { useProducts } from '@/hooks/useSiteData';
import { StripeCheckout } from '@/components/StripeCheckoutNew';
import type { Product } from '@/types';

gsap.registerPlugin(ScrollTrigger);

function ProductCard({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="product-card group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Variants */}
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => (
            <button
              key={variant}
              onClick={() => setSelectedVariant(variant)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                selectedVariant === variant
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary'
              }`}
            >
              {variant}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Quantity:</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-1 border rounded text-sm"
          />
        </div>

        {/* Price & Payment Options */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-xl text-primary">${product.price * quantity}</span>
          </div>
          
          {/* Payment Options */}
          <div className="space-y-2">
            <StripeCheckout 
              items={[{ 
                id: product.id, 
                name: product.name, 
                price: product.price, 
                quantity,
                variant: selectedVariant 
              }]} 
              onSuccess={() => alert('Payment successful!')}
              onError={(error) => alert(`Payment failed: ${error}`)}
            />
            
            {/* Printful Link */}
            <a
              href={product.printfulUrl || 'https://www.printful.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block text-center px-4 py-2 border border-border font-semibold text-sm rounded-lg hover:border-primary transition-colors"
            >
              <ShoppingBag className="w-4 h-4 mr-2 inline" />
              Order via Printful
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const activismRef = useRef<HTMLDivElement>(null);
  const funnyRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useProducts();

  // Apparel splits into two sections by series - Tourette's activism designs
  // and no-category funny designs. Accessories aren't part of either series.
  const activismHoodies = products.filter(p => p.category === 'apparel' && p.series === 'activism');
  const funnyHoodies = products.filter(p => p.category === 'apparel' && p.series === 'funny');
  const accessoryProducts = products.filter(p => p.category === 'accessories');

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Activism section animation
      const activismCards = activismRef.current?.querySelectorAll('.product-card');
      if (activismCards && activismCards.length > 0) {
        gsap.fromTo(
          activismCards,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: activismRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Accessories section animation
      const accessoryCards = accessoriesRef.current?.querySelectorAll('.product-card');
      if (accessoryCards && accessoryCards.length > 0) {
        gsap.fromTo(
          accessoryCards,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: accessoriesRef.current,
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
      id="shop"
      className="relative min-h-screen bg-background py-20 lg:py-32 z-40"
    >

      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto space-y-20 lg:space-y-32">
        {/* Activism Hoodies Section */}
        <div ref={activismRef}>
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display font-black text-4xl lg:text-6xl tracking-tight mb-4">
              WEAR THE <span className="text-primary">MESSAGE</span>
            </h2>
            <div className="animate-item h-1 w-64 mx-auto bg-primary rounded-full" />
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Hoodie designs raising Tourette&apos;s awareness. Printed on demand with quality that lasts.
              Select designs also come as a T-shirt.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activismHoodies.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>

        {/* Just Funny Hoodies Section - no category, just laughs */}
        <div ref={funnyRef}>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display font-black text-4xl lg:text-6xl tracking-tight mb-4">
              JUST <span className="text-primary">FUNNY</span>
            </h2>
            <div className="animate-item h-1 w-64 mx-auto bg-primary rounded-full" />
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              No category, no cause — just funny hoodie designs. Select designs also come as a T-shirt.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {funnyHoodies.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>

        {/* Accessories Section */}
        <div ref={accessoriesRef}>
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-4">
              LITTLE THINGS. <span className="text-primary">BIG IMPACT.</span>
            </h2>
            <div className="animate-item h-1 w-64 mx-auto bg-primary rounded-full" />
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Mugs, stickers, and everyday reminders that awareness can be part of any routine.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accessoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
