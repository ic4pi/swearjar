import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { trpc, getAdminToken } from "@/providers/trpc";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Admin dashboard. Login-gated with the site password; token lives in
   localStorage and rides as a Bearer header. An AuthBoundary class
   component catches UNAUTHORIZED (expired / revoked token) anywhere below
   and bounces back to the login gate.
   ────────────────────────────────────────────────────────────────────── */

type Tab = "shows" | "products" | "settings";

class AuthBoundary extends Component<{ children: ReactNode; onUnauthorized: () => void }, { hit: boolean }> {
  state = { hit: false };
  static getDerivedStateFromError(err: unknown) {
    if (err instanceof Error && err.message.includes("UNAUTHORIZED")) return { hit: true };
    throw err;
  }
  componentDidUpdate(_: unknown, prev: { hit: boolean }) {
    if (!prev.hit && this.state.hit) this.props.onUnauthorized();
  }
  render() {
    return this.state.hit ? null : this.props.children;
  }
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [tab, setTab] = useState<Tab>("shows");

  if (!token) {
    return <LoginGate onSuccess={setToken} />;
  }

  return (
    <AuthBoundary onUnauthorized={() => setToken(null)}>
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-hand text-xl text-teal">zt dashboard</p>
              <h1 className="display-md !text-3xl">Manage the site</h1>
            </div>
            <div className="flex items-center gap-2">
              {(["shows", "products", "settings"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "border-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                    tab === t ? "border-teal bg-teal text-[#0a0a0b]" : "border-white/20 text-white/70 hover:border-teal hover:text-teal",
                  )}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => {
                  localStorage.removeItem("zt_admin_token");
                  setToken(null);
                }}
                className="ml-2 border-2 border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/50 transition-colors hover:border-white/60 hover:text-white"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-10">
          {tab === "shows" && <ShowsManager />}
          {tab === "products" && <ProductsManager />}
          {tab === "settings" && <SettingsManager />}
        </main>
      </div>
    </AuthBoundary>
  );
}

/* ── Login ─────────────────────────────────────────────────────────────── */

function LoginGate({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("zt_admin_token", data.token);
      onSuccess(data.token);
    },
    onError: (e) => setError(e.message === "Wrong password" ? "Wrong password — try again." : "Login failed. Try again."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-5 text-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          login.mutate({ password });
        }}
        className="w-full max-w-sm border-2 border-white/15 bg-[#111112] p-8"
      >
        <p className="font-hand text-2xl text-teal">zt dashboard</p>
        <h1 className="display-md mt-1">Sign in</h1>
        <label className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-2 w-full border-2 border-white/20 bg-transparent px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition-colors focus:border-teal"
          />
        </label>
        {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={login.isPending}
          className="mt-6 w-full bg-teal px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0a0a0b] transition-colors hover:bg-white disabled:opacity-50"
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
        <a href="/" className="mt-4 block text-center text-xs uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-teal">
          ← back to site
        </a>
      </form>
    </div>
  );
}

/* ── Shared bits ───────────────────────────────────────────────────────── */

const inputCls =
  "w-full border-2 border-white/15 bg-[#0a0a0b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-teal";

const labelCls = "block text-[11px] font-bold uppercase tracking-[0.18em] text-white/55";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelCls}>
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors",
        checked ? "text-teal" : "text-white/40",
      )}
    >
      <span className={cn("inline-block h-4 w-8 border-2 transition-colors", checked ? "border-teal bg-teal" : "border-white/30 bg-transparent")} />
      {label}
    </button>
  );
}

/* ── Shows manager ─────────────────────────────────────────────────────── */

type ShowRow = {
  id: number;
  dateLabel: string;
  venue: string;
  location: string;
  ticketUrl: string;
  sortOrder: number;
  active: boolean;
};

const EMPTY_SHOW: Omit<ShowRow, "id"> = { dateLabel: "", venue: "", location: "", ticketUrl: "", sortOrder: 0, active: true };

