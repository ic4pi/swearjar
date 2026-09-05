const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const merchize = require('./merchize');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Set FRONTEND_URL (comma-separated for multiple) to the deployed frontend origin(s).
const defaultProdOrigins = ['https://zachariah-tippett.vercel.app'];
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
  : defaultProdOrigins;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./zachariahtippett.db');

// Create tables
db.serialize(() => {
  // Admin credentials table
  db.run(`CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Shows table
  db.run(`CREATE TABLE IF NOT EXISTS shows (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT,
    venue TEXT,
    location TEXT,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Videos table
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail TEXT,
    url TEXT,
    embed_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image TEXT,
    category TEXT,
    series TEXT,
    variants TEXT,
    sales INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // series ('activism' | 'funny') distinguishes the two apparel shop sections.
  // Added after the initial release, so back it onto existing databases too.
  db.run(`ALTER TABLE products ADD COLUMN series TEXT`, () => {});
  // printful_url named and exposed the old fulfillment supplier - dropped from
  // existing databases too so no stored value can leak via GET /api/products.
  db.run(`ALTER TABLE products DROP COLUMN printful_url`, () => {});
  // Merchize SKU for the product, used to build items[].sku when an order is
  // pushed to Merchize for fulfillment. Since Merchize assigns a distinct SKU
  // per size, this holds a JSON map of variant label -> Merchize SKU (e.g.
  // {"S":"MWHDVN000000AA01","M":"MWHDVN000000AA02"}). A plain string instead
  // of JSON is treated as a single SKU shared by every variant.
  db.run(`ALTER TABLE products ADD COLUMN merchize_sku TEXT`, () => {});

  // Orders table - tracks fulfillment orders pushed to Merchize and the
  // tracking/status updates Merchize sends back over webhook.
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    merchize_order_code TEXT,
    status TEXT DEFAULT 'pending',
    tracking_company TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    customer_email TEXT,
    shipping_info TEXT,
    items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed the two Merchize-catalog designs the site launches with. Uses
  // INSERT OR IGNORE keyed on a fixed id, so this only ever inserts once -
  // safe to leave in place across every future deploy/restart, and won't
  // clobber edits made afterward from the admin dashboard.
  const merchizeSeedProducts = [
    {
      id: 'white-collar-crime-hoodie',
      name: 'I Heart White Collar Crime (Midweight)',
      description: 'Midweight hoodie featuring the "I Heart White Collar Crime" design.',
      price: 47,
      image: 'https://d2dytk4tvgwhb4.cloudfront.net/v2/9kcjr3ho/variants/6a9b69fdbdd18a8571cf6341/variant-sku/MWHDVN000000AA01/attributes-size:s,background:qdrvtf9_mockup-backgrounds_aa8048d3-ea20-4b8c-aa92-7b01f16a7d48/front-name:Front-fLVy4ClOB/thumb.jpg',
      category: 'apparel',
      series: 'funny',
      variants: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
      merchize_sku: {
        S: 'MWHDVN000000AA01', M: 'MWHDVN000000AA02', L: 'MWHDVN000000AA03', XL: 'MWHDVN000000AA04',
        '2XL': 'MWHDVN000000AA05', '3XL': 'MWHDVN000000AA06', '4XL': 'MWHDVN000000AA07', '5XL': 'MWHDVN000000AA08',
      },
    },
    {
      id: 'white-collar-crime-zip-hoodie',
      name: 'I Heart White Collar Crime Zip-Hoodie (Midweight)',
      description: 'Midweight zip-up hoodie featuring the "I Heart White Collar Crime" design.',
      price: 48,
      image: 'https://d2dytk4tvgwhb4.cloudfront.net/v2/9kcjr3ho/variants/6a9b739c221aaf8be9c09219/variant-sku/MWZHVN000000AA01/attributes-size:s,background:qdrvtf9_mockup-backgrounds_a1473146-abc2-41d5-8828-2588b6c158b2/front-name:Front-zyF50cnqx/thumb.jpg',
      category: 'apparel',
      series: 'funny',
      variants: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
      merchize_sku: {
        S: 'MWZHVN000000AA01', M: 'MWZHVN000000AA02', L: 'MWZHVN000000AA03', XL: 'MWZHVN000000AA04',
        '2XL': 'MWZHVN000000AA05', '3XL': 'MWZHVN000000AA06', '4XL': 'MWZHVN000000AA07', '5XL': 'MWZHVN000000AA08',
      },
    },
  ];
  for (const p of merchizeSeedProducts) {
    db.run(
      `INSERT OR IGNORE INTO products (id, name, description, price, image, category, series, variants, merchize_sku)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.description, p.price, p.image, p.category, p.series, JSON.stringify(p.variants), JSON.stringify(p.merchize_sku)]
    );
  }

  // Donations table
  db.run(`CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    donor TEXT,
    message TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Photos table
  db.run(`CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Initialize default admin if not exists. Set ADMIN_DEFAULT_PASSWORD to control it;
  // otherwise a random one is generated and printed once to the server log on first run.
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const defaultPasswordHash = bcrypt.hashSync(defaultPassword, 10);
  db.run(`INSERT OR IGNORE INTO admin_credentials (username, password) VALUES (?, ?)`,
    ['admin', defaultPasswordHash], function (err) {
      if (!err && this.changes > 0 && !process.env.ADMIN_DEFAULT_PASSWORD) {
        console.warn(`\n⚠️  Generated admin password (won't be shown again): ${defaultPassword}\n`);
      }
    });
});

// JWT Secret - required, no insecure fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Very small in-memory rate limiter for the login endpoint
const loginAttempts = new Map(); // ip -> { count, resetAt }
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

function rateLimitLogin(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= LOGIN_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  }

  next();
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Login endpoint
app.post('/api/admin/login', rateLimitLogin, async (req, res) => {
  const { username, password } = req.body;

  try {
    db.get('SELECT * FROM admin_credentials WHERE username = ?', [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row || !bcrypt.compareSync(password, row.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { username: row.username, id: row.id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ success: true, token });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update credentials endpoint
app.put('/api/admin/credentials', verifyToken, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run('UPDATE admin_credentials SET username = ?, password = ? WHERE id = ?', 
      [username, hashedPassword, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Shows endpoints
app.get('/api/shows', (req, res) => {
  db.all('SELECT * FROM shows ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/shows', verifyToken, (req, res) => {
  const { id, date, startTime, venue, location, link } = req.body;
  
  db.run(`INSERT INTO shows (id, date, start_time, venue, location, link) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
    [id, date, startTime, venue, location, link], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

app.put('/api/shows/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { date, startTime, venue, location, link } = req.body;
  
  db.run(`UPDATE shows SET date = ?, start_time = ?, venue = ?, location = ?, link = ? 
          WHERE id = ?`, 
    [date, startTime, venue, location, link, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/shows/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM shows WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Videos endpoints
app.get('/api/videos', (req, res) => {
  db.all('SELECT * FROM videos ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/videos', verifyToken, (req, res) => {
  const { id, title, thumbnail, url, embedUrl } = req.body;
  
  db.run(`INSERT INTO videos (id, title, thumbnail, url, embed_url) 
          VALUES (?, ?, ?, ?, ?)`, 
    [id, title, thumbnail, url, embedUrl], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.put('/api/videos/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { title, thumbnail, url, embedUrl } = req.body;
  
  db.run(`UPDATE videos SET title = ?, thumbnail = ?, url = ?, embed_url = ? 
          WHERE id = ?`, 
    [title, thumbnail, url, embedUrl, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/videos/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM videos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/products', verifyToken, (req, res) => {
  const { id, name, description, price, image, category, series, variants, merchize_sku } = req.body;

  db.run(`INSERT INTO products (id, name, description, price, image, category, series, variants, merchize_sku)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description, price, image, category, series || null, JSON.stringify(variants), merchize_sku || null], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.put('/api/products/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, series, variants, sales, merchize_sku } = req.body;

  db.run(`UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?,
          series = ?, variants = ?, sales = ?, merchize_sku = ? WHERE id = ?`,
    [name, description, price, image, category, series || null, JSON.stringify(variants), sales || 0, merchize_sku || null, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/products/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Donations endpoints
app.get('/api/donations', (req, res) => {
  db.all('SELECT * FROM donations ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/donations', verifyToken, (req, res) => {
  const { id, amount, donor, message, date } = req.body;
  
  db.run(`INSERT INTO donations (id, amount, donor, message, date) 
          VALUES (?, ?, ?, ?, ?)`, 
    [id, amount, donor, message, date], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Photos endpoints
app.get('/api/photos', (req, res) => {
  db.all('SELECT * FROM photos ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/photos', verifyToken, (req, res) => {
  const { id, title, url } = req.body;
  
  db.run('INSERT INTO photos (id, title, url) VALUES (?, ?, ?)', 
    [id, title, url], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.put('/api/photos/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;
  
  db.run('UPDATE photos SET title = ?, url = ? WHERE id = ?', 
    [title, url, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/photos/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM photos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Stripe Payment Endpoints

function getProductById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, price, image, merchize_sku FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

const REQUIRED_SHIPPING_FIELDS = ['full_name', 'address_1', 'city', 'state', 'postcode', 'country', 'email', 'phone'];

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items, shippingInfo } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return res.status(400).json({ error: 'Shipping info is required' });
    }
    const missingField = REQUIRED_SHIPPING_FIELDS.find((field) => !shippingInfo[field]);
    if (missingField) {
      return res.status(400).json({ error: `Missing shipping field: ${missingField}` });
    }

    // Price and existence are looked up server-side so a client can't submit
    // an arbitrary price/quantity for a product it doesn't actually match.
    let amount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await getProductById(item.id);
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${item.id}` });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      amount += Math.round(product.price * quantity * 100);
      verifiedItems.push({ id: product.id, name: product.name, quantity, variant: item.variant || '' });
    }

    // Create payment intent with metadata. Shipping fields are stored as
    // individual keys (rather than one JSON blob) to stay well under
    // Stripe's 500-character-per-value metadata limit.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        items: JSON.stringify(verifiedItems),
        customer_email: shippingInfo.email,
        shipping_full_name: shippingInfo.full_name,
        shipping_address_1: shippingInfo.address_1,
        shipping_address_2: shippingInfo.address_2 || '',
        shipping_city: shippingInfo.city,
        shipping_state: shippingInfo.state,
        shipping_postcode: shippingInfo.postcode,
        shipping_country: shippingInfo.country,
        shipping_phone: shippingInfo.phone,
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolves a product's stored image (often a relative path served by the
// site itself) to an absolute URL, since Merchize's order API requires a
// fetchable image URL for each item.
function resolveImageUrl(image) {
  if (!image) return image;
  if (/^https?:\/\//.test(image)) return image;
  const siteOrigin = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');
  return `${siteOrigin}${image.startsWith('/') ? '' : '/'}${image}`;
}

// product.merchize_sku is stored as JSON mapping variant label -> Merchize
// SKU (e.g. {"S":"MWHDVN000000AA01"}) for products with per-size SKUs. A
// plain (non-JSON) string is treated as one SKU shared by every variant.
function resolveMerchizeSku(product, variant) {
  if (!product.merchize_sku) return undefined;
  try {
    const map = JSON.parse(product.merchize_sku);
    if (map && typeof map === 'object') {
      return map[variant] || undefined;
    }
  } catch {
    // Not JSON - fall through to using it as a single flat SKU.
  }
  return product.merchize_sku;
}

async function buildMerchizeItems(items) {
  const merchizeItems = [];
  for (const item of items) {
    const product = await getProductById(item.id);
    if (!product) continue;
    const sku = resolveMerchizeSku(product, item.variant);
    merchizeItems.push({
      name: product.name,
      sku,
      merchize_sku: sku,
      quantity: item.quantity,
      price: product.price,
      currency: 'USD',
      image: resolveImageUrl(product.image),
      attributes: [{ name: 'Variant', option: item.variant || 'Default' }],
    });
  }
  return merchizeItems;
}

// Pushes a paid order to Merchize for fulfillment and records the result.
// Failures here are logged but don't affect the sale already recorded above -
// a Merchize outage shouldn't make a successful Stripe payment look failed.
async function fulfillWithMerchize(paymentIntent, items, customerEmail) {
  if (!merchize.isConfigured()) {
    console.warn('Merchize not configured (MERCHIZE_BASE_URL/MERCHIZE_ACCESS_TOKEN) - skipping fulfillment push');
    return;
  }

  const shippingInfo = {
    full_name: paymentIntent.metadata.shipping_full_name,
    address_1: paymentIntent.metadata.shipping_address_1,
    address_2: paymentIntent.metadata.shipping_address_2 || '',
    city: paymentIntent.metadata.shipping_city,
    state: paymentIntent.metadata.shipping_state,
    postcode: paymentIntent.metadata.shipping_postcode,
    country: paymentIntent.metadata.shipping_country,
    email: customerEmail,
    phone: paymentIntent.metadata.shipping_phone,
  };

  if (!shippingInfo.address_1) {
    console.warn('Skipping Merchize push - no shipping info on payment intent', paymentIntent.id);
    return;
  }

  try {
    const merchizeItems = await buildMerchizeItems(items);
    const result = await merchize.importOrder({
      order_id: paymentIntent.id,
      shipping_info: shippingInfo,
      items: merchizeItems,
    });

    db.run(
      `INSERT INTO orders (id, merchize_order_code, status, customer_email, shipping_info, items)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        paymentIntent.id,
        result?.data?._id || null,
        result?.data?.status || 'pending',
        customerEmail,
        JSON.stringify(shippingInfo),
        JSON.stringify(merchizeItems),
      ],
      (err) => {
        if (err) console.error('Failed to record order:', err);
        else console.log('Order pushed to Merchize:', paymentIntent.id);
      }
    );
  } catch (error) {
    console.error('Merchize order push failed for', paymentIntent.id, error.response?.data || error.message);
  }
}

// Stripe webhook handler for automatic sales updates
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the payment_intent.succeeded event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Payment successful:', paymentIntent.id);
    
    try {
      // Parse items from metadata
      const items = JSON.parse(paymentIntent.metadata.items || '[]');
      
      // Update sales for each item
      for (const item of items) {
        db.run(
          'UPDATE products SET sales = sales + ? WHERE id = ?',
          [item.quantity, item.id],
          function(err) {
            if (err) {
              console.error('Failed to update sales:', err);
            } else {
              console.log(`Updated sales for ${item.name}: +${item.quantity}`);
            }
          }
        );
      }
      
      // Record the sale in donations table
      const totalAmount = paymentIntent.amount / 100; // Convert from cents to dollars
      const customerEmail = paymentIntent.metadata.customer_email || 'Stripe Customer';
      const itemsList = items.map(item => `${item.name} (${item.quantity})`).join(', ');
      
      db.run(
        'INSERT INTO donations (id, amount, donor, date, message) VALUES (?, ?, ?, ?, ?)',
        [
          paymentIntent.id,
          totalAmount,
          customerEmail,
          new Date().toLocaleDateString(),
          `Purchase: ${itemsList}`
        ],
        function(err) {
          if (err) {
            console.error('Failed to record donation:', err);
          } else {
            console.log('Sale recorded successfully');
          }
        }
      );

      await fulfillWithMerchize(paymentIntent, items, customerEmail);

    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({received: true});
});

// Merchize webhook handler - order status/tracking updates.
// https://seller.merchize.com/a/api-documents -> Webhooks
app.post('/api/merchize/webhook', (req, res) => {
  const key = req.headers['merchize-webhook-key'];
  if (!process.env.MERCHIZE_WEBHOOK_SECRET || key !== process.env.MERCHIZE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook key' });
  }

  const { event_type, resource } = req.body || {};
  const orderId = resource?.external_number;

  if (!orderId) {
    return res.status(200).json({ received: true });
  }

  db.run(
    `UPDATE orders SET
       merchize_order_code = COALESCE(?, merchize_order_code),
       status = COALESCE(?, status),
       tracking_company = COALESCE(?, tracking_company),
       tracking_number = COALESCE(?, tracking_number),
       tracking_url = COALESCE(?, tracking_url),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      resource.order_code || null,
      resource.status || null,
      resource.tracking_company || null,
      resource.tracking_number || null,
      resource.tracking_url || null,
      orderId,
    ],
    function(err) {
      if (err) console.error('Failed to apply Merchize webhook:', err);
      else console.log(`Merchize webhook ${event_type} applied to order ${orderId} (${this.changes} row(s))`);
    }
  );

  res.status(200).json({ received: true });
});

// Orders endpoints
app.get('/api/orders', verifyToken, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(row);
  });
});

// Get payment status
app.get('/api/payment/:id/status', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
