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
  // Activism series - Tourette's awareness designs
  {
    id: '1',
    name: 'Tic & Talk Hoodie',
    description: 'Start conversations. Spread awareness. Stay comfortable.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '2',
    name: '1 in 100 Hoodie',
    description: '1 in 100 school-aged kids have Tourette\'s. Wear the stat, start the conversation.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '3',
    name: 'Warrior Hoodie',
    description: 'For the fighters. For the advocates. For everyone.',
    price: 48,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '4',
    name: 'Awareness Ambassador Hoodie',
    description: 'Be an ambassador for understanding. Wear it proudly.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '9',
    name: "Tourette's Awareness Hoodie",
    description: "Design by Smart_Ppl. Wear the awareness, start the conversation.",
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie']
  },
  // Funny series - no category, just laughs
  {
    id: '5',
    name: 'Laugh Out Loud Hoodie',
    description: 'No cause, no message. Just funny.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '6',
    name: 'Stage Ready Hoodie',
    description: 'Comfortable enough for the green room, funny enough for the front row.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '7',
    name: 'Comedy Club Hoodie',
    description: 'For anyone who thinks they could probably do five minutes too.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '8',
    name: 'Zachariah Tippett Original Hoodie',
    description: 'The original. The classic. The statement.',
    price: 48,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  // Accessories
  {
    id: 'a1',
    name: 'Sticker Pack',
    description: 'Spread awareness everywhere you go. 5 premium vinyl stickers.',
    price: 8,
    image: '/product_sticker_1.jpg',
    category: 'accessories',
    variants: ['Standard Pack'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a2',
    name: 'Morning Mug',
    description: 'Start your day with a smile and a cause. 11oz ceramic.',
    price: 16,
    image: '/shop_mug.jpg',
    category: 'accessories',
    variants: ['11oz Mug'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a3',
    name: 'Enamel Pin Set',
    description: 'Wear your support. Collectible quality pins.',
    price: 12,
    image: '/product_pin_1.jpg',
    category: 'accessories',
    variants: ['Set of 3'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a4',
    name: 'Tote Bag',
    description: 'Carry the message. Durable canvas, bold design.',
    price: 22,
    image: '/product_tote_1.jpg',
    category: 'accessories',
    variants: ['Standard Tote'],
    printfulUrl: 'https://www.printful.com/'
  }
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
