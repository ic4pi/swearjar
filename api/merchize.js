/* ── MERCHIZE FULFILLMENT CLIENT ──
   swearjar and hexposed run fulfillment through the same Merchize account.
   Their storefront builder is the paid product; fulfillment is free — sell
   on your own site, hand Merchize the order, they print, pack and ship it.
   swearjar stays the store, Stripe stays the checkout, Merchize is only
   the print partner behind it.

   Set these in Vercel (Settings -> Environment Variables), never here:
     MERCHIZE_BASE_URL    e.g. https://<store>.merchize.store/bo-api
     MERCHIZE_ACCESS_TOKEN / MERCHIZE_API_KEY — either credential from the
       Merchize API page works; both header styles are tried below so a
       mismatched paste costs a retry, not a deploy.

   If MERCHIZE_BASE_URL/credential are unset, order pushes are skipped and
   logged, so the site keeps taking payments safely while Merchize is
   finished being set up.
── */

const { isApparel, isAccessory, priceCents: builtInPriceCents, imageFor, skuFor } = require('./_apparel');

// swearjar and hexposed have historically used slightly different names
// for the same three env vars while moving to one shared Merchize account
// — take whichever is filled in rather than insist on one spelling.
function merchizeBase() {
  return process.env.MERCHIZE_BASE_URL || process.env.MERCHIZE_API_BASE || process.env.MERCHIZE_API_BASE_URL || '';
}

function merchizeKey() {
  return process.env.MERCHIZE_ACCESS_TOKEN || process.env.MERCHIZE_API_KEY || process.env.MERCHIZE_API_TOKEN || '';
}

function isConfigured() {
  return Boolean(merchizeBase() && merchizeKey());
}

// X-API-Key first: that's the confirmed-working style for this shared
// account's /product/products endpoint (see the Merchize connection work
// on claude/merchize-account-connection-2jmzy6). Bearer is tried next in
// case a different endpoint on this account expects it.
const AUTH_ATTEMPTS = [
  { label: 'api-key', headers: (key) => ({ 'X-API-Key': key }) },
  { label: 'bearer', headers: (key) => ({ Authorization: `Bearer ${key}` }) },
];

// Products added or edited through /admin keep their SKUs in Stripe
// product metadata; the dashboard wins over the built-in map when both
// have one, since the map is a snapshot that goes stale the moment a
// product is re-listed in Merchize or the shop moves to a different
// Merchize account.
async function skuForAsync(name, size) {
  try {
    const { findByName } = require('./_catalog');
    const dynamic = await findByName(name);
    const fromDashboard = dynamic && dynamic.skus && dynamic.skus[size];
    if (fromDashboard) return fromDashboard;
  } catch (err) {
    console.warn('dynamic SKU lookup failed for', name, size, err.message);
  }
  return skuFor(name, size);
}

// Price and artwork for an item being fulfilled. Stripe (a product added
// or edited through /admin) is checked first — same "dashboard wins" rule
// as the SKU lookup above — and the built-in hoodies/sticker pack are the
// fallback for anything never touched in /admin. Any failure here degrades
// to sending the SKU alone rather than dropping the order.
async function itemDetails(name, size) {
  const sku = await skuForAsync(name, size);
  try {
    const { findByName } = require('./_catalog');
    const dynamic = await findByName(name);
    if (dynamic) return { sku, priceCents: dynamic.priceCents, image: dynamic.image };
  } catch (err) {
    console.warn('item detail lookup failed for', name, err.message);
  }
  if (isApparel(name) || isAccessory(name)) {
    return { sku, priceCents: builtInPriceCents(name, size), image: imageFor(name) };
  }
  return { sku };
}

