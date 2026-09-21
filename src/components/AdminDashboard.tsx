import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Save, Plus, Trash2, LogOut, Calendar, ShoppingBag, DollarSign, Video as VideoIcon, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Show, Product, MerchizeCatalogProduct, Video, Photo } from '@/types';
import { adminApi, api } from '@/lib/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fields the dashboard can edit on a product. Sizes are edited as a
// comma-separated string and split/joined at the boundary.
interface ProductDraft {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'apparel' | 'accessories';
  series: 'activism' | 'funny' | '';
  sizesText: string;
}

function toDraft(p: Product): ProductDraft {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    category: p.category,
    series: p.series || '',
    sizesText: p.variants.join(', '),
  };
}

export function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('');

  // Admin data state
  const [shows, setShows] = useState<Show[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cashAppTagDraft, setCashAppTagDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [merchizeLabel, setMerchizeLabel] = useState('Smart Peoples');
  const [merchizeResults, setMerchizeResults] = useState<MerchizeCatalogProduct[]>([]);
  const [merchizeSelected, setMerchizeSelected] = useState<Set<string>>(new Set());
  const [merchizeSeries, setMerchizeSeries] = useState<'activism' | 'funny'>('funny');
  const [merchizePrice, setMerchizePrice] = useState(40);
  const [merchizeStatus, setMerchizeStatus] = useState('');
  const [merchizeBusy, setMerchizeBusy] = useState(false);

  const loadData = async (token: string) => {
    try {
      const [showsData, videosData, photosData, productsData] = await Promise.all([
        api.getShows(),
        api.getVideos(),
        api.getPhotos(),
        api.getProducts(),
      ]);
      setShows(showsData);
      setVideos(videosData);
      setPhotos(photosData);
      setProducts(productsData);
      const { settings: s } = await adminApi.get(token, 'settings');
      setCashAppTagDraft(s.cashAppTag || '');
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadData(authToken);
    }
  }, [isAuthenticated, authToken]);

  const handleLogin = async () => {
    setLoginBusy(true);
    setError('');
    try {
      const { token, mustChangePassword: mustChange } = await adminApi.login(password);
      setIsAuthenticated(true);
      setAuthToken(token);
      setMustChangePassword(!!mustChange);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAuthToken('');
    setMustChangePassword(false);
    onClose();
  };

  const handleChangePassword = async () => {
    setPasswordStatus('');
    if (newPassword.length < 8) {
      setPasswordStatus('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('Passwords don’t match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await adminApi.call(authToken, 'change-password', { newPassword });
      setMustChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus('Password changed.');
    } catch (err) {
      setPasswordStatus(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordBusy(false);
    }
  };

  // ── Shows ──

  const handleAddShow = async () => {
    setBusy(true);
    try {
      await adminApi.call(authToken, 'add-show', {
        date: 'March 15, 8:00 PM',
        startTime: '8:00 PM',
        venue: 'New Venue',
        location: 'New Location',
        link: '',
      });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add show');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateShow = async (id: string, field: keyof Show, value: string) => {
    setShows((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    try {
      await adminApi.call(authToken, 'update-show', { id, [field]: value });
    } catch (err) {
      console.error('Failed to update show:', err);
      await loadData(authToken);
    }
  };

  const handleDeleteShow = async (id: string) => {
    try {
      await adminApi.call(authToken, 'delete-show', { id });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete show');
    }
  };

  // ── Videos ──

  const handleAddVideo = async () => {
    setBusy(true);
    try {
      await adminApi.call(authToken, 'add-video', {
        title: 'New Video',
        thumbnail: '/video_reel.jpg',
        url: '',
        embedUrl: '',
      });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateVideo = async (id: string, field: keyof Video, value: string) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    try {
      await adminApi.call(authToken, 'update-video', { id, [field]: value });
    } catch (err) {
      console.error('Failed to update video:', err);
      await loadData(authToken);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await adminApi.call(authToken, 'delete-video', { id });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete video');
    }
  };

  // ── Photos ──

  const handleAddPhoto = async () => {
    setBusy(true);
    try {
      await adminApi.call(authToken, 'add-photo', {
        title: 'Show Photo',
        url: 'https://via.placeholder.com/400x300.png?text=Your+Photo+Here',
      });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add photo');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePhoto = async (id: string, field: keyof Photo, value: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    try {
      await adminApi.call(authToken, 'update-photo', { id, [field]: value });
    } catch (err) {
      console.error('Failed to update photo:', err);
      await loadData(authToken);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      await adminApi.call(authToken, 'delete-photo', { id });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  // ── Products ──

  const handleAddProduct = async () => {
    setBusy(true);
    try {
      await adminApi.call(authToken, 'create-product', {
        name: 'New Hoodie',
        description: 'Product description',
        price: 45,
        image: '/product_sweater_1.jpg',
        kind: 'apparel',
        series: 'funny',
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
      });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setBusy(false);
    }
  };

  const handleImportLegacy = async () => {
    setBusy(true);
    try {
      const out = await adminApi.call(authToken, 'import-legacy', {});
      const created = (out.results || []).filter((r: { status: string }) => r.status === 'created').length;
      alert(created ? `Imported ${created} product(s) into Stripe — they're now editable below.` : 'Nothing new to import.');
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateProduct = async (draft: ProductDraft, field: keyof ProductDraft, value: string | number) => {
    const updated = { ...draft, [field]: value };
    if (!updated.id.startsWith('prod_')) {
      // Not a Stripe-backed product yet (still a built-in default) — importing
      // makes it editable, same rule as hexpo's dashboard.
      alert('Import the built-in catalog first (see the button above) before editing this product.');
      return;
    }
    try {
      await adminApi.call(authToken, 'update-product', {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        image: updated.image,
        kind: updated.category,
        series: updated.series || undefined,
        sizes: updated.sizesText.split(',').map((s) => s.trim()).filter(Boolean),
      });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!id.startsWith('prod_')) return;
    try {
      await adminApi.call(authToken, 'archive-product', { id });
      await loadData(authToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove product');
    }
  };

  const handleFetchMerchizeCatalog = async () => {
    setMerchizeBusy(true);
    setMerchizeStatus('');
    setMerchizeResults([]);
    setMerchizeSelected(new Set());
    try {
      const data = await adminApi.get(authToken, 'merchize-scan', { label: merchizeLabel });
      setMerchizeResults(data.products);
      setMerchizeSelected(new Set(data.products.map((p: MerchizeCatalogProduct) => p.id)));
      if (data.products.length === 0) {
        const known = data.labels.length ? ` Categories seen in the account: ${data.labels.join(', ')}.` : '';
        setMerchizeStatus(`No products found under "${merchizeLabel}".${known}`);
      }
    } catch (err) {
      setMerchizeStatus(err instanceof Error ? err.message : 'Failed to reach the server.');
    } finally {
      setMerchizeBusy(false);
    }
  };

  const toggleMerchizeSelected = (id: string) => {
    setMerchizeSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleImportMerchizeSelected = async () => {
    const items = merchizeResults.filter((p) => merchizeSelected.has(p.id));
    if (!items.length) return;
    setMerchizeBusy(true);
    setMerchizeStatus('');
    try {
      const data = await adminApi.call(authToken, 'merchize-import', {
        ids: items.map((p) => p.id),
        label: merchizeLabel,
        series: merchizeSeries,
        price: merchizePrice,
      });
      setMerchizeStatus(`Imported ${data.imported.length} product(s).`);
      setMerchizeResults([]);
      setMerchizeSelected(new Set());
      await loadData(authToken);
    } catch (err) {
      setMerchizeStatus(err instanceof Error ? err.message : 'Failed to reach the server.');
    } finally {
      setMerchizeBusy(false);
    }
  };

  // ── Settings ──

  const handleSaveCashAppTag = async () => {
    setBusy(true);
    try {
      await adminApi.call(authToken, 'update-settings', { cashAppTag: cashAppTagDraft });
      alert('Saved.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-2xl flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              Admin Login
            </DialogTitle>
            <DialogDescription>
              Enter the site password to access the admin dashboard
              <div className="text-xs text-muted-foreground mt-2">
                💡 Pro tip: Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Shift+D</kbd> to open admin from any page
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleLogin} className="w-full btn-primary" disabled={loginBusy}>
              <Lock className="w-4 h-4 mr-2" />
              {loginBusy ? 'Signing in...' : 'Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-card border-border max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl flex items-center justify-between">
            <span className="flex items-center gap-3">Admin Dashboard</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </DialogTitle>
        </DialogHeader>

        {mustChangePassword && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
            You're signed in with the one-time default password. Go to <strong>Settings</strong> and set a new one.
          </div>
        )}

        <Tabs defaultValue={mustChangePassword ? 'settings' : 'shows'} className="pt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="shows">
              <Calendar className="w-4 h-4 mr-2" />
              Shows
            </TabsTrigger>
            <TabsTrigger value="videos">
              <VideoIcon className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Image className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="settings">
              <DollarSign className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Shows Tab */}
          <TabsContent value="shows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Upcoming Shows</h3>
              <Button onClick={handleAddShow} size="sm" className="btn-primary" disabled={busy}>
                <Plus className="w-4 h-4 mr-2" />
                {busy ? 'Adding...' : 'Add Show'}
              </Button>
            </div>

            <div className="space-y-3">
              {shows.map((show) => (
                <div key={show.id} className="grid grid-cols-4 gap-3 p-3 bg-background border border-border rounded-lg">
                  <Input
                    value={show.date}
                    onChange={(e) => handleUpdateShow(show.id, 'date', e.target.value)}
                    placeholder="Date & Time (e.g., March 15, 8:00 PM)"
                  />
                  <Input
                    value={show.venue}
                    onChange={(e) => handleUpdateShow(show.id, 'venue', e.target.value)}
                    placeholder="Venue"
                  />
                  <Input
                    value={show.location}
                    onChange={(e) => handleUpdateShow(show.id, 'location', e.target.value)}
                    placeholder="Location"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={show.link || ''}
                      onChange={(e) => handleUpdateShow(show.id, 'link', e.target.value)}
                      placeholder="Link"
                    />
                    <button
                      onClick={() => handleDeleteShow(show.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {shows.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No shows added yet.</p>
              )}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Embed URL example: https://www.youtube.com/embed/dQw4w9WgXcQ. The first video plays
                in the hero at the top of the page; every video shows further down in "Watch the Set".
              </p>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Video Gallery</h3>
              <Button onClick={handleAddVideo} size="sm" className="btn-primary" disabled={busy}>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>

            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video.id} className="grid grid-cols-3 gap-3 p-3 bg-background border border-border rounded-lg">
                  <Input
                    value={video.title}
                    onChange={(e) => handleUpdateVideo(video.id, 'title', e.target.value)}
                    placeholder="Title"
                  />
                  <Input
                    value={video.embedUrl || ''}
                    onChange={(e) => handleUpdateVideo(video.id, 'embedUrl', e.target.value)}
                    placeholder="YouTube Embed URL"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={video.thumbnail}
                      onChange={(e) => handleUpdateVideo(video.id, 'thumbnail', e.target.value)}
                      placeholder="Thumbnail URL"
                    />
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {videos.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No videos added yet.</p>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Photo Gallery</h3>
              <Button onClick={handleAddPhoto} size="sm" className="btn-primary" disabled={busy}>
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </div>

            <div className="space-y-3">
              {photos.map((photo) => (
                <div key={photo.id} className="grid grid-cols-3 gap-3 p-3 bg-background border border-border rounded-lg">
                  <Input
                    value={photo.title}
                    onChange={(e) => handleUpdatePhoto(photo.id, 'title', e.target.value)}
                    placeholder="e.g., Show Photo, Fan Picture, etc."
                  />
                  <Input
                    value={photo.url}
                    onChange={(e) => handleUpdatePhoto(photo.id, 'url', e.target.value)}
                    placeholder="https://i.imgur.com/yourimage.jpg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No photos added yet.</p>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-primary">Before editing the launch hoodies</h4>
              <p className="text-sm text-muted-foreground">
                The two launch hoodies and the sticker pack ship as built-in defaults so the shop
                page always shows something. Editing one here requires it to exist in Stripe first
                — click below once to bring them in (safe to click again later, it skips anything
                already imported).
              </p>
              <Button onClick={handleImportLegacy} disabled={busy} size="sm" variant="secondary">
                {busy ? 'Working...' : 'Import built-in catalog into Stripe'}
              </Button>
            </div>

            <div className="bg-background border border-border rounded-lg p-4 space-y-3">
              <h4 className="font-bold">Import from Merchize</h4>
              <p className="text-sm text-muted-foreground">
                Pull designs already set up in the shared Merchize account by category.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={merchizeLabel}
                  onChange={(e) => setMerchizeLabel(e.target.value)}
                  placeholder="Merchize category (e.g. Smart Peoples)"
                  className="sm:flex-1"
                />
                <Button onClick={handleFetchMerchizeCatalog} disabled={merchizeBusy || !merchizeLabel} size="sm">
                  {merchizeBusy ? 'Working...' : 'Fetch'}
                </Button>
              </div>
              {merchizeStatus && <p className="text-sm text-muted-foreground">{merchizeStatus}</p>}
              {merchizeResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={merchizeSeries}
                      onChange={(e) => setMerchizeSeries(e.target.value as 'activism' | 'funny')}
                      className="px-2 py-1 border rounded text-sm bg-background"
                    >
                      <option value="activism">Activism (Tourette's)</option>
                      <option value="funny">Funny (no category)</option>
                    </select>
                    <Input
                      type="number"
                      value={merchizePrice}
                      onChange={(e) => setMerchizePrice(parseFloat(e.target.value) || 0)}
                      placeholder="Price ($)"
                      className="sm:w-32"
                    />
                  </div>
                  {merchizeResults.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 p-2 border border-border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={merchizeSelected.has(p.id)}
                        onChange={() => toggleMerchizeSelected(p.id)}
                      />
                      {p.image && <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded" />}
                      <span className="text-sm flex-1">{p.title}</span>
                      <span className="text-xs text-muted-foreground">{p.sizes.length} size(s)</span>
                    </label>
                  ))}
                  <Button
                    onClick={handleImportMerchizeSelected}
                    disabled={merchizeBusy || merchizeSelected.size === 0}
                    size="sm"
                    className="btn-primary"
                  >
                    Import {merchizeSelected.size} selected
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Products</h3>
              <Button onClick={handleAddProduct} size="sm" className="btn-primary" disabled={busy}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="space-y-3">
              {products.map((product) => {
                const draft = toDraft(product);
                const editable = draft.id.startsWith('prod_');
                return (
                  <div key={product.id} className="grid grid-cols-2 md:grid-cols-7 gap-3 p-3 bg-background border border-border rounded-lg">
                    <Input
                      defaultValue={draft.name}
                      onBlur={(e) => e.target.value !== draft.name && handleUpdateProduct(draft, 'name', e.target.value)}
                      placeholder="Product Name"
                    />
                    <Input
                      defaultValue={draft.price}
                      type="number"
                      onBlur={(e) => parseFloat(e.target.value) !== draft.price && handleUpdateProduct(draft, 'price', parseFloat(e.target.value))}
                      placeholder="Price"
                    />
                    <Input
                      defaultValue={draft.image}
                      onBlur={(e) => e.target.value !== draft.image && handleUpdateProduct(draft, 'image', e.target.value)}
                      placeholder="Image URL"
                    />
                    <select
                      value={draft.category}
                      onChange={(e) => handleUpdateProduct(draft, 'category', e.target.value)}
                      className="px-2 py-1 border rounded text-sm bg-background"
                      disabled={!editable}
                    >
                      <option value="apparel">Apparel</option>
                      <option value="accessories">Accessories</option>
                    </select>
                    <select
                      value={draft.series}
                      onChange={(e) => handleUpdateProduct(draft, 'series', e.target.value)}
                      className="px-2 py-1 border rounded text-sm bg-background"
                      disabled={!editable || draft.category !== 'apparel'}
                    >
                      <option value="">No series</option>
                      <option value="activism">Activism (Tourette's)</option>
                      <option value="funny">Funny (no category)</option>
                    </select>
                    <Input
                      defaultValue={draft.sizesText}
                      onBlur={(e) => e.target.value !== draft.sizesText && handleUpdateProduct(draft, 'sizesText', e.target.value)}
                      placeholder="Sizes (comma separated)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleArchiveProduct(draft.id)}
                        disabled={!editable}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30"
                        title={editable ? 'Remove' : 'Import into Stripe first'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No products yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h3 className="font-bold text-lg">Donate Button</h3>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="cashAppTag">Cash App tag</Label>
                <Input
                  id="cashAppTag"
                  value={cashAppTagDraft}
                  onChange={(e) => setCashAppTagDraft(e.target.value)}
                  placeholder="$YourCashtag"
                />
                <p className="text-xs text-muted-foreground">
                  Shown on the donate button and linked as cash.app/{cashAppTagDraft.replace(/^\$/, '')}.
                </p>
              </div>

              <Button onClick={handleSaveCashAppTag} className="btn-primary" disabled={busy}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>

            <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3 max-w-md">
              <h4 className="font-bold">Admin password</h4>
              {mustChangePassword && (
                <p className="text-sm text-destructive font-semibold">
                  You're using the one-time default password — set a new one now.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat it"
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                />
              </div>
              {passwordStatus && <p className="text-sm text-muted-foreground">{passwordStatus}</p>}
              <Button onClick={handleChangePassword} className="btn-primary" disabled={passwordBusy}>
                <Save className="w-4 h-4 mr-2" />
                {passwordBusy ? 'Saving...' : 'Change password'}
              </Button>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                There's a separate emergency override password too, set only in Vercel
                (Settings → Environment Variables → ADMIN_PASSWORD) for whoever controls the
                Vercel project — it always works even if this one is lost.
              </p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-bold mb-2">Keyboard Shortcut</h4>
              <p className="text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> +{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift</kbd> +{' '}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">D</kbd> to quickly open admin
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
