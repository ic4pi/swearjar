import { useState, useEffect } from 'react';
import { api, type Show, type Product, type SiteSettings, type Video, type Photo } from '@/lib/api';

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

// Shown until /api/videos answers, and again if it fails. Self-hosted (no
// embedUrl, url points at a direct video file) rather than YouTube - see
// getVideoSource() in HeroSection.tsx / VideoSection.tsx for how the two
// are told apart.
const fallbackVideos: Video[] = [
  {
    id: '1',
    title: 'Kill Tony',
    thumbnail: '/assets/video/zach-kill-tony-poster.jpg',
    url: '/assets/video/zach-kill-tony.mp4',
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

const fallbackSettings: SiteSettings = {
  cashAppTag: '$TourettesInc',
  contactEmail: 'tourettesinc@gmail.com',
  bookingEmail: 'tourettesinc@gmail.com',
  location: 'San Antonio, Texas',
  patreonUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  twitchUrl: '',
};

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

// Hook for the hero video clip(s)
export function useVideos() {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await api.getVideos();
      setVideos(data.length ? data : fallbackVideos);
      setError(null);
    } catch (err) {
      console.warn('Failed to load videos from API, using fallback data:', err);
      setVideos(fallbackVideos);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return { videos, loading, error, refetch: loadVideos };
}

// Hook for the photo gallery. No built-in fallback - an empty gallery
// just doesn't render (see PhotosSection.tsx).
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.getPhotos();
      setPhotos(data);
      setError(null);
    } catch (err) {
      console.warn('Failed to load photos from API:', err);
      setPhotos([]);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  return { photos, loading, error, refetch: loadPhotos };
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
  const photos = usePhotos();
  const products = useProducts();
  const settings = useSiteSettings();

  const loading = shows.loading || videos.loading || photos.loading || products.loading || settings.loading;
  const hasError = !!shows.error || !!videos.error || !!photos.error || !!products.error;

  return {
    shows: shows.shows,
    videos: videos.videos,
    photos: photos.photos,
    products: products.products,
    settings: settings.settings,
    loading,
    hasError,
    refetch: () => {
      shows.refetch();
      videos.refetch();
      photos.refetch();
      products.refetch();
      settings.refetch();
    }
  };
}