// Merchize fetches the artwork from the URL given per item, so a relative
// path like /product_sticker_1.jpg has to be made absolute before it
// leaves here.
function resolveImageUrl(image) {
  if (!image) return undefined;
  if (/^https?:\/\//.test(image)) return image;
  const origin = (
    process.env.SITE_ORIGIN ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    ''
  ).replace(/\/$/, '');
  if (!origin) return undefined;
  return `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
}

/* Builds the create-order request body. Follows Merchize's documented
   "Import external orders" call (seller.merchize.com/a/api-documents ->
   Orders) — the same call this site has fulfilled through since before
   this migration, so the shape is known good, not guessed. */
function buildMerchizeOrderPayload({ externalNumber, email, shipping, items }) {
  return {
    order_id: externalNumber,
    shipping_info: {
      full_name: shipping.name,
      address_1: shipping.address.line1,
      address_2: shipping.address.line2 || '',
      city: shipping.address.city,
      state: shipping.address.state,
      postcode: shipping.address.postal_code,
      country: shipping.address.country,
      email,
      phone: shipping.phone || '',
    },
    items: items.map((item) => ({
      name: item.name,
      // Sent under both names since it's unclear which one every account
      // generation reads — costs nothing to send both.
      sku: item.sku,
      merchize_sku: item.sku,
      quantity: item.qty,
      price: (item.priceCents || 0) / 100,
      currency: 'USD',
      image: resolveImageUrl(item.image),
      attributes: [{ name: 'Size', option: item.size || 'Default' }],
    })),
  };
}

/* Pushes one order to Merchize for fulfillment. Never throws — the caller
   is a Stripe webhook running after the card has already been charged, so
   a Merchize outage must not turn into a failed webhook (Stripe would
   retry, and a retry that succeeds on the Merchize side would print the
   order twice). On any failure this logs everything needed to place the
   order by hand and returns { ok: false }. */
async function createMerchizeOrder({ externalNumber, email, shipping, items }) {
  const base = merchizeBase();
  const key = merchizeKey();

  if (!base || !key) {
    console.log('Merchize not configured — fulfil this order by hand:', { externalNumber, email, shipping, items });
    return { ok: false, reason: 'not_configured' };
  }

  const resolved = [];
  for (const item of items) {
    resolved.push({ ...item, ...(await itemDetails(item.name, item.size)) });
  }
  items = resolved;

  const missingSku = items.filter((item) => !item.sku);
  if (missingSku.length) {
    console.warn('Merchize SKU missing, fulfil these by hand:', missingSku);
  }

  const payload = buildMerchizeOrderPayload({ externalNumber, email, shipping, items });
  const url = `${base.replace(/\/$/, '')}/order/external/orders`;

  let lastResult = null;
  for (const attempt of AUTH_ATTEMPTS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...attempt.headers(key) },
        body: JSON.stringify(payload),
      });

      const body = await response.text();

      if (response.ok) {
        console.log('Merchize order created:', { externalNumber, body, auth: attempt.label });
        return { ok: true };
      }

      console.error('Merchize order push failed:', { status: response.status, body, sent: payload, auth: attempt.label });
      lastResult = { ok: false, reason: 'http_' + response.status };

      if (response.status !== 401 && response.status !== 403) {
        return lastResult; // not an auth problem — trying the other style won't help
      }
    } catch (err) {
      console.error('Merchize order push errored:', err.message, { sent: payload, auth: attempt.label });
      return { ok: false, reason: 'network' };
    }
  }

  return lastResult; // both auth styles rejected — credential itself is likely wrong
}

/* Proves whether the credentials actually authenticate, without creating a
   real order — calls the read-only tracking lookup instead, and a made-up
   order number answering 'not found' still proves the base URL and
   credential are good. */
async function testConnection() {
  const base = merchizeBase();
  const key = merchizeKey();

  if (!base || !key) return { ok: false, reason: 'not_configured' };

  const url = `${base.replace(/\/$/, '')}/order/external/orders/tracking?external_number=connection-test`;

  for (const attempt of AUTH_ATTEMPTS) {
    try {
      const response = await fetch(url, { headers: attempt.headers(key) });
      const body = await response.text();

      if (response.ok) return { ok: true, auth: attempt.label, base };

      console.error('Merchize connection test failed:', { status: response.status, body, auth: attempt.label, url });

      if (response.status !== 401 && response.status !== 403) {
        return { ok: false, reason: 'http_' + response.status, auth: attempt.label };
      }
    } catch (err) {
      console.error('Merchize connection test errored:', err.message, { url, auth: attempt.label });
      return { ok: false, reason: 'network' };
    }
  }

  return { ok: false, reason: 'auth_rejected' };
}

/* ── READING THE MERCHIZE CATALOG ───────────────────────────────────────
   /product/products (X-API-Key) is the confirmed-working catalog endpoint
   for this shared account — GET /product/products for the listing, GET
   /product/products/{id}/variants for each product's per-size SKUs (this
   account doesn't return variant SKUs on the listing itself). The rest
   are fallback guesses tried after it in case a different store
   generation answers differently. Set MERCHIZE_PRODUCTS_PATH to pin one
   explicitly and skip the probing.
── */
const PRODUCT_ENDPOINTS = [
  { path: '/product/products', method: 'GET' },
  { path: '/product/external/products', method: 'GET' },
  { path: '/catalog/external/products', method: 'GET' },
  { path: '/products', method: 'GET' },
  { path: '/product/search', method: 'POST' },
];

function looksLikeProduct(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const named = ['title', 'name', 'product_name'].some((k) => typeof x[k] === 'string' && x[k].trim());
  if (!named) return false;
  return ['_id', 'id', 'product_id', 'slug', 'variants', 'sku', 'images'].some((k) => x[k] !== undefined);
}

// Merchize wraps its payloads differently per endpoint, so find the array
// rather than assuming where it sits.
function productArray(body) {
  if (Array.isArray(body)) return body;

  for (const key of ['data', 'products', 'items', 'results', 'records']) {
    const v = body && body[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      for (const inner of ['data', 'products', 'items', 'results', 'records']) {
        if (Array.isArray(v[inner])) return v[inner];
      }
    }
  }

  const queue = [body];
  const seen = new Set();
  let budget = 500;
  while (queue.length && budget-- > 0) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        if (value.some(looksLikeProduct)) return value;
        for (const entry of value) if (entry && typeof entry === 'object') queue.push(entry);
      } else if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }
  return null;
}

function firstString(obj, keys) {
  for (const k of keys) {
    const v = obj && obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

// Every value on a product that could be the thing it's organized by —
// collection, tag, type, category, folder — flattened into one list, so
// filtering by category doesn't depend on knowing which field this
// account files it under.
function labelsOf(raw) {
  const out = [];
  const push = (v) => {
    if (typeof v === 'string' && v.trim()) out.push(v.trim());
    else if (v && typeof v === 'object') {
      const name = firstString(v, ['name', 'title', 'slug', 'label']);
      if (name) out.push(name);
    }
  };
  for (const key of [
    'collection', 'collections', 'tag', 'tags', 'type', 'product_type',
    'category', 'categories', 'folder', 'group', 'brand', 'store',
  ]) {
    const v = raw && raw[key];
    if (Array.isArray(v)) v.forEach(push);
    else push(v);
  }
  return [...new Set(out)];
}

function variantsOf(raw) {
  const list = Array.isArray(raw && raw.variants) ? raw.variants : Array.isArray(raw && raw.variant) ? raw.variant : [];
  const out = [];
  for (const v of list) {
    const sku = firstString(v, ['sku', 'SKU', 'variant_sku', 'code']);
    if (!sku) continue;
    let size = firstString(v, ['size', 'Size', 'title', 'name', 'option1']);
    const attrs = v && (v.attributes || v.options || v.properties);
    if (Array.isArray(attrs)) {
      for (const a of attrs) {
        if (/size/i.test(firstString(a, ['name', 'key', 'label', 'type']))) {
          size = firstString(a, ['value', 'option', 'val']) || size;
        }
      }
    }
    if (!size) continue;
    out.push({ sku, size: size.toUpperCase() });
  }
  return out;
}

function shapeMerchizeProduct(raw) {
  const images = Array.isArray(raw && raw.images) ? raw.images : [];
  const image =
    firstString(raw, ['image', 'thumbnail', 'mockup', 'preview']) ||
    (typeof images[0] === 'string' ? images[0] : firstString(images[0] || {}, ['url', 'src']));
  const variants = variantsOf(raw);
  const skus = {};
  for (const v of variants) skus[v.size] = v.sku;
  return {
    id: firstString(raw, ['_id', 'id', 'product_id', 'slug']),
    title: firstString(raw, ['title', 'name', 'product_name']),
    image,
    labels: labelsOf(raw),
    sizes: variants.map((v) => v.size),
    skus,
  };
}

// This account's product listing doesn't carry per-size SKUs — only the
// product detail's /variants sub-resource does — so it's fetched
// separately per product, only for the (usually small) filtered set
// actually wanted rather than the whole catalog.
async function fetchVariantSkus(id, key) {
  const url = `${merchizeBase().replace(/\/$/, '')}/product/products/${id}/variants`;
  for (const attempt of AUTH_ATTEMPTS) {
    try {
      const response = await fetch(url, { headers: attempt.headers(key) });
      if (!response.ok) continue;
      const body = await response.json();
      const list = (body && body.data && body.data.variants) || (body && body.variants) || [];
      const skus = {};
      for (const v of list) {
        const sku = firstString(v, ['sku', 'SKU', 'variant_sku', 'code']);
        const size = firstString(v, ['title', 'size', 'Size', 'name']).toUpperCase();
        if (sku && size) skus[size] = sku;
      }
      return skus;
    } catch (err) {
      console.warn('Merchize variant lookup failed for', id, err.message);
    }
  }
  return {};
}

/* Fetch the catalog. `label` narrows to products carrying that collection
   / tag / category value, matched case-insensitively against any of them. */
async function listMerchizeProducts({ label = '' } = {}) {
  const base = merchizeBase();
  const key = merchizeKey();
  if (!base || !key) return { ok: false, reason: 'not_configured' };

  const root = base.replace(/\/$/, '');
  const pinned = process.env.MERCHIZE_PRODUCTS_PATH;
  const candidates = pinned ? [{ path: pinned, method: 'GET' }, { path: pinned, method: 'POST' }] : PRODUCT_ENDPOINTS;

  const tried = [];
  for (const candidate of candidates) {
    for (const attempt of AUTH_ATTEMPTS) {
      const url = `${root}${candidate.path}${candidate.method === 'GET' ? '?limit=100' : ''}`;
      try {
        const response = await fetch(url, {
          method: candidate.method,
          headers: {
            ...(candidate.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
            ...attempt.headers(key),
          },
          ...(candidate.method === 'POST' ? { body: JSON.stringify({ limit: 100 }) } : {}),
        });
        const text = await response.text();
        tried.push({
          url, method: candidate.method, auth: attempt.label, status: response.status,
          contentType: response.headers && response.headers.get ? response.headers.get('content-type') : '',
          sample: text.slice(0, 300),
        });

        if (!response.ok) {
          if (response.status !== 401 && response.status !== 403) break;
          continue;
        }

        let body;
        try {
          body = JSON.parse(text);
        } catch (_) {
          tried[tried.length - 1].notJson = true;
          break;
        }
        const array = productArray(body);
        if (!array) {
          console.error('Merchize: endpoint answered but no product list found', {
            url, topLevelKeys: body && typeof body === 'object' ? Object.keys(body) : typeof body, sample: text.slice(0, 1200),
          });
          tried[tried.length - 1].answered = true;
          break;
        }

        const all = array.map(shapeMerchizeProduct).filter((p) => p.id && p.title);
        const wanted = label ? all.filter((p) => p.labels.some((l) => l.toLowerCase() === label.toLowerCase())) : all;

        for (const p of wanted) {
          if (Object.keys(p.skus).length) continue; // this endpoint shape already had them
          p.skus = await fetchVariantSkus(p.id, key);
          p.sizes = Object.keys(p.skus);
        }

        return {
          ok: true,
          endpoint: candidate.path,
          method: candidate.method,
          auth: attempt.label,
          products: wanted,
          total: all.length,
          labels: [...new Set(all.flatMap((p) => p.labels))].sort(),
        };
      } catch (err) {
        tried.push({ url, method: candidate.method, auth: attempt.label, error: err.message });
        return { ok: false, reason: 'network', tried };
      }
    }
  }

  console.error('Merchize product listing: no candidate endpoint answered', tried);
  const answered = tried.find((t) => t.answered);
  if (answered) return { ok: false, reason: 'unreadable_shape', tried, url: answered.url };
  const html = tried.find((t) => t.notJson);
  if (html) return { ok: false, reason: 'not_json', tried, url: html.url };
  return { ok: false, reason: 'no_endpoint', tried };
}

module.exports = {
  isConfigured,
  createMerchizeOrder,
  testConnection,
  listMerchizeProducts,
  shapeMerchizeProduct,
};
