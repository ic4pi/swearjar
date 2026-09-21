const Stripe = require('stripe');

// Guarded the same way as _catalog.js: Stripe's constructor throws
// synchronously on a missing key, which at module load time would take
// this whole function down before the handler below gets a chance to
// answer with a clear error instead.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const { createMerchizeOrder } = require('./merchize');

// Webhook signature verification needs the raw request body, so Vercel's
// default JSON body parser has to be turned off for this route.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  if (!stripe) {
    res.status(503).end();
    return;
  }

  const signature = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;

    console.log('Order placed:', {
      email: pi.metadata.order_email,
      items: pi.metadata.items,
      shipping: pi.shipping,
      amount: pi.amount,
      paymentIntentId: pi.id,
    });

    // Any apparel in the order goes to Merchize to print and ship. The
    // sticker pack (and anything else non-apparel) is deliberately not
    // sent — that's packed and shipped by hand.
    let apparel = [];
    try {
      apparel = JSON.parse(pi.metadata.apparel || '[]');
    } catch (err) {
      console.error('Could not read apparel metadata:', pi.metadata.apparel);
    }

    if (apparel.length && pi.shipping) {
      // The PaymentIntent id doubles as the external order number, so a
      // Stripe webhook retry re-sends the same number instead of creating
      // a second print job.
      await createMerchizeOrder({
        externalNumber: pi.id,
        email: pi.metadata.order_email,
        shipping: pi.shipping,
        items: apparel.map((a) => ({ name: a.n, size: a.s, qty: a.q })),
      });
    }
  }

  res.status(200).json({ received: true });
};
