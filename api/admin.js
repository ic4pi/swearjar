const crypto = require('crypto');
const Stripe = require('stripe');
const { listMerchizeProducts } = require('./merchize');
const { readStore, writeStore } = require('./_store');
const { APPAREL, ACCESSORIES } = require('./_apparel');

// Guarded the same way as _catalog.js: Stripe's constructor throws
// synchronously on a missing key, which at module load time would take
// this whole function down before the handler below gets a chance to
// answer with a clear 503 instead.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

/* ── ADMIN API ──────────────────────────────────────────────────────────
   One function handling every dashboard action, selected by ?action=.
   Kept as a single endpoint because each file under api/ is a separate
   serverless function, and this is one logical surface — same shape as
   hexpo's api/admin.js.

   Sessions and the ADMIN_PASSWORD check live in _adminAuth.js, shared
   with the other endpoints the dashboard calls.
── */

const { SESSION_HOURS, adminSecret, sameSecret, issueToken, authed } = require('./_adminAuth');

/* ── Products (Stripe-backed catalog) ── */

const TAG = 'swearjar';
const KINDS = ['apparel', 'accessories'];
const SERIES = ['activism', 'funny'];

function money(cents) {
  return { cents: cents || 0, display: `$${((cents || 0) / 100).toFixed(2)}` };
}

function shapeProduct(p) {
  const price = p.default_price && typeof p.default_price === 'object' ? p.default_price : null;
  let sizes = [];
  try {
    sizes = p.metadata.sizes ? JSON.parse(p.metadata.sizes) : [];
  } catch (_) {
    sizes = [];
  }
  let skus = {};
  try {
    skus = p.metadata.skus ? JSON.parse(p.metadata.skus) : {};
  } catch (_) {
    skus = {};
  }
  return {
    id: p.id,
    name: p.name,
    active: p.active,
    kind: KINDS.includes(p.metadata.kind) ? p.metadata.kind : 'apparel',
    series: SERIES.includes(p.metadata.series) ? p.metadata.series : '',
    description: p.description || '',
    image: (p.images && p.images[0]) || '',
    sizes,
    skus,
    priceId: price ? price.id : '',
    amount: price ? money(price.unit_amount) : money(0),
  };
}

async function listProducts() {
  const page = await stripe.products.list({ limit: 100, active: true, expand: ['data.default_price'] });
  return page.data.filter((p) => p.metadata && p.metadata[TAG] === '1').map(shapeProduct);
}

// Pasting a Merchize dashboard's per-size SKU block straight in is far
// quicker than typing eight sizes by hand.
function parseSkuBlock(text) {
  if (typeof text !== 'string' || !text.trim()) return {};
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out = {};
  let pendingSku = null;
  for (const line of lines) {
    const skuMatch = line.match(/^SKU:\s*(\S+)/i);
    if (skuMatch) {
      pendingSku = skuMatch[1];
      continue;
    }
    const sizeMatch = line.match(/^size:\s*(\S+)/i);
    if (sizeMatch && pendingSku) {
      out[sizeMatch[1].toUpperCase()] = pendingSku;
      pendingSku = null;
    }
  }
  return out;
}

function takesSkus(kind) {
  return kind === 'apparel';
}

