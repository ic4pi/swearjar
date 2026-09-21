import { useState, useEffect } from 'react';
import { api, type Show, type Product, type SiteSettings } from '@/lib/api';
import type { Video } from '@/types';

// Fallback / built-in data. Shows always start here and get replaced once
// /api/shows answers. Products stay here permanently as the base catalog —
// /api/products only carries what's been added or edited through /admin,
// merged in below by name (same pattern hexpo's storefront uses: a
// product added through the dashboard is additive, one edited there
// overrides its built-in card in place).
const fallbackShows: Show[] = [
  {
    id: '1',
    date: 'Mar 15, 2026',
    venue: 'The Laugh Lounge',
    location: 'Austin, TX',
    link: '#'
  },
  {
    id: '2',
    date: 'Mar 28, 2026',
    venue: 'Comedy Cellar',
    location: 'San Antonio, TX',
    link: '#'
  },
  {
    id: '3',
    date: 'Sunday',
    venue: 'Virtual Livestream',
    location: 'Twitch',
    link: '#'
  }
];

// No backend endpoint manages videos (out of scope for the current admin
// dashboard — see the migration notes), so this is simply the hero clip.
const fallbackVideos: Video[] = [
  {
    id: '1',
    title: 'Stand-Up Clip',
    thumbnail: 'https://img.youtube.com/vi/NYb64OG_ksg/maxresdefault.jpg',
    url: 'https://youtu.be/NYb64OG_ksg',
    embedUrl: 'https://www.youtube.com/embed/NYb64OG_ksg'
  }
];

const fallbackProducts: Product[] = [
  // Activism series - Tourette's awareness design, sourced from the shared Merchize catalog.
  {
    id: 'merchize-6aadba87bea1cd6d573856e0',
    name: "Tourette's Awareness Hoodie",
    description: "Lightweight hoodie featuring the Tourette's Awareness design.",
    price: 40,
    image: 'https://d2dytk4tvgwhb4.cloudfront.net/v2/apnlgyzx/variants/6aadba87bea1cd5ed93856e8/variant-sku/LWHDVN000000AA01/attributes-size:s,background:oxncwpw_mockup-backgrounds_90db55b3-16de-4f2c-9553-62816054634a/front-name:Front-aNHaEugAF/thumb.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  },
  // Funny series - no category, just laughs. Also sourced from the shared Merchize catalog.
  {
    id: 'merchize-6aadda6ce0acc7c2b004f022',
    name: 'I Heart White Collar Crime Hoodie',
    description: 'Lightweight hoodie featuring the "I Heart White Collar Crime" design.',
    price: 40,
    image: 'https://d2dytk4tvgwhb4.cloudfront.net/v2/apnlgyzx/variants/6aadda6ce0acc7442a04f02a/variant-sku/LWHDVN000000AA01/attributes-size:s,background:oxncwpw_mockup-backgrounds_dc694d11-0341-4524-a591-c10ecd2aa4fe/front-name:Front-QQ5r8I1WG/thumb.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  },
  // Accessories - single placeholder until real accessory products are added.
  {
    id: 'a1',
    name: 'Sticker Pack',
    description: 'Spread awareness everywhere you go. 5 premium vinyl stickers.',
    price: 8,
    image: '/product_sticker_1.jpg',
    category: 'accessories',
    variants: ['Standard Pack']
  },
];

const fallbackSettings: SiteSettings = { cashAppTag: '$TourettesInc' };

// Merges products fetched from /api/products into the built-in list by
// name: a name that matches a built-in gets that card's price/description/
// image/variants updated in place (so an edit made in /admin — including
// one made to an original hoodie after it's imported there — actually
// shows up); anything new is appended. A catalog fetch failing must never
// be able to take the storefront's built-ins down.
function mergeProducts(builtIn: Product[], dynamic: Product[]): Product[] {
  const merged = builtIn.map((p) => ({ ...p }));
  const byName = new Map(merged.map((p) => [p.name, p]));
  for (const p of dynamic) {
    const existing = byName.get(p.name);
    if (existing) {
      if (p.description) existing.description = p.description;
      if (p.price) existing.price = p.price;
      if (p.image) existing.image = p.image;
      if (p.variants && p.variants.length) existing.variants = p.variants;
      if (p.series) existing.series = p.series;
    } else {
      merged.push({ ...p });
    }
  }
  return merged;
}

// Hook for shows
export function useShows() {
  const [shows, setShows] = useState<Show[]>(fallbackShows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShows = async () => {
    try {
      setLoading(true);
      const data = await api.getShows();
      setShows(data.length ? data : fallbackShows);
      setError(null);
    } catch (err) {
      console.warn('Failed to load shows from API, using fallback data:', err);
      setShows(fallbackShows);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShows();
  }, []);

  return { shows, loading, error, refetch: loadShows };
}

// Hook for the hero video clip(s). Static for now - see the fallbackVideos
// note above.
export function useVideos() {
  return { videos: fallbackVideos, loading: false, error: null, refetch: () => {} };
}

// Hook for products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const dynamic = await api.getProducts();
      setProducts(mergeProducts(fallbackProducts, dynamic));
      setError(null);
    } catch (err) {
      console.warn('Failed to load products from API, using built-in catalog:', err);
      setProducts(fallbackProducts);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return { products, loading, error, refetch: loadProducts };
}

// Hook for site settings (currently just the donate button's Cash App tag)
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings({ ...fallbackSettings, ...data });
    } catch (err) {
      console.warn('Failed to load settings from API, using fallback data:', err);
      setSettings(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, refetch: loadSettings };
}

// Combined hook for all data
export function useSiteData() {
  const shows = useShows();
  const videos = useVideos();
  const products = useProducts();
  const settings = useSiteSettings();

  const loading = shows.loading || products.loading || settings.loading;
  const hasError = !!shows.error || !!products.error;

  return {
    shows: shows.shows,
    videos: videos.videos,
    products: products.products,
    settings: settings.settings,
    loading,
    hasError,
    refetch: () => {
      shows.refetch();
      products.refetch();
      settings.refetch();
    }
  };
}
