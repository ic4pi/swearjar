import { Component, useEffect, useState, type ReactNode } from 'react';
import { adminApi, api } from '@/lib/api';
import type { Show, Video, Photo, Product, MerchizeCatalogProduct, SiteSettings } from '@/types';

/* ── Shared dashboard atoms ─────────────────────────────────────────── */

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/35">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full border border-white/20 bg-[#0a0a0b] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-teal placeholder:text-white/30';

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

function AdminButton({
  children,
  onClick,
  variant = 'teal',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'teal' | 'outline' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles =
    variant === 'teal'
      ? 'bg-teal text-[#0a0a0b] hover:bg-white'
      : variant === 'danger'
        ? 'border border-red-400/60 text-red-300 hover:bg-red-400/10'
        : 'border border-white/30 text-white hover:border-teal hover:text-teal';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-teal' : 'bg-red-400'}`} />
      <span className={ok ? 'text-teal' : 'text-red-300'}>{label}</span>
    </span>
  );
}

/** Thrown to bubble an expired/missing admin token up to the login gate. */
class Unauthorized extends Error {}

// React error boundaries only catch synchronous render-time throws, not
// rejections from async handlers — so an expired token is first stashed in
// state, which triggers a re-render, and *that* render throws it for
// AuthBoundary (below) to catch.
function useAuthGuard() {
  const [err, setErr] = useState<Unauthorized | null>(null);
  if (err) throw err;
  return function guard<T>(promise: Promise<T>): Promise<T> {
    return promise.catch((e) => {
      if (e instanceof Error && e.message === 'Not signed in') {
        const u = new Unauthorized(e.message);
        setErr(u);
        throw u;
      }
      throw e;
    });
  };
}

/* ── Login ──────────────────────────────────────────────────────────── */

const TOKEN_KEY = 'zt_admin_token';

function LoginGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await adminApi.login(password);
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-5">
      <form className="w-full max-w-sm border-2 border-white/15 bg-[#111112] p-8" onSubmit={submit}>
        <p className="font-hand text-2xl text-teal">backstage pass</p>
        <h1 className="display-md mt-1">Admin</h1>
        <div className="mt-6 space-y-4">
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <AdminButton type="submit" disabled={busy || !password}>
            {busy ? 'Checking…' : 'Let me in'}
          </AdminButton>
        </div>
        <a href="/" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-white/40 hover:text-teal">
          ← back to the site
        </a>
      </form>
    </div>
  );
}

/* ── Shows manager ──────────────────────────────────────────────────── */

type ShowForm = { id?: string; date: string; startTime: string; venue: string; location: string; link: string };
const emptyShow: ShowForm = { date: '', startTime: '', venue: '', location: '', link: '' };

function ShowsManager({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState<ShowForm>(emptyShow);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.getShows().then(setShows);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) await guard(adminApi.call(token, 'update-show', form));
      else await guard(adminApi.call(token, 'add-show', form));
      setForm(emptyShow);
      setEditing(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, venue: string) => {
    if (!confirm(`Delete "${venue}"?`)) return;
    await guard(adminApi.call(token, 'delete-show', { id }));
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h3 className="display-md mb-5">Shows <span className="text-white/30">({shows.length})</span></h3>
        <p className="mb-5 text-sm text-white/50">
          Use a full date (<span className="text-teal">Mar 15, 2026</span>) for one-offs or a weekday
          (<span className="text-teal">Sunday</span>) for weekly recurring gigs.
        </p>
        <div className="space-y-2">
          {shows.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 border border-white/15 px-4 py-3">
              <span className="font-display text-lg text-teal">{s.date}</span>
              <span className="font-semibold">{s.venue}</span>
              <span className="text-sm text-white/50">{s.location}</span>
              <span className="ml-auto flex gap-2">
                <AdminButton variant="outline" onClick={() => { setForm({ id: s.id, date: s.date, startTime: s.startTime || '', venue: s.venue, location: s.location, link: s.link || '' }); setEditing(true); }}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(s.id, s.venue)}>Delete</AdminButton>
              </span>
            </div>
          ))}
          {shows.length === 0 && <p className="border border-dashed border-white/20 p-6 text-center text-white/40">No shows yet — add the first one →</p>}
        </div>
      </div>

      <form onSubmit={submit} className="h-fit space-y-4 border border-white/15 p-6 lg:col-span-2">
        <h4 className="font-display text-xl uppercase">{editing ? 'Edit show' : 'Add a show'}</h4>
        <Field label="Date or weekday" hint='e.g. "Apr 12, 2026" or "Sunday"'>
          <TextInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </Field>
        <Field label="Start time" hint='Optional, e.g. "8:00 PM"'>
          <TextInput value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </Field>
        <Field label="Venue">
          <TextInput value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
        </Field>
        <Field label="Location">
          <TextInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="City, ST or platform" />
        </Field>
        <Field label="Ticket link" hint="Leave empty to show 'Details soon'">
          <TextInput value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
        </Field>
        <div className="flex gap-3 pt-2">
          <AdminButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add show'}</AdminButton>
          {editing && <AdminButton variant="outline" onClick={() => { setForm(emptyShow); setEditing(false); }}>Cancel</AdminButton>}
        </div>
      </form>
    </div>
  );
}

