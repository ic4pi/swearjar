import { API_BASE } from './api-config';
import type { Show, Product, SiteSettings, Video, Photo } from '@/types';

export type { Show, Product, SiteSettings, Video, Photo };

// Public, unauthenticated reads. The storefront falls back to its own
// hardcoded data (see useSiteData.ts, src/data/siteData.ts) if any of
// these fail, so a backend hiccup never takes the site down.
export const api = {
  async getShows(): Promise<Show[]> {
    const response = await fetch(`${API_BASE}/shows`);
    if (!response.ok) throw new Error('Failed to fetch shows');
    const data = await response.json();
    return data.shows;
  },

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.products;
  },

  async getSettings(): Promise<SiteSettings> {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    return data.settings;
  },

  async getVideos(): Promise<Video[]> {
    const response = await fetch(`${API_BASE}/videos`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    const data = await response.json();
    return data.videos;
  },

  async getPhotos(): Promise<Photo[]> {
    const response = await fetch(`${API_BASE}/photos`);
    if (!response.ok) throw new Error('Failed to fetch photos');
    const data = await response.json();
    return data.photos;
  },
};

// Admin actions all go through the single /api/admin?action=... endpoint
// (see api/admin.js), authenticated with the Bearer token issued at login.
export const adminApi = {
  async login(password: string): Promise<{ token: string; expiresInHours: number }> {
    const response = await fetch(`${API_BASE}/admin?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async get(token: string, action: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const response = await fetch(`${API_BASE}/admin?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed: ${action}`);
    return data;
  },

  async call(token: string, action: string, body: Record<string, unknown> = {}) {
    const response = await fetch(`${API_BASE}/admin?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed: ${action}`);
    return data;
  },
};
