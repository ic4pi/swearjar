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
    title: 'My Tourette\'s Story - Stand Up Set',
    thumbnail: '/video_reel.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Zack Tippett Logo Tee',
    description: 'Classic logo tee. Bold design, premium comfort. Wear the message.',
    price: 28,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '2',
    name: 'Tic & Talk Hoodie',
    description: 'Start conversations. Spread awareness. Stay comfortable.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
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