function ShowsManager() {
  const utils = trpc.useUtils();
  const { data: shows, isLoading } = trpc.shows.listAll.useQuery();
  const [editing, setEditing] = useState<(Omit<ShowRow, "id"> & { id?: number }) | null>(null);

  const create = trpc.shows.create.useMutation({ onSuccess: () => { utils.shows.listAll.invalidate(); utils.shows.list.invalidate(); setEditing(null); } });
  const update = trpc.shows.update.useMutation({ onSuccess: () => { utils.shows.listAll.invalidate(); utils.shows.list.invalidate(); setEditing(null); } });
  const remove = trpc.shows.remove.useMutation({ onSuccess: () => { utils.shows.listAll.invalidate(); utils.shows.list.invalidate(); } });

  if (isLoading) return <p className="text-white/50">Loading shows…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {shows?.filter((s) => s.active).length ?? 0} active · {shows?.length ?? 0} total — the two lowest sort-order active shows are featured on the homepage.
        </p>
        <button
          onClick={() => setEditing({ ...EMPTY_SHOW })}
          className="border-2 border-teal bg-teal px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0a0a0b] transition-colors hover:bg-transparent hover:text-teal"
        >
          + Add show
        </button>
      </div>

      {editing && (
        <EditorCard title={editing.id ? "Edit show" : "New show"} onCancel={() => setEditing(null)} onSave={() => (editing.id ? update.mutate(editing as ShowRow) : create.mutate(editing))} busy={create.isPending || update.isPending}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date or weekday *">
              <input className={inputCls} value={editing.dateLabel} onChange={(e) => setEditing({ ...editing, dateLabel: e.target.value })} placeholder="Mar 15, 2026 — or 'Sunday' for recurring" />
            </Field>
            <Field label="Venue *">
              <input className={inputCls} value={editing.venue} onChange={(e) => setEditing({ ...editing, venue: e.target.value })} placeholder="The Laugh Lounge" />
            </Field>
            <Field label="Location *">
              <input className={inputCls} value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Austin, TX" />
            </Field>
            <Field label="Ticket URL">
              <input className={inputCls} value={editing.ticketUrl} onChange={(e) => setEditing({ ...editing, ticketUrl: e.target.value })} placeholder="https://… (leave blank for no tickets)" />
            </Field>
            <Field label="Sort order (lower = sooner)">
              <input type="number" className={inputCls} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label={editing.active ? "Visible on site" : "Hidden"} />
            </div>
          </div>
        </EditorCard>
      )}

      <div className="space-y-2">
        {shows?.map((s) => (
          <div key={s.id} className={cn("flex flex-wrap items-center gap-3 border-2 border-white/10 bg-[#111112] px-4 py-3", !s.active && "opacity-45")}>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg uppercase leading-tight">
                {s.dateLabel} <span className="text-white/40">·</span> {s.venue}
              </div>
              <div className="truncate text-xs uppercase tracking-[0.15em] text-white/45">
                {s.location}
                {s.ticketUrl ? " · tickets linked" : " · no ticket link"}
                {" · order "}{s.sortOrder}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...s })} className="border-2 border-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 transition-colors hover:border-teal hover:text-teal">Edit</button>
              <button onClick={() => remove.mutate({ id: s.id })} className="border-2 border-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 transition-colors hover:border-red-400 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
        {shows?.length === 0 && <p className="text-white/40">No shows yet — add the first one.</p>}
      </div>
    </div>
  );
}

/* ── Products manager ──────────────────────────────────────────────────── */

type ProductRow = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: "activism" | "funny" | "odds";
  merchizeUrl: string;
  variants: string;
  sortOrder: number;
  active: boolean;
};

const EMPTY_PRODUCT: Omit<ProductRow, "id"> = { name: "", description: "", priceCents: 0, image: "", category: "activism", merchizeUrl: "", variants: "", sortOrder: 0, active: true };