/* ── Videos manager ────────────────────────────────────────────────── */

type VideoForm = { id?: string; title: string; thumbnail: string; url: string; embedUrl: string };
const emptyVideo: VideoForm = { title: '', thumbnail: '/video_reel.jpg', url: '', embedUrl: '' };

function VideosManager({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState<VideoForm>(emptyVideo);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.getVideos().then(setVideos);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) await guard(adminApi.call(token, 'update-video', form));
      else await guard(adminApi.call(token, 'add-video', form));
      setForm(emptyVideo);
      setEditing(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await guard(adminApi.call(token, 'delete-video', { id }));
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h3 className="display-md mb-5">Videos <span className="text-white/30">({videos.length})</span></h3>
        <p className="mb-5 text-sm text-white/50">
          The first video is the hero backdrop. Every video shows in the hero's playlist strip if there's more than one.
          Self-hosted clips (a direct .mp4 URL) autoplay muted; a YouTube embed URL shows a play button instead.
        </p>
        <div className="space-y-2">
          {videos.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-3 border border-white/15 px-4 py-3">
              {v.thumbnail && <img src={v.thumbnail} alt="" className="h-10 w-16 border border-white/15 object-cover" />}
              <span className="font-semibold">{v.title}</span>
              <span className="ml-auto flex gap-2">
                <AdminButton variant="outline" onClick={() => { setForm({ id: v.id, title: v.title, thumbnail: v.thumbnail, url: v.url || '', embedUrl: v.embedUrl || '' }); setEditing(true); }}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(v.id, v.title)}>Delete</AdminButton>
              </span>
            </div>
          ))}
          {videos.length === 0 && <p className="border border-dashed border-white/20 p-6 text-center text-white/40">No videos yet — the hero falls back to the bundled clip.</p>}
        </div>
      </div>

      <form onSubmit={submit} className="h-fit space-y-4 border border-white/15 p-6 lg:col-span-2">
        <h4 className="font-display text-xl uppercase">{editing ? 'Edit video' : 'Add a video'}</h4>
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Thumbnail URL">
          <TextInput value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
        </Field>
        <Field label="Self-hosted video URL" hint="A direct .mp4/.webm link — leave empty if using a YouTube embed">
          <TextInput value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…/clip.mp4" />
        </Field>
        <Field label="YouTube embed URL" hint="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ">
          <TextInput value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} />
        </Field>
        <div className="flex gap-3 pt-2">
          <AdminButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add video'}</AdminButton>
          {editing && <AdminButton variant="outline" onClick={() => { setForm(emptyVideo); setEditing(false); }}>Cancel</AdminButton>}
        </div>
      </form>
    </div>
  );
}

/* ── Photos manager ────────────────────────────────────────────────── */

