const Stripe = require('stripe');
const { findByName } = require('./_catalog');
const { isApparel, isAccessory, priceCents: builtInPriceCents, sizesFor } = require('./_apparel');

// Guarded the same way as _catalog.js: Stripe's constructor throws
// synchronously on a missing key, which at module load time would take
// this whole function down before the handler below gets a chance to
// answer with a clear error instead.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Shipping fields the frontend's ShippingDialog collects (src/types/index.ts
// ShippingInfo) — same set the old backend required, kept as-is so the
// frontend needs no changes.
const REQUIRED_SHIPPING_FIELDS = ['full_name', 'email', 'phone', 'address_1', 'city', 'state', 'postcode', 'country'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Looked up by name, not by the id the browser sent — same "dashboard
// wins" rule used throughout (see _catalog.js, merchize.js): a product
// edited through /admin is priced from its live Stripe Price; the
// built-in hoodies/sticker pack are the fallback for anything never
// touched there. This also means the price and size a shopper is charged
// can never be spoofed by the browser — only the name is trusted, and
// everything else is re-derived here.
async function resolveItem(name) {
  let dynamic = null;
  try {
    dynamic = await findByName(name);
  } catch (err) {
    console.error('catalog lookup failed for', name, err.message);
  }
  if (dynamic) {
    return {
      found: true,
      kind: dynamic.kind,
      sizes: dynamic.sizes,
      priceCentsFor: () => dynamic.priceCents,
    };
  }
  if (isApparel(name)) {
    return { found: true, kind: 'apparel', sizes: sizesFor(name), priceCentsFor: (size) => builtInPriceCents(name, size) };
  }
  if (isAccessory(name)) {
    return { found: true, kind: 'accessories', sizes: sizesFor(name), priceCentsFor: (size) => builtInPriceCents(name, size) };
  }
  return { found: false };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!stripe) {
    res.status(503).json({ error: 'Checkout is not configured on this deployment.' });
    return;
  }

  const { items, shippingInfo } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'No items provided' });
    return;
  }
  if (!shippingInfo || typeof shippingInfo !== 'object') {
    res.status(400).json({ error: 'Shipping info is required' });
    return;
  }
  const missingField = REQUIRED_SHIPPING_FIELDS.find((field) => !shippingInfo[field]);
  if (missingField) {
    res.status(400).json({ error: `Missing shipping field: ${missingField}` });
    return;
  }
  if (!EMAIL_RE.test(shippingInfo.email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }

  let amount = 0;
  const lineItems = [];
  // Apparel survives into the webhook so it can be pushed to Merchize for
  // printing — the sticker pack (and anything else non-apparel) is packed
  // and shipped by hand.
  const apparelItems = [];

  try {
    for (const item of items) {
      const name = item && item.name;
      const variant = (item && item.variant) || '';
      const quantity = Math.max(1, parseInt(item && item.quantity, 10) || 1);

      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Invalid item in bag' });
        return;
      }

      const resolved = await resolveItem(name);
      if (!resolved.found) {
        res.status(400).json({ error: `Unknown product: ${name}` });
        return;
      }
      if (resolved.sizes.length && !resolved.sizes.includes(variant)) {
        res.status(400).json({ error: `Pick a valid size for ${name}` });
        return;
      }

      const unitCents = resolved.priceCentsFor(variant);
      if (!unitCents) {
        res.status(400).json({ error: `${name} isn't available for purchase yet.` });
        return;
      }

      amount += unitCents * quantity;
      lineItems.push(variant ? `${name} [${variant}] x${quantity}` : `${name} x${quantity}`);
      if (resolved.kind === 'apparel') apparelItems.push({ n: name, s: variant, q: quantity });
    }
  } catch (err) {
    console.error('create-payment-intent price lookup failed:', err.message);
    res.status(500).json({ error: 'Could not price your order. Please try again.' });
    return;
  }

  amount = Math.max(amount, 50); // Stripe's own floor for a chargeable amount

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: shippingInfo.email,
      automatic_payment_methods: { enabled: true },
      shipping: {
        name: shippingInfo.full_name,
        phone: shippingInfo.phone,
        address: {
          line1: shippingInfo.address_1,
          line2: shippingInfo.address_2 || undefined,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.postcode,
          country: shippingInfo.country,
        },
      },
      metadata: {
        kind: 'order',
        order_email: shippingInfo.email,
        items: lineItems.join('; ').slice(0, 500),
        // Read back by api/webhook.js to place the Merchize order. Stripe
        // caps a metadata value at 500 chars; short keys keep a realistic
        // apparel order well inside that.
        apparel: apparelItems.length ? JSON.stringify(apparelItems).slice(0, 500) : '',
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('create-payment-intent failed:', err.message);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
};
