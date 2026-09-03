import { API_BASE } from './api-config';
import type { Show, Video, Product, Donation } from '@/types';

// Show, Video, Product, and Donation are defined once in @/types and
// re-exported here so every caller shares the same types instead of two
// near-identical definitions drifting apart.
export type { Show, Video, Product, Donation };

export interface Photo {
  id: string;
  title: string;
  url: string;
}

// API functions for public data (no auth required)
export const api = {
  // Shows
  async getShows(): Promise<Show[]> {
    const response = await fetch(`${API_BASE}/shows`);
    if (!response.ok) throw new Error('Failed to fetch shows');
    return response.json();
  },

  // Videos
  async getVideos(): Promise<Video[]> {
    const response = await fetch(`${API_BASE}/videos`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    return products.map((p: any) => ({
      ...p,
      variants: JSON.parse(p.variants || '[]')
    }));
  },

  // Donations
  async getDonations(): Promise<Donation[]> {
    const response = await fetch(`${API_BASE}/donations`);
    if (!response.ok) throw new Error('Failed to fetch donations');
    return response.json();
  },

  // Photos
  async getPhotos(): Promise<Photo[]> {
    const response = await fetch(`${API_BASE}/photos`);
    if (!response.ok) throw new Error('Failed to fetch photos');
    return response.json();
  }
};

// Admin API functions (auth required)
export const adminApi = {
  // Authentication
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    if (!data.success) throw new Error('Invalid credentials');
    return data.token;
  },

  async updateCredentials(token: string, username: string, password: string) {
    const response = await fetch(`${API_BASE}/admin/credentials`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) throw new Error('Failed to update credentials');
    return response.json();
  },

  // Helper method for authenticated requests
  async authenticatedRequest(token: string, url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  },

  // Shows
  async addShow(token: string, show: Omit<Show, 'id'>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/shows`, {
      method: 'POST',
      body: JSON.stringify({ ...show, id: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Failed to add show');
    return response.json();
  },

  async updateShow(token: string, id: string, show: Partial<Show>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/shows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(show)
    });
    if (!response.ok) throw new Error('Failed to update show');
    return response.json();
  },

  async deleteShow(token: string, id: string) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/shows/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete show');
    return response.json();
  },

  // Videos
  async addVideo(token: string, video: Omit<Video, 'id'>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/videos`, {
      method: 'POST',
      body: JSON.stringify({ ...video, id: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Failed to add video');
    return response.json();
  },

  async updateVideo(token: string, id: string, video: Partial<Video>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(video)
    });
    if (!response.ok) throw new Error('Failed to update video');
    return response.json();
  },

  async deleteVideo(token: string, id: string) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/videos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete video');
    return response.json();
  },

  // Products
  async addProduct(token: string, product: Omit<Product, 'id'>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify({ ...product, id: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Failed to add product');
    return response.json();
  },

  async updateProduct(token: string, id: string, product: Partial<Product>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  async deleteProduct(token: string, id: string) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  // Donations
  async addDonation(token: string, donation: Omit<Donation, 'id'>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/donations`, {
      method: 'POST',
      body: JSON.stringify({ ...donation, id: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Failed to add donation');
    return response.json();
  },

  // Photos
  async addPhoto(token: string, photo: Omit<Photo, 'id'>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/photos`, {
      method: 'POST',
      body: JSON.stringify({ ...photo, id: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Failed to add photo');
    return response.json();
  },

  async updatePhoto(token: string, id: string, photo: Partial<Photo>) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(photo)
    });
    if (!response.ok) throw new Error('Failed to update photo');
    return response.json();
  },

  async deletePhoto(token: string, id: string) {
    const response = await this.authenticatedRequest(token, `${API_BASE}/photos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete photo');
    return response.json();
  }
};