type PhotoForm = { id?: string; title: string; url: string };
const emptyPhoto: PhotoForm = { title: '', url: '' };

function PhotosManager({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [form, setForm] = useState<PhotoForm>(emptyPhoto);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.getPhotos().then(setPhotos);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) await guard(adminApi.call(token, 'update-photo', form));
      else await guard(adminApi.call(token, 'add-photo', form));
      setForm(emptyPhoto);
      setEditing(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    await guard(adminApi.call(token, 'delete-photo', { id }));
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h3 className="display-md mb-5">Photos <span className="text-white/30">({photos.length})</span></h3>
        <p className="mb-5 text-sm text-white/50">The "On the Road" section only appears on the site once there's at least one photo here.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden border border-white/15">
              <img src={p.url} alt={p.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-[#0a0a0b]/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate text-xs font-semibold">{p.title || 'Untitled'}</span>
                <div className="flex gap-1">
                  <AdminButton variant="outline" onClick={() => { setForm({ id: p.id, title: p.title, url: p.url }); setEditing(true); }}>Edit</AdminButton>
                  <AdminButton variant="danger" onClick={() => remove(p.id)}>Del</AdminButton>
                </div>
              </div>
            </div>
          ))}
          {photos.length === 0 && <p className="col-span-full border border-dashed border-white/20 p-6 text-center text-white/40">No photos yet.</p>}
        </div>
      </div>

      <form onSubmit={submit} className="h-fit space-y-4 border border-white/15 p-6 lg:col-span-2">
        <h4 className="font-display text-xl uppercase">{editing ? 'Edit photo' : 'Add a photo'}</h4>
        <Field label="Title" hint="Optional caption">
          <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Image URL">
          <TextInput value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://…" />
        </Field>
        <div className="flex gap-3 pt-2">
          <AdminButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add photo'}</AdminButton>
          {editing && <AdminButton variant="outline" onClick={() => { setForm(emptyPhoto); setEditing(false); }}>Cancel</AdminButton>}
        </div>
      </form>
    </div>
  );
}

/* ── Products manager ─────────────────────────────────────────────────── */

type ProductForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  kind: 'apparel' | 'accessories';
  series: 'activism' | 'funny' | '';
  sizesText: string;
  skuBlock: string;
};

const emptyProduct: ProductForm = {
  id: '', name: '', description: '', price: '', image: '', kind: 'apparel', series: 'activism', sizesText: '', skuBlock: '',
};

function toDraft(p: Product): ProductForm {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: String(p.price),
    image: p.image,
    kind: p.category,
    series: p.series || '',
    sizesText: p.variants.join(', '),
    skuBlock: '',
  };
}