async function createProduct(body) {
  const name = String(body.name || '').trim();
  const kind = KINDS.includes(body.kind) ? body.kind : 'apparel';
  const series = kind === 'apparel' && SERIES.includes(body.series) ? body.series : '';
  const image = String(body.image || '').trim();
  const description = String(body.description || '').slice(0, 300);

  if (!name) return { error: 'Name is required' };

  const cents = Math.round(Number(body.price) * 100);
  if (!Number.isInteger(cents) || cents < 50) {
    return { error: 'Enter a price of at least $0.50.' };
  }

  const sizes = Array.isArray(body.sizes) ? body.sizes.filter((s) => typeof s === 'string' && s) : [];
  const skus = takesSkus(kind) ? parseSkuBlock(body.skuBlock || '') : {};

  const metadata = {
    [TAG]: '1',
    kind,
    series,
    sizes: JSON.stringify(sizes).slice(0, 500),
    skus: JSON.stringify(skus).slice(0, 500),
  };

  const product = await stripe.products.create({
    name,
    description: description || undefined,
    images: image ? [image] : undefined,
    metadata,
  });
  const price = await stripe.prices.create({ product: product.id, unit_amount: cents, currency: 'usd' });
  await stripe.products.update(product.id, { default_price: price.id });

  return { product: shapeProduct({ ...product, default_price: price }), skusParsed: Object.keys(skus).length };
}

// Editing what's already there. Only the fields actually sent are
// touched, so updating SKUs can't wipe the sizes and vice versa.
async function updateProduct(body) {
  const id = String(body.id || '');
  if (!id.startsWith('prod_')) return { error: 'Bad product id' };

  let existing;
  try {
    existing = await stripe.products.retrieve(id, { expand: ['default_price'] });
  } catch (_) {
    return { error: 'That product is no longer in Stripe.' };
  }
  if (!existing.metadata || existing.metadata[TAG] !== '1') {
    return { error: 'That product was not added through this dashboard.' };
  }

  const kind = KINDS.includes(body.kind) ? body.kind : existing.metadata.kind || 'apparel';
  const metadata = { ...existing.metadata, kind };
  if (kind === 'apparel') {
    if (SERIES.includes(body.series)) metadata.series = body.series;
  } else {
    metadata.series = '';
  }
  const update = { metadata };

  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (typeof body.description === 'string') update.description = body.description.slice(0, 300) || undefined;
  if (typeof body.image === 'string' && body.image.trim()) update.images = [body.image.trim()];

  if (Array.isArray(body.sizes)) {
    const sizes = body.sizes.filter((x) => typeof x === 'string' && x);
    metadata.sizes = JSON.stringify(sizes).slice(0, 500);
  }

  // Merging rather than replacing: a Merchize block pasted one size at a
  // time should build the set up, not reduce it to whichever was pasted last.
  let skusParsed = 0;
  if (typeof body.skuBlock === 'string' && body.skuBlock.trim()) {
    if (!takesSkus(kind)) return { error: 'Only apparel has SKUs to print.' };
    let current = {};
    try {
      current = existing.metadata.skus ? JSON.parse(existing.metadata.skus) : {};
    } catch (_) {
      current = {};
    }
    const added = parseSkuBlock(body.skuBlock);
    if (!Object.keys(added).length) {
      return { error: 'No SKUs found in that block — paste the variant list with its size lines.' };
    }
    metadata.skus = JSON.stringify({ ...current, ...added }).slice(0, 500);
    skusParsed = Object.keys(added).length;
  }

  // A new amount means a new Price — Stripe prices are immutable, so the
  // old one is archived rather than left active and pickable by mistake.
  let price = existing.default_price && typeof existing.default_price === 'object' ? existing.default_price : null;
  if (body.price !== undefined && body.price !== '') {
    const cents = Math.round(Number(body.price) * 100);
    if (Number.isInteger(cents) && cents >= 50 && (!price || price.unit_amount !== cents)) {
      const fresh = await stripe.prices.create({ product: id, unit_amount: cents, currency: 'usd' });
      update.default_price = fresh.id;
      if (price) {
        try {
          await stripe.prices.update(price.id, { active: false });
        } catch (_) {
          /* leaving the old price active is untidy, not broken */
        }
      }
      price = fresh;
    }
  }

  const updated = await stripe.products.update(id, update);
  return { product: shapeProduct({ ...updated, default_price: price }), skusParsed };
}

