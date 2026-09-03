export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'apparel' | 'accessories';
  /** For apparel: which shop section it belongs to. Not used for accessories. */
  series?: 'activism' | 'funny';
  variants: string[];
  printfulUrl?: string;
  sales?: number;
}

export interface Show {
  id: string;
  date: string;
  startTime?: string;
  venue: string;
  location: string;
  link?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url?: string;
  embedUrl?: string;
}

export interface AdminState {
  isAuthenticated: boolean;
  username: string;
  password: string;
}

export interface SiteConfig {
  shows: Show[];
  videos: Video[];
  products: Product[];
  donations: Donation[];
}

export interface Donation {
  id: string;
  amount: number;
  date: string;
  donor?: string;
  message?: string;
}

export interface CartItem {
  product: Product;
  variant: string;
  quantity: number;
}