function ProductsManager({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // Merchize import
  const [mLabel, setMLabel] = useState('Smart Peoples');
  const [mResults, setMResults] = useState<MerchizeCatalogProduct[]>([]);
  const [mSelected, setMSelected] = useState<Set<string>>(new Set());
  const [mSeries, setMSeries] = useState<'activism' | 'funny'>('funny');
  const [mPrice, setMPrice] = useState(40);
  const [mStatus, setMStatus] = useState('');
  const [mBusy, setMBusy] = useState(false);

  const load = () => api.getProducts().then(setProducts);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const sizes = form.sizesText.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image,
        kind: form.kind,
        series: form.kind === 'apparel' ? form.series : undefined,
        sizes,
        skuBlock: form.skuBlock,
      };
      if (editing && form.id.startsWith('prod_')) {
        const out = await guard(adminApi.call(token, 'update-product', { ...payload, id: form.id }));
        if (out.skusParsed) setStatus(`Saved — ${out.skusParsed} SKU(s) recorded.`);
      } else {
        await guard(adminApi.call(token, 'create-product', payload));
      }
      setForm(emptyProduct);
      setEditing(false);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setBusy(false);
    }
  };

  const archive = async (id: string, name: string) => {
    if (!id.startsWith('prod_')) {
      alert('Import the built-in catalog first (below) before removing this product.');
      return;
    }
    if (!confirm(`Remove "${name}"?`)) return;
    await guard(adminApi.call(token, 'archive-product', { id }));
    await load();
  };

  const importLegacy = async () => {
    setBusy(true);
    try {
      const out = await guard(adminApi.call(token, 'import-legacy', {}));
      const created = (out.results || []).filter((r: { status: string }) => r.status === 'created').length;
      setStatus(created ? `Imported ${created} built-in product(s) — now editable below.` : 'Nothing new to import.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const scanMerchize = async () => {
    setMBusy(true);
    setMStatus('');
    setMResults([]);
    setMSelected(new Set());
    try {
      const data = await guard(adminApi.get(token, 'merchize-scan', { label: mLabel }));
      setMResults(data.products);
      setMSelected(new Set(data.products.map((p: MerchizeCatalogProduct) => p.id)));
      if (data.products.length === 0) {
        const known = data.labels.length ? ` Categories seen in the account: ${data.labels.join(', ')}.` : '';
        setMStatus(`No products found under "${mLabel}".${known}`);
      }
    } catch (err) {
      setMStatus(err instanceof Error ? err.message : 'Failed to reach the server.');
    } finally {
      setMBusy(false);
    }
  };

  const toggleMerchize = (id: string) => {
    setMSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const importMerchize = async () => {
    const ids = mResults.filter((p) => mSelected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    setMBusy(true);
    setMStatus('');
    try {
      const data = await guard(adminApi.call(token, 'merchize-import', { ids, label: mLabel, series: mSeries, price: mPrice }));
      setMStatus(`Imported ${data.imported.length} product(s).`);
      setMResults([]);
      setMSelected(new Set());
      await load();
    } catch (err) {
      setMStatus(err instanceof Error ? err.message : 'Failed to reach the server.');
    } finally {
      setMBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border border-teal/30 bg-teal/5 p-5">
        <h4 className="font-display text-lg uppercase text-teal">Before editing the launch hoodies</h4>
        <p className="mt-2 text-sm text-white/60">
          The two launch hoodies and the sticker pack ship as built-in defaults so the shop always shows something.
          Editing one here requires it to exist in Stripe first — safe to click again later, it skips anything already imported.
        </p>
        <div className="mt-3">
          <AdminButton variant="outline" onClick={importLegacy} disabled={busy}>
            {busy ? 'Working…' : 'Import built-in catalog into Stripe'}
          </AdminButton>
        </div>
      </div>

      <div className="border border-white/15 p-5">
        <h4 className="font-display text-lg uppercase">Import from Merchize</h4>
        <p className="mt-2 text-sm text-white/50">Pull designs already set up in the shared Merchize account by category.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <TextInput value={mLabel} onChange={(e) => setMLabel(e.target.value)} placeholder="Merchize category (e.g. Smart Peoples)" />
          <AdminButton onClick={scanMerchize} disabled={mBusy || !mLabel}>{mBusy ? 'Working…' : 'Fetch'}</AdminButton>
        </div>
        {mStatus && <p className="mt-3 text-sm text-white/60">{mStatus}</p>}
        {mResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={mSeries} onChange={(e) => setMSeries(e.target.value as 'activism' | 'funny')} className={inputCls}>
                <option value="activism">Activism (Tourette's)</option>
                <option value="funny">Funny (no category)</option>
              </select>
              <TextInput type="number" value={mPrice} onChange={(e) => setMPrice(parseFloat(e.target.value) || 0)} placeholder="Price ($)" />
            </div>
            <div className="max-h-72 space-y-1.5 overflow-auto">
              {mResults.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 border border-white/15 p-2">
                  <input type="checkbox" checked={mSelected.has(p.id)} onChange={() => toggleMerchize(p.id)} />
                  {p.image && <img src={p.image} alt={p.title} className="h-10 w-10 border border-white/15 object-cover" />}
                  <span className="flex-1 text-sm">{p.title}</span>
                  <span className="text-xs text-white/40">{p.sizes.length} size(s)</span>
                </label>
              ))}
            </div>
            <AdminButton onClick={importMerchize} disabled={mBusy || mSelected.size === 0}>
              Import {mSelected.size} selected
            </AdminButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="display-md mb-5">Products <span className="text-white/30">({products.length})</span></h3>
          <div className="space-y-2">
            {products.map((p) => {
              const editable = p.id.startsWith('prod_');
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 border border-white/15 px-4 py-3">
                  {p.image && <img src={p.image} alt="" className="h-10 w-10 border border-white/15 object-cover" />}
                  <span className="font-semibold">{p.name}</span>
                  <span className="font-display text-teal">${p.price}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {p.category === 'apparel' ? p.series || 'apparel' : 'accessories'}
                  </span>
                  <span className="ml-auto flex gap-2">
                    <AdminButton variant="outline" onClick={() => { setForm(toDraft(p)); setEditing(true); }}>Edit</AdminButton>
                    <AdminButton variant="danger" onClick={() => archive(p.id, p.name)} disabled={!editable}>Delete</AdminButton>
                  </span>
                </div>
              );
            })}
            {products.length === 0 && <p className="border border-dashed border-white/20 p-6 text-center text-white/40">Nothing here yet</p>}
          </div>
        </div>

        <form onSubmit={submit} className="h-fit space-y-4 border border-white/15 p-6 lg:col-span-2">
          <h4 className="font-display text-xl uppercase">{editing ? 'Edit product' : 'Add a product'}</h4>
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (USD)">
              <TextInput type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </Field>
            <Field label="Kind">
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ProductForm['kind'] })} className={inputCls}>
                <option value="apparel">Apparel</option>
                <option value="accessories">Accessories</option>
              </select>
            </Field>
          </div>
          {form.kind === 'apparel' && (
            <Field label="Series">
              <select value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value as ProductForm['series'] })} className={inputCls}>
                <option value="activism">Activism (Tourette's)</option>
                <option value="funny">Funny (no category)</option>
              </select>
            </Field>
          )}
          <Field label="Image URL">
            <TextInput value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </Field>
          <Field label="Sizes" hint="Comma separated: S, M, L, XL">
            <TextInput value={form.sizesText} onChange={(e) => setForm({ ...form, sizesText: e.target.value })} />
          </Field>
          {form.kind === 'apparel' && (
            <Field label="Merchize SKUs" hint="Paste the variant block from Merchize — 'SKU: xxx' / 'size: M' pairs. Adds to what's already saved.">
              <textarea value={form.skuBlock} onChange={(e) => setForm({ ...form, skuBlock: e.target.value })} rows={3} className={inputCls} placeholder={'SKU: LWHDVN000000AA01\nsize: S'} />
            </Field>
          )}
          {status && <p className="text-sm text-white/60">{status}</p>}
          <div className="flex gap-3 pt-2">
            <AdminButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</AdminButton>
            {editing && <AdminButton variant="outline" onClick={() => { setForm(emptyProduct); setEditing(false); }}>Cancel</AdminButton>}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Settings manager ─────────────────────────────────────────────────── */

