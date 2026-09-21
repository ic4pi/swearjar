const axios = require('axios');

// swearjar and hexposed run fulfillment through the same Merchize account.
// Their dashboard's API page offers two credential tabs (Access Token, API
// Key) that authenticate the same API two different ways (Bearer vs
// X-API-Key), and either credential works with either header style. Rather
// than require the exact right pairing, every credential we have is tried
// against both header conventions until one is accepted - a mismatched
// paste costs a retry, not a deploy.
function base() {
  return process.env.MERCHIZE_BASE_URL || process.env.MERCHIZE_API_BASE || process.env.MERCHIZE_API_BASE_URL || '';
}

function candidateKeys() {
  return [...new Set([
    process.env.MERCHIZE_ACCESS_TOKEN,
    process.env.MERCHIZE_API_KEY,
    process.env.MERCHIZE_API_TOKEN,
  ].filter(Boolean))];
}

function isConfigured() {
  return Boolean(base() && candidateKeys().length);
}

const AUTH_STYLES = [
  (key) => ({ Authorization: `Bearer ${key}` }),
  (key) => ({ 'X-API-Key': key }),
];

// Only a 401/403 moves to the next credential/header combo - any other
// failure (400, 404, network, 5xx) is the real answer and is thrown
// immediately rather than retried under a style that wouldn't fix it.
async function request(method, path, { params, data } = {}) {
  const root = base();
  if (!root) throw new Error('Merchize is not configured (MERCHIZE_BASE_URL)');
  const keys = candidateKeys();
  if (!keys.length) throw new Error('Merchize is not configured (MERCHIZE_ACCESS_TOKEN)');

  let lastError;
  for (const key of keys) {
    for (const headers of AUTH_STYLES) {
      try {
        return await axios.request({ method, url: path, baseURL: root, params, data, headers });
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        if (status !== 401 && status !== 403) throw err;
      }
    }
  }
  throw lastError;
}

// https://seller.merchize.com/a/api-documents -> Orders -> Import external orders
async function importOrder(order) {
  const res = await request('post', '/order/external/orders', { data: order });
  return res.data;
}

// https://seller.merchize.com/a/api-documents -> Orders -> Get order tracking
async function getOrderTracking({ code, externalNumber, identifier } = {}) {
  const params = {};
  if (code) params.code = code;
  if (externalNumber) params.external_number = externalNumber;
  if (identifier) params.identifier = identifier;
  const res = await request('get', '/order/external/orders/tracking', { params });
  return res.data;
}

/* ── READING THE MERCHIZE CATALOG ───────────────────────────────────────
   Pulling products Merchize already holds, filtered to one category, so a
   garment doesn't have to be re-typed here after it's been set up there.
   Their exact product path isn't documented publicly, so the candidates
   below are tried in order and the first that answers is used. Set
   MERCHIZE_PRODUCTS_PATH to pin one explicitly and skip the probing.
── */
const PRODUCT_ENDPOINTS = [
  { path: '/product/external/products', method: 'get' },
  { path: '/catalog/external/products', method: 'get' },
  { path: '/product', method: 'get' },
  { path: '/products', method: 'get' },
  { path: '/product/search', method: 'post' },
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

// Every value on a product that could be the thing it's organized by -
// collection, tag, type, category, folder - flattened into one list, so
// filtering by category doesn't depend on knowing which field Merchize
// files it under for this account.
function labelsOf(raw) {
  const out = [];
  const push = (v) => {
    if (typeof v === 'string' && v.trim()) out.push(v.trim());
    else if (v && typeof v === 'object') {
      const name = firstString(v, ['name', 'title', 'slug', 'label']);
      if (name) out.push(name);
    }
  };
  for (const key of ['collection', 'collections', 'tag', 'tags', 'type', 'product_type',
                     'category', 'categories', 'folder', 'group', 'brand', 'store']) {
    const v = raw && raw[key];
    if (Array.isArray(v)) v.forEach(push);
    else push(v);
  }
  return [...new Set(out)];
}

function variantsOf(raw) {
  const list = Array.isArray(raw && raw.variants) ? raw.variants
    : Array.isArray(raw && raw.variant) ? raw.variant
    : [];
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
  const image = firstString(raw, ['image', 'thumbnail', 'mockup', 'preview'])
    || (typeof images[0] === 'string' ? images[0] : firstString(images[0] || {}, ['url', 'src']));
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

// Fetch the catalog, optionally narrowed to products carrying `label` as a
// collection/tag/category value (matched case-insensitively).
async function listMerchizeProducts({ label = '' } = {}) {
  if (!isConfigured()) return { ok: false, reason: 'not_configured' };

  const pinned = process.env.MERCHIZE_PRODUCTS_PATH;
  const candidates = pinned
    ? [{ path: pinned, method: 'get' }, { path: pinned, method: 'post' }]
    : PRODUCT_ENDPOINTS;

  const tried = [];
  for (const candidate of candidates) {
    try {
      const res = await request(candidate.method, candidate.path, candidate.method === 'get'
        ? { params: { limit: 100 } }
        : { data: { limit: 100 } });
      const array = productArray(res.data);
      if (!array) {
        tried.push({ path: candidate.path, method: candidate.method, status: res.status, answered: true });
        continue;
      }

      const all = array.map(shapeMerchizeProduct).filter((p) => p.id && p.title);
      const wanted = label
        ? all.filter((p) => p.labels.some((l) => l.toLowerCase() === label.toLowerCase()))
        : all;

      return {
        ok: true,
        endpoint: candidate.path,
        products: wanted,
        total: all.length,
        labels: [...new Set(all.flatMap((p) => p.labels))].sort(),
      };
    } catch (err) {
      tried.push({ path: candidate.path, method: candidate.method, error: err.response?.status || err.message });
    }
  }

  const answered = tried.find((t) => t.answered);
  if (answered) return { ok: false, reason: 'unreadable_shape', tried };
  return { ok: false, reason: 'no_endpoint', tried };
}

module.exports = { isConfigured, importOrder, getOrderTracking, listMerchizeProducts, shapeMerchizeProduct };
