/* ── BUILT-IN APPAREL & ACCESSORIES ─────────────────────────────────────
   The catalog swearjar launches with, as opposed to anything added or
   edited through /admin (which lives in Stripe and is read from there —
   see _catalog.js). Mirrors src/data/siteData.ts's fallbackProducts on the
   frontend, which renders these even if /api/products is unreachable or
   empty — same graceful-degradation shape as the rest of this site.

   The two hoodies are real Merchize-catalog products (shared Merchize
   account with hexposed.com): Tourette's Awareness Hoodie (Merchize id
   6aadba87bea1cd6d573856e0) and I Heart White Collar Crime Hoodie
   (Merchize id 6aadda6ce0acc7c2b004f022), both Lightweight, $40, SKUs
   LWHDVN000000AA01-08 for S-5XL. Don't change these without re-checking
   the Merchize catalog — a re-listed product gets a new SKU set and these
   would silently point at a dead variant.

   Prices are in cents and are what a customer is charged — checkout looks
   here only as a fallback, after checking Stripe first (see the
   "dashboard wins" rule in create-payment-intent.js and merchize.js): a
   product edited through /admin is priced from its live Stripe Price.
── */

const HOODIE_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const HOODIE_SKUS = {
  S: 'LWHDVN000000AA01',
  M: 'LWHDVN000000AA02',
  L: 'LWHDVN000000AA03',
  XL: 'LWHDVN000000AA04',
  '2XL': 'LWHDVN000000AA05',
  '3XL': 'LWHDVN000000AA06',
  '4XL': 'LWHDVN000000AA07',
  '5XL': 'LWHDVN000000AA08',
};

const APPAREL = {
  "Tourette's Awareness Hoodie": {
    description: "Lightweight hoodie featuring the Tourette's Awareness design.",
    priceCents: { default: 4000 },
    sizes: HOODIE_SIZES,
    series: 'activism',
    image:
      'https://d2dytk4tvgwhb4.cloudfront.net/v2/apnlgyzx/variants/6aadba87bea1cd5ed93856e8/variant-sku/LWHDVN000000AA01/attributes-size:s,background:oxncwpw_mockup-backgrounds_90db55b3-16de-4f2c-9553-62816054634a/front-name:Front-aNHaEugAF/thumb.jpg',
    skus: HOODIE_SKUS,
  },
  'I Heart White Collar Crime Hoodie': {
    description: 'Lightweight hoodie featuring the "I Heart White Collar Crime" design.',
    priceCents: { default: 4000 },
    sizes: HOODIE_SIZES,
    series: 'funny',
    image:
      'https://d2dytk4tvgwhb4.cloudfront.net/v2/apnlgyzx/variants/6aadda6ce0acc7442a04f02a/variant-sku/LWHDVN000000AA01/attributes-size:s,background:oxncwpw_mockup-backgrounds_dc694d11-0341-4524-a591-c10ecd2aa4fe/front-name:Front-QQ5r8I1WG/thumb.jpg',
    skus: HOODIE_SKUS,
  },
};

// Placeholder accessory. Packed and shipped by hand, not printed by
// Merchize — no SKU, so it never enters a Merchize order.
const ACCESSORIES = {
  'Sticker Pack': {
    description: 'Spread awareness everywhere you go. 5 premium vinyl stickers.',
    priceCents: { default: 800 },
    sizes: ['Standard Pack'],
    image: '/product_sticker_1.jpg',
  },
};

function isApparel(name) {
  return Boolean(APPAREL[name]);
}

function isAccessory(name) {
  return Boolean(ACCESSORIES[name]);
}

function entryFor(name) {
  return APPAREL[name] || ACCESSORIES[name] || null;
}

function priceCents(name, size) {
  const entry = entryFor(name);
  if (!entry) return 0;
  return entry.priceCents[size] || entry.priceCents.default || 0;
}

function sizesFor(name) {
  const entry = entryFor(name);
  return (entry && entry.sizes) || [];
}

function imageFor(name) {
  const entry = entryFor(name);
  return (entry && entry.image) || '';
}

function descriptionFor(name) {
  const entry = entryFor(name);
  return (entry && entry.description) || '';
}

function skuFor(name, size) {
  const entry = APPAREL[name];
  return (entry && entry.skus && entry.skus[size]) || '';
}

module.exports = {
  APPAREL,
  ACCESSORIES,
  isApparel,
  isAccessory,
  priceCents,
  sizesFor,
  imageFor,
  descriptionFor,
  skuFor,
};