const SETTING_FIELDS: { key: keyof SiteSettings; label: string; hint?: string }[] = [
  { key: 'cashAppTag', label: 'Cash App tag', hint: 'Shown in the donate modal' },
  { key: 'contactEmail', label: 'General inquiries email' },
  { key: 'bookingEmail', label: 'Booking email' },
  { key: 'location', label: 'Home base', hint: 'Shown in the footer' },
  { key: 'patreonUrl', label: 'Patreon URL', hint: 'Leave empty to hide the Patreon button' },
  { key: 'instagramUrl', label: 'Instagram URL' },
  { key: 'tiktokUrl', label: 'TikTok URL' },
  { key: 'youtubeUrl', label: 'YouTube URL' },
  { key: 'twitchUrl', label: 'Twitch URL' },
];

function SettingsManager({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    guard(adminApi.get(token, 'settings')).then((data) => setDraft(data.settings));
  }, [token]);

  if (!draft) return <p className="text-white/50">Loading settings…</p>;

  const save = async () => {
    setBusy(true);
    try {
      await guard(adminApi.call(token, 'update-settings', { ...draft }));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h3 className="display-md mb-6">Site settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SETTING_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <TextInput value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            </Field>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-8">
        <h3 className="display-md mb-2">Merchize connection</h3>
        <p className="mb-6 text-sm text-white/50">
          Set MERCHIZE_BASE_URL and MERCHIZE_ACCESS_TOKEN in Vercel (Settings → Environment Variables) — kept out of this
          dashboard on purpose, same as Stripe's key.
        </p>
        <MerchizeStatus token={token} />
      </div>

      <div className="flex items-center gap-4">
        <AdminButton onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save all settings'}</AdminButton>
        {savedFlash && <span className="font-hand text-xl text-teal">saved!</span>}
      </div>

      <ChangePassword token={token} />
    </div>
  );
}