/* Turns the built-in hoodies + sticker pack (_apparel.js) into real Stripe
   Products, the same fields createProduct would use by hand, so from then
   on they're editable in the dashboard instead of only in code. Safe to
   click more than once: a name that's already tagged is skipped, so this
   also doubles as "pull in anything new since last time". */
async function importLegacyCatalog() {
  const existing = await listProducts();
  const haveNames = new Set(existing.map((p) => p.name));
  const results = [];

  const entries = [
    ...Object.entries(APPAREL).map(([name, e]) => ({ name, ...e, kind: 'apparel' })),
    ...Object.entries(ACCESSORIES).map(([name, e]) => ({ name, ...e, kind: 'accessories' })),
  ];

  for (const item of entries) {
    if (haveNames.has(item.name)) {
      results.push({ name: item.name, status: 'already imported' });
      continue;
    }
    const skuBlock = item.skus
      ? Object.entries(item.skus).map(([size, sku]) => `SKU: ${sku}\nsize: ${size}`).join('\n')
      : '';
    const created = await createProduct({
      name: item.name,
      kind: item.kind,
      series: item.series || '',
      description: item.description || '',
      image: item.image || '',
      price: (item.priceCents.default || 0) / 100,
      sizes: item.sizes || [],
      skuBlock,
    });
    if (created.error) {
      results.push({ name: item.name, status: 'error', error: created.error });
      continue;
    }
    results.push({ name: item.name, status: 'created' });
  }
  return { results };
}

function merchizeReason(result) {
  if (result.reason === 'not_configured') {
    return 'Merchize is not connected. Set MERCHIZE_BASE_URL and MERCHIZE_ACCESS_TOKEN (or MERCHIZE_API_KEY) in Vercel.';
  }
  if (result.reason === 'unreadable_shape') {
    return 'Merchize answered but the product list was not where expected. The shape has been logged.';
  }
  if (result.reason === 'not_json') {
    return 'Merchize answered on a product path but sent a web page, not data.';
  }
  if (result.reason === 'no_endpoint') {
    return 'Connected, but none of the known product paths answered. Set MERCHIZE_PRODUCTS_PATH in Vercel.';
  }
  if (result.reason === 'network') return 'Could not reach Merchize. Try again shortly.';
  if (result.reason === 'auth_rejected') return 'Merchize rejected the credential. Re-copy it from their API page.';
  return 'Merchize could not be read right now.';
}

async function importMerchizeProducts(body) {
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string' && x) : [];
  if (!ids.length) return { error: 'Pick at least one product to import.' };

  const cents = Math.round(Number(body.price) * 100);
  if (!Number.isInteger(cents) || cents < 50) {
    return { error: 'Set the price you are selling these for, at least $0.50.' };
  }
  const series = SERIES.includes(body.series) ? body.series : '';

  const listing = await listMerchizeProducts({ label: String(body.label || '') });
  if (!listing.ok) return { error: merchizeReason(listing) };

  const existing = await listProducts();
  const already = new Set(existing.map((p) => p.name));

  const imported = [];
  const skipped = [];
  for (const id of ids) {
    const found = listing.products.find((p) => p.id === id);
    if (!found) {
      skipped.push({ id, why: 'no longer in the Merchize catalog' });
      continue;
    }
    if (already.has(found.title)) {
      skipped.push({ id, name: found.title, why: 'already on the site' });
      continue;
    }
    const product = await stripe.products.create({
      name: found.title,
      images: found.image ? [found.image] : undefined,
      metadata: {
        [TAG]: '1',
        kind: 'apparel',
        series,
        sizes: JSON.stringify(found.sizes).slice(0, 500),
        skus: JSON.stringify(found.skus).slice(0, 500),
        merchize_id: found.id,
      },
    });
    const price = await stripe.prices.create({ product: product.id, unit_amount: cents, currency: 'usd' });
    await stripe.products.update(product.id, { default_price: price.id });
    already.add(found.title);
    imported.push({ name: found.title, sizes: found.sizes.length, skus: Object.keys(found.skus).length });
  }

  return { imported, skipped };
}

