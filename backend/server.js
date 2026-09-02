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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Set FRONTEND_URL (comma-separated for multiple) to the deployed frontend origin(s).
const defaultProdOrigins = ['https://zack-tippett.vercel.app'];
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
const db = new sqlite3.Database('./zacktippett.db');

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
    variants TEXT,
    printful_url TEXT,
    sales INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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
  const { id, name, description, price, image, category, variants, printfulUrl } = req.body;
  
  db.run(`INSERT INTO products (id, name, description, price, image, category, variants, printful_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, name, description, price, image, category, JSON.stringify(variants), printfulUrl], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.put('/api/products/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, variants, printfulUrl, sales } = req.body;
  
  db.run(`UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, 
          variants = ?, printful_url = ?, sales = ? WHERE id = ?`, 
    [name, description, price, image, category, JSON.stringify(variants), printfulUrl, sales || 0, id], function(err) {
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
    db.get('SELECT id, name, price FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
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
      verifiedItems.push({ id: product.id, name: product.name, quantity });
    }

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        items: JSON.stringify(verifiedItems),
        customer_email: req.body.customerEmail || ''
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler for automatic sales updates
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), (req, res) => {
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
      
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.json({received: true});
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