function MerchizeStatus({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const test = async () => {
    setBusy(true);
    setResult('');
    try {
      const r = await guard(adminApi.get(token, 'test-merchize'));
      if (r.ok) setResult(`connected via ${r.auth} — ${r.base}`);
      else if (r.reason === 'not_configured') setResult('Not connected — set the env vars in Vercel first');
      else if (r.reason === 'auth_rejected') setResult('Credentials rejected — double-check the token in Vercel');
      else setResult(`Connection failed: ${r.reason}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border border-white/15 p-4">
      <AdminButton variant="outline" onClick={test} disabled={busy}>{busy ? 'Testing…' : 'Test connection'}</AdminButton>
      {result && <StatusDot ok={result.startsWith('connected')} label={result} />}
    </div>
  );
}

function ChangePassword({ token }: { token: string }) {
  const guard = useAuthGuard();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (newPassword.length < 8) return setMsg('Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setMsg("Passwords don't match.");
    setBusy(true);
    try {
      await guard(adminApi.call(token, 'change-password', { newPassword }));
      setMsg('Password changed.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-white/10 pt-8">
      <h3 className="display-md mb-6">Change password</h3>
      <p className="mb-4 text-xs text-white/40">
        There's also a break-glass override password, set only in Vercel (ADMIN_PASSWORD) for whoever controls the
        deployment — it always works even if this one is lost.
      </p>
      <form className="grid max-w-md grid-cols-1 gap-4" onSubmit={submit}>
        <Field label="New password" hint="At least 8 characters">
          <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </Field>
        <div className="flex items-center gap-4">
          <AdminButton type="submit" disabled={busy}>Change it</AdminButton>
          {msg && <span className="text-sm text-white/60">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

/* ── Page shell ───────────────────────────────────────────────────────── */

const TABS = ['Shows', 'Videos', 'Photos', 'Products', 'Settings'] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [tab, setTab] = useState<Tab>('Shows');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    document.title = 'Backstage — Zachariah Tippett';
  }, []);

  if (!token || authError) {
    return <LoginGate onLogin={(t) => { setAuthError(false); setToken(t); }} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0b]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-5 py-4 md:px-8">
          <span className="font-hand text-2xl text-teal">backstage</span>
          <nav className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                  tab === t ? 'bg-teal text-[#0a0a0b]' : 'text-white/55 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <a href="/" className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-teal">View site</a>
            <button
              onClick={() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }}
              className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-red-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-10 md:px-8">
        <AuthBoundary onUnauthorized={() => setAuthError(true)}>
          {tab === 'Shows' && <ShowsManager token={token} />}
          {tab === 'Videos' && <VideosManager token={token} />}
          {tab === 'Photos' && <PhotosManager token={token} />}
          {tab === 'Products' && <ProductsManager token={token} />}
          {tab === 'Settings' && <SettingsManager token={token} />}
        </AuthBoundary>
      </main>
    </div>
  );
}

/** Catches an expired/missing token bubbled up from any manager → back to login. */
class AuthBoundary extends Component<{ children: ReactNode; onUnauthorized: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (error instanceof Unauthorized) {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
      this.props.onUnauthorized();
    }
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
