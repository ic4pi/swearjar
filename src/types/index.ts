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
}

/** One product as read from the Merchize catalog (GET /api/admin/merchize/products). */
export interface MerchizeCatalogProduct {
  id: string;
  title: string;
  image: string;
  labels: string[];
  sizes: string[];
  skus: Record<string, string>;
}

export interface ShippingInfo {
  full_name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
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

export interface SiteSettings {
  cashAppTag: string;
}

export interface CartItem {
  product: Product;
  variant: string;
  quantity: number;
}