const CATEGORIES: { value: ProductRow["category"]; label: string }[] = [
  { value: "activism", label: "Multipurpose Apparel" },
  { value: "funny", label: "Just Funny" },
  { value: "odds", label: "Odds & Ends (hidden until it has products)" },
];

function ProductsManager() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.listAll.useQuery();
  const [editing, setEditing] = useState<(Omit<ProductRow, "id"> & { id?: number }) | null>(null);
  const [filter, setFilter] = useState<ProductRow["category"] | "all">("all");

  const create = trpc.products.create.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); utils.products.list.invalidate(); setEditing(null); } });
  const update = trpc.products.update.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); utils.products.list.invalidate(); setEditing(null); } });
  const remove = trpc.products.remove.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); utils.products.list.invalidate(); } });

  const counts = useMemo(() => {
    const c: Record<string, number> = { activism: 0, funny: 0, odds: 0 };
    products?.forEach((p) => { c[p.category] += 1; });
    return c;
  }, [products]);

  if (isLoading) return <p className="text-white/50">Loading products…</p>;

  const visible = products?.filter((p) => filter === "all" || p.category === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "activism", "funny", "odds"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "border-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                filter === f ? "border-teal bg-teal text-[#0a0a0b]" : "border-white/20 text-white/60 hover:border-teal hover:text-teal",
              )}
            >
              {f === "all" ? "All" : CATEGORIES.find((c) => c.value === f)?.label}
              {f !== "all" && <span className="ml-1 opacity-60">{counts[f]}</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY_PRODUCT })}
          className="border-2 border-teal bg-teal px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0a0a0b] transition-colors hover:bg-transparent hover:text-teal"
        >
          + Add product
        </button>
      </div>

      {editing && (
        <EditorCard title={editing.id ? "Edit product" : "New product"} onCancel={() => setEditing(null)} onSave={() => (editing.id ? update.mutate(editing as ProductRow) : create.mutate(editing))} busy={create.isPending || update.isPending}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Tic & Talk Hoodie" />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as ProductRow["category"] })}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Price (dollars)">
              <input type="number" min="0" step="0.01" className={inputCls} value={(editing.priceCents / 100).toString()} onChange={(e) => setEditing({ ...editing, priceCents: Math.round(Number(e.target.value) * 100) })} placeholder="45.00" />
            </Field>
            <Field label="Image path">
              <input className={inputCls} value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="/product_sweater_1.jpg" />
            </Field>
            <Field label="Merchize product URL">
              <input className={inputCls} value={editing.merchizeUrl} onChange={(e) => setEditing({ ...editing, merchizeUrl: e.target.value })} placeholder="https://merchize.com/…" />
            </Field>
            <Field label="Variants (comma-separated)">
              <input className={inputCls} value={editing.variants} onChange={(e) => setEditing({ ...editing, variants: e.target.value })} placeholder="Unisex Hoodie, Unisex T-Shirt" />
            </Field>
            <Field label="Sort order">
              <input type="number" className={inputCls} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label={editing.active ? "Visible on site" : "Hidden"} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea rows={2} className={inputCls} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Short, punchy, one line if you can." />
              </Field>
            </div>
          </div>
        </EditorCard>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visible?.map((p) => (
          <div key={p.id} className={cn("flex gap-4 border-2 border-white/10 bg-[#111112] p-4", !p.active && "opacity-45")}>
            <div className="h-20 w-20 shrink-0 overflow-hidden border-2 border-white/10 bg-[#0a0a0b]">
              {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-white/30">no img</div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base uppercase leading-tight">{p.name}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-teal">
                {CATEGORIES.find((c) => c.value === p.category)?.label}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {(p.priceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                {p.variants ? ` · ${p.variants}` : ""}
                {p.merchizeUrl ? " · merchize linked" : ""}
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setEditing({ ...p })} className="border-2 border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 transition-colors hover:border-teal hover:text-teal">Edit</button>
                <button onClick={() => remove.mutate({ id: p.id })} className="border-2 border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 transition-colors hover:border-red-400 hover:text-red-400">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {visible?.length === 0 && <p className="text-white/40">Nothing here yet.</p>}

      <MerchizeStatus />
    </div>
  );
}

/* ── Merchize status + catalog browser ─────────────────────────────────── */

function StatusDot({ ok }: { ok: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        ok === true && "bg-teal",
        ok === false && "bg-red-400",
        ok === null && "bg-white/30",
      )}
    />
  );
}

function MerchizeStatus() {
  const { data: settings } = trpc.admin.getSettings.useQuery();
  const test = trpc.merchize.testConnection.useMutation();
  const catalog = trpc.merchize.catalog.useMutation();

  const configured = Boolean(settings?.merchize_base_url && settings?.merchize_access_token);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (test.data) setOk(test.data.ok);
  }, [test.data]);

  return (
    <div className="border-2 border-white/10 bg-[#111112] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot ok={ok} />
            <h3 className="font-display text-lg uppercase">Merchize connection</h3>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {configured
              ? "Credentials saved in Settings. Test the connection, then browse the catalog to copy product details into the shop."
              : "Not configured — add your Merchize base URL and access token in the Settings tab."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => test.mutate()}
            disabled={!configured || test.isPending}
            className="border-2 border-teal px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal transition-colors hover:bg-teal hover:text-[#0a0a0b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {test.isPending ? "Testing…" : "Test connection"}
          </button>
          <button
            onClick={() => catalog.mutate({})}
            disabled={!configured || catalog.isPending}
            className="border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-40"
          >
            {catalog.isPending ? "Loading…" : "Browse catalog"}
          </button>
        </div>
      </div>

      {test.data && !test.data.ok && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-red-400">
          Connection failed{test.data.reason ? `: ${test.data.reason}` : ""} — check the base URL and token in Settings.
        </p>
      )}
      {test.data?.ok && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-teal">
          Connected ({test.data.auth}) — {test.data.base}
        </p>
      )}

      {catalog.data && !catalog.data.ok && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-red-400">
          Catalog fetch failed: {catalog.data.reason}
        </p>
      )}
      {catalog.data?.ok && (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">
            {catalog.data.products.length} products ({catalog.data.total} total) · endpoint {catalog.data.endpoint}
            {catalog.data.labels.length > 0 && <> · labels: {catalog.data.labels.join(", ")}</>}
          </p>
          <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {catalog.data.products.map((p) => (
              <div key={p.id} className="flex gap-3 border-2 border-white/10 bg-[#0a0a0b] p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden border-2 border-white/10">
                  {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="truncate text-[11px] uppercase tracking-wider text-white/45">
                    {p.sizes.length > 0 ? `sizes: ${p.sizes.join(" / ")}` : "no variants listed"}
                  </div>
                  {p.labels.length > 0 && (
                    <div className="truncate text-[11px] uppercase tracking-wider text-teal/80">{p.labels.join(" · ")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Settings manager ──────────────────────────────────────────────────── */

const SETTING_FIELDS: { key: string; label: string; hint: string; placeholder?: string }[] = [
  { key: "heroVideoUrl", label: "Hero video URL", hint: "Full URL to the hero video (e.g. your Vercel blob). Falls back to the bundled Kill Tony clip if blank.", placeholder: "https://swearjar-two.vercel.app/video/zach-kill-tony.mp4" },
  { key: "cashAppTag", label: "Cash App tag", hint: "Shown in the donation modal.", placeholder: "$TourettesInc" },
  { key: "patreonUrl", label: "Patreon URL", hint: "Optional — shown as a second donation option.", placeholder: "https://patreon.com/…" },
  { key: "contactEmail", label: "General inquiries email", hint: "Public contact lane #1.", placeholder: "you@gmail.com" },
  { key: "bookingEmail", label: "Booking email", hint: "Public contact lane #2 — prefills a booking brief.", placeholder: "bookings@gmail.com" },
  { key: "location", label: "Location line", hint: "Shown in the footer / about.", placeholder: "San Antonio, Texas" },
  { key: "instagramUrl", label: "Instagram URL", hint: "", placeholder: "https://instagram.com/…" },
  { key: "tiktokUrl", label: "TikTok URL", hint: "", placeholder: "https://tiktok.com/@…" },
  { key: "youtubeUrl", label: "YouTube URL", hint: "", placeholder: "https://youtube.com/@…" },
  { key: "twitchUrl", label: "Twitch URL", hint: "", placeholder: "https://twitch.tv/…" },
];

function SettingsManager() {
  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery();
  const save = trpc.admin.saveSettings.useMutation();
  const changePw = trpc.admin.changePassword.useMutation();

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  if (isLoading) return <p className="text-white/50">Loading settings…</p>;

  const dirty = JSON.stringify(form) !== JSON.stringify(settings ?? {});

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl uppercase">Site settings</h2>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Saved ✓</span>}
            <button
              onClick={() =>
                save.mutate(form, {
                  onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2500);
                  },
                })
              }
              disabled={!dirty || save.isPending}
              className="border-2 border-teal bg-teal px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0a0a0b] transition-colors hover:bg-transparent hover:text-teal disabled:cursor-not-allowed disabled:opacity-40"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SETTING_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                className={inputCls}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder ?? ""}
              />
              {f.hint && <p className="mt-1.5 text-[11px] normal-case tracking-normal text-white/40">{f.hint}</p>}
            </Field>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-white/10 pt-8">
        <h2 className="font-display text-xl uppercase">Merchize credentials</h2>
        <p className="mt-1 text-xs text-white/50">Stored server-side only — never exposed to the public site.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Merchize base URL">
            <input
              className={inputCls}
              value={form["merchize_base_url"] ?? ""}
              onChange={(e) => setForm({ ...form, merchize_base_url: e.target.value })}
              placeholder="https://api.merchize.com"
            />
          </Field>
          <Field label="Merchize access token">
            <input
              type="password"
              className={inputCls}
              value={form["merchize_access_token"] ?? ""}
              onChange={(e) => setForm({ ...form, merchize_access_token: e.target.value })}
              placeholder="paste token — X-API-Key or Bearer both work"
            />
          </Field>
        </div>
      </section>

      <section className="border-t-2 border-white/10 pt-8">
        <h2 className="font-display text-xl uppercase">Change password</h2>
        <div className="mt-4 grid max-w-md grid-cols-1 gap-4">
          <Field label="Current password">
            <input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="New password (min 8 chars)">
            <input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          {pwMsg && <p className={cn("text-xs font-semibold", pwMsg.startsWith("Changed") ? "text-teal" : "text-red-400")}>{pwMsg}</p>}
          <button
            onClick={() => {
              setPwMsg("");
              if (pw.next.length < 8) return setPwMsg("New password must be at least 8 characters.");
              if (pw.next !== pw.confirm) return setPwMsg("New passwords don't match.");
              changePw.mutate(
                { current: pw.current, next: pw.next },
                {
                  onSuccess: () => {
                    setPwMsg("Changed ✓ — use the new password next time you sign in.");
                    setPw({ current: "", next: "", confirm: "" });
                  },
                  onError: (e) => setPwMsg(e.message || "Couldn't change password."),
                },
              );
            }}
            disabled={changePw.isPending}
            className="border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-teal hover:text-teal disabled:opacity-40"
          >
            {changePw.isPending ? "Changing…" : "Change password"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ── Editor shell ──────────────────────────────────────────────────────── */

function EditorCard({
  title,
  children,
  onSave,
  onCancel,
  busy,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="border-2 border-teal/50 bg-[#111112] p-6">
      <h3 className="font-display text-lg uppercase">{title}</h3>
      <div className="mt-4">{children}</div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onSave}
          disabled={busy}
          className="border-2 border-teal bg-teal px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0a0a0b] transition-colors hover:bg-transparent hover:text-teal disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="border-2 border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
