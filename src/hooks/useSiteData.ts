import { useState, useEffect } from 'react';
import { api, type Show, type Video, type Product, type Donation, type Photo } from '@/lib/api';

// Fallback data in case API is not available
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
    merchize_sku: JSON.stringify({
      S: 'LWHDVN000000AA01', M: 'LWHDVN000000AA02', L: 'LWHDVN000000AA03', XL: 'LWHDVN000000AA04',
      '2XL': 'LWHDVN000000AA05', '3XL': 'LWHDVN000000AA06', '4XL': 'LWHDVN000000AA07', '5XL': 'LWHDVN000000AA08',
    }),
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
    merchize_sku: JSON.stringify({
      S: 'LWHDVN000000AA01', M: 'LWHDVN000000AA02', L: 'LWHDVN000000AA03', XL: 'LWHDVN000000AA04',
      '2XL': 'LWHDVN000000AA05', '3XL': 'LWHDVN000000AA06', '4XL': 'LWHDVN000000AA07', '5XL': 'LWHDVN000000AA08',
    }),
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

// Hook for shows
export function useShows() {
  const [shows, setShows] = useState<Show[]>(fallbackShows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShows = async () => {
    try {
      setLoading(true);
      const data = await api.getShows();
      setShows(data);
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

// Hook for videos
export function useVideos() {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await api.getVideos();
      setVideos(data);
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

// Hook for products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.warn('Failed to load products from API, using fallback data:', err);
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

// Hook for donations
export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const data = await api.getDonations();
      setDonations(data);
      setError(null);
    } catch (err) {
      console.warn('Failed to load donations from API:', err);
      setDonations([]);
      setError('No donation data available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  return { donations, loading, error, refetch: loadDonations };
}

// Hook for photos
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
      setError('No photo data available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  return { photos, loading, error, refetch: loadPhotos };
}

// Combined hook for all data
export function useSiteData() {
  const shows = useShows();
  const videos = useVideos();
  const products = useProducts();
  const donations = useDonations();
  const photos = usePhotos();

  const loading = shows.loading || videos.loading || products.loading || donations.loading || photos.loading;
  const hasError = !!shows.error || !!videos.error || !!products.error || !!donations.error || !!photos.error;

  return {
    shows: shows.shows,
    videos: videos.videos,
    products: products.products,
    donations: donations.donations,
    photos: photos.photos,
    loading,
    hasError,
    refetch: () => {
      shows.refetch();
      videos.refetch();
      products.refetch();
      donations.refetch();
      photos.refetch();
    }
  };
}
