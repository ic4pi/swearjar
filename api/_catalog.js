const Stripe = require('stripe');

// Stripe's constructor throws synchronously on a missing/empty key rather
// than failing the specific call that needed it — at module load time that
// takes the whole function down (every route that requires this file)
// before a handler even gets a chance to respond gracefully. Guard it here
// once so a missing STRIPE_SECRET_KEY degrades to an empty catalog instead.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

/* ── DYNAMIC CATALOG ────────────────────────────────────────────────────
   Products added or edited through /admin are stored as Stripe Products
   with a default Price, tagged metadata.swearjar = '1'.

   Stripe is already the authority for what a customer is charged, so
   keeping the catalog there means the price on the card and the price
   billed can't drift apart. The two launch hoodies and the sticker pack
   still live in their own hardcoded arrays (_apparel.js on the server,
   src/data/siteData.ts on the client) — anything here is additive to
   those, and a product edited here by the same name overrides its
   built-in card on the storefront (see the merge in useSiteData.ts).
── */

const TAG = 'swearjar';
const KINDS = ['apparel', 'accessories'];
const SERIES = ['activism', 'funny'];

function parseJSON(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : fallback;
  } catch (_) {
    return fallback;
  }
}

function shape(p) {
  const price = p.default_price && typeof p.default_price === 'object' ? p.default_price : null;
  const series = p.metadata.series;
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    kind: KINDS.includes(p.metadata.kind) ? p.metadata.kind : 'apparel',
    series: SERIES.includes(series) ? series : undefined,
    image: (p.images && p.images[0]) || '',
    sizes: parseJSON(p.metadata.sizes, []) || [],
    skus: parseJSON(p.metadata.skus, {}) || {},
    priceId: price ? price.id : '',
    priceCents: price ? price.unit_amount : 0,
    currency: price ? price.currency : 'usd',
  };
}

async function listCatalog() {
  if (!stripe) return [];
  const page = await stripe.products.list({
    limit: 100,
    active: true,
    expand: ['data.default_price'],
  });
  return page.data
    .filter((p) => p.metadata && p.metadata[TAG] === '1')
    .map(shape)
    .filter((p) => p.priceId); // a product with no price cannot be sold
}

// Never let the browser see SKUs — those are fulfilment data, not shopper
// data. Field names match src/types/index.ts's Product interface so the
// frontend needs no reshaping.
function publicFields(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.kind,
    series: p.series,
    image: p.image,
    variants: p.sizes,
    price: p.priceCents / 100,
  };
}

async function findByName(name) {
  const all = await listCatalog();
  return all.find((p) => p.name === name) || null;
}

module.exports = { listCatalog, publicFields, findByName, TAG, KINDS, SERIES };
