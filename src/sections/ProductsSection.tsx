import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trpc } from "@/providers/trpc";
import { CATEGORY_META, formatPrice, type CategoryKey } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  image: string | null;
  category: CategoryKey;
  merchizeUrl: string | null;
  variants: string | null;
};

const FALLBACK_PRODUCTS: ProductRow[] = [
  { id: 1, name: "Tic & Talk Hoodie", description: "Start conversations. Spread awareness. Stay comfortable.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "activism", merchizeUrl: "", variants: "Unisex Hoodie, Unisex T-Shirt" },
  { id: 2, name: "1 in 100 Hoodie", description: "1 in 100 school-aged kids have Tourette's. Wear the stat.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "activism", merchizeUrl: "", variants: "Unisex Hoodie" },
  { id: 3, name: "Warrior Hoodie", description: "For the fighters. For the advocates. For everyone.", priceCents: 4800, image: "/product_sweater_1.jpg", category: "activism", merchizeUrl: "", variants: "Unisex Hoodie, Unisex T-Shirt" },
  { id: 4, name: "Awareness Ambassador Hoodie", description: "Be an ambassador for understanding.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "activism", merchizeUrl: "", variants: "Unisex Hoodie" },
  { id: 5, name: "Laugh Out Loud Hoodie", description: "No cause, no message. Just funny.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "funny", merchizeUrl: "", variants: "Unisex Hoodie, Unisex T-Shirt" },
  { id: 6, name: "Stage Ready Hoodie", description: "Green-room comfortable, front-row funny.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "funny", merchizeUrl: "", variants: "Unisex Hoodie" },
  { id: 7, name: "Comedy Club Hoodie", description: "For anyone who thinks they could probably do five minutes too.", priceCents: 4500, image: "/product_sweater_1.jpg", category: "funny", merchizeUrl: "", variants: "Unisex Hoodie, Unisex T-Shirt" },
  { id: 8, name: "Zachariah Tippett Original", description: "The original. The classic. The statement.", priceCents: 4800, image: "/product_sweater_1.jpg", category: "funny", merchizeUrl: "", variants: "Unisex Hoodie" },
];

function ProductCard({ product }: { product: ProductRow }) {
  const variants = (product.variants ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const href = product.merchizeUrl?.trim();

  const card = (
    <div className="product-card group relative border-2 border-white/15 transition-colors duration-300 hover:border-teal">
      <div className="relative aspect-square overflow-hidden bg-[#141415]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-hand text-3xl text-white/25">artwork soon</div>
        )}
        <span className="absolute left-3 top-3 border border-white/25 bg-[#0a0a0b]/80 px-2.5 py-1 font-display text-sm tracking-wide">
          {formatPrice(product.priceCents)}
        </span>
        {href && (
          <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center bg-teal text-[#0a0a0b] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
      <div className="p-5">
        <h4 className="font-display text-lg uppercase leading-tight">{product.name}</h4>
        {product.description && <p className="mt-2 text-sm leading-snug text-white/55">{product.description}</p>}
        {variants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <span key={v} className="border border-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                {v}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {card}
    </a>
  ) : (
    card
  );
}

function CategoryBlock({ category, products }: { category: CategoryKey; products: ProductRow[] }) {
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
  const { data } = trpc.products.list.useQuery(undefined, { retry: 1 });
  const products: ProductRow[] = (data as ProductRow[] | undefined) ?? FALLBACK_PRODUCTS;

  const activism = products.filter((p) => p.category === "activism");
  const funny = products.filter((p) => p.category === "funny");
  const odds = products.filter((p) => p.category === "odds");
  // Odds & Ends stays hidden until something is actually assigned to it.
  const showOdds = odds.length > 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".category-block").forEach((block) => {
        gsap.fromTo(
          block.querySelectorAll(".product-card"),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: block, start: "top 78%" },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [products.length, showOdds]);

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
      {showOdds && <CategoryBlock category="odds" products={odds} />}

      <p className="mt-8 text-center font-hand text-2xl text-white/45">
        printed &amp; shipped by our friends at merchize
      </p>
    </section>
  );
}