/* ── Shows ── */

function shapeShow(body, id) {
  return {
    id,
    date: String(body.date || '').trim(),
    startTime: typeof body.startTime === 'string' ? body.startTime : '',
    venue: String(body.venue || '').trim(),
    location: String(body.location || '').trim(),
    link: typeof body.link === 'string' ? body.link : '',
  };
}

async function addShow(body) {
  if (!String(body.date || '').trim() || !String(body.venue || '').trim()) {
    return { error: 'Date and venue are required' };
  }
  const store = await readStore();
  const show = shapeShow(body, crypto.randomUUID());
  store.shows = [show, ...store.shows];
  await writeStore(store);
  return { show };
}

async function updateShow(body) {
  const id = String(body.id || '');
  if (!id) return { error: 'Bad show id' };
  const store = await readStore();
  const idx = store.shows.findIndex((s) => s.id === id);
  if (idx === -1) return { error: 'Show not found' };
  const merged = { ...store.shows[idx], ...body, id };
  store.shows[idx] = shapeShow(merged, id);
  await writeStore(store);
  return { show: store.shows[idx] };
}

async function deleteShow(body) {
  const id = String(body.id || '');
  const store = await readStore();
  store.shows = store.shows.filter((s) => s.id !== id);
  await writeStore(store);
  return { ok: true };
}

/* ── Videos ── */

function shapeVideo(body, id) {
  return {
    id,
    title: String(body.title || '').trim(),
    thumbnail: typeof body.thumbnail === 'string' ? body.thumbnail : '',
    url: typeof body.url === 'string' ? body.url : '',
    embedUrl: typeof body.embedUrl === 'string' ? body.embedUrl : '',
  };
}

async function addVideo(body) {
  if (!String(body.title || '').trim() || !String(body.embedUrl || '').trim()) {
    return { error: 'Title and embed URL are required' };
  }
  const store = await readStore();
  const video = shapeVideo(body, crypto.randomUUID());
  store.videos = [video, ...store.videos];
  await writeStore(store);
  return { video };
}

async function updateVideo(body) {
  const id = String(body.id || '');
  if (!id) return { error: 'Bad video id' };
  const store = await readStore();
  const idx = store.videos.findIndex((v) => v.id === id);
  if (idx === -1) return { error: 'Video not found' };
  const merged = { ...store.videos[idx], ...body, id };
  store.videos[idx] = shapeVideo(merged, id);
  await writeStore(store);
  return { video: store.videos[idx] };
}

async function deleteVideo(body) {
  const id = String(body.id || '');
  const store = await readStore();
  store.videos = store.videos.filter((v) => v.id !== id);
  await writeStore(store);
  return { ok: true };
}

/* ── Photos ── */

function shapePhoto(body, id) {
  return {
    id,
    title: String(body.title || '').trim(),
    url: String(body.url || '').trim(),
  };
}

async function addPhoto(body) {
  if (!String(body.url || '').trim()) {
    return { error: 'Image URL is required' };
  }
  const store = await readStore();
  const photo = shapePhoto(body, crypto.randomUUID());
  store.photos = [photo, ...store.photos];
  await writeStore(store);
  return { photo };
}

async function updatePhoto(body) {
  const id = String(body.id || '');
  if (!id) return { error: 'Bad photo id' };
  const store = await readStore();
  const idx = store.photos.findIndex((p) => p.id === id);
  if (idx === -1) return { error: 'Photo not found' };
  const merged = { ...store.photos[idx], ...body, id };
  store.photos[idx] = shapePhoto(merged, id);
  await writeStore(store);
  return { photo: store.photos[idx] };
}

async function deletePhoto(body) {
  const id = String(body.id || '');
  const store = await readStore();
  store.photos = store.photos.filter((p) => p.id !== id);
  await writeStore(store);
  return { ok: true };
}

/* ── Settings ── */

async function updateSettings(body) {
  const store = await readStore();
  if (typeof body.cashAppTag === 'string' && body.cashAppTag.trim()) {
    store.settings.cashAppTag = body.cashAppTag.trim();
  }
  await writeStore(store);
  return { settings: store.settings };
}

/* ── Handler ── */

module.exports = async (req, res) => {
  if (!adminSecret()) {
    res.status(503).json({ error: 'ADMIN_PASSWORD is not set on this deployment.' });
    return;
  }

  const action = String((req.query && req.query.action) || '');

  if (action === 'login') {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const supplied = (req.body && req.body.password) || '';
    if (!supplied || !sameSecret(supplied, adminSecret())) {
      // Slow a guessing loop down a little without holding the function open.
      await new Promise((r) => setTimeout(r, 600));
      res.status(401).json({ error: 'Wrong password' });
      return;
    }
    res.status(200).json({ token: issueToken(), expiresInHours: SESSION_HOURS });
    return;
  }

  if (!authed(req)) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  // Shows and settings live in Blob storage, not Stripe — only the
  // product actions need a working Stripe client.
  const STRIPE_ACTIONS = new Set([
    'create-product', 'update-product', 'archive-product', 'import-legacy', 'merchize-scan', 'merchize-import',
  ]);
  if (STRIPE_ACTIONS.has(action) && !stripe) {
    res.status(503).json({ error: 'STRIPE_SECRET_KEY is not set on this deployment.' });
    return;
  }

  try {
    if (action === 'test-merchize') {
      const { testConnection } = require('./merchize');
      res.status(200).json(await testConnection());
      return;
    }

    if (action === 'settings') {
      const { settings } = await readStore();
      res.status(200).json({ settings });
      return;
    }

    if (action === 'update-settings') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await updateSettings(req.body || {});
      res.status(200).json(out);
      return;
    }

    if (action === 'add-show') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await addShow(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'update-show') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await updateShow(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'delete-show') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      res.status(200).json(await deleteShow(req.body || {}));
      return;
    }

    if (action === 'add-video') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await addVideo(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'update-video') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await updateVideo(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'delete-video') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      res.status(200).json(await deleteVideo(req.body || {}));
      return;
    }

    if (action === 'add-photo') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await addPhoto(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'update-photo') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await updatePhoto(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'delete-photo') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      res.status(200).json(await deletePhoto(req.body || {}));
      return;
    }

    if (action === 'create-product') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const result = await createProduct(req.body || {});
      if (result.error) {
        res.status(400).json(result);
        return;
      }
      res.status(200).json(result);
      return;
    }

    if (action === 'update-product') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await updateProduct(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (action === 'archive-product') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const id = String((req.body && req.body.id) || '');
      if (!id.startsWith('prod_')) {
        res.status(400).json({ error: 'Bad product id' });
        return;
      }
      await stripe.products.update(id, { active: false });
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'import-legacy') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      res.status(200).json(await importLegacyCatalog());
      return;
    }

    if (action === 'merchize-scan') {
      const label = String((req.query && req.query.label) || '');
      const listing = await listMerchizeProducts({ label });
      if (!listing.ok) {
        res.status(400).json({ error: merchizeReason(listing) });
        return;
      }
      const onSite = new Set((await listProducts()).map((p) => p.name));
      res.status(200).json({
        endpoint: listing.endpoint,
        products: listing.products.map((p) => ({ ...p, onSite: onSite.has(p.title) })),
        total: listing.total,
        labels: listing.labels,
      });
      return;
    }

    if (action === 'merchize-import') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }
      const out = await importMerchizeProducts(req.body || {});
      if (out.error) {
        res.status(400).json(out);
        return;
      }
      res.status(200).json(out);
      return;
    }

    res.status(404).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('admin action failed:', action, err.message);
    res.status(500).json({ error: 'That request failed. Check the function logs.' });
  }
};
