const crypto = require('crypto');
const { readStore, writeStore } = require('./_store');

/* ── BOOKING / CONTACT INBOX ────────────────────────────────────────────
   Public write, admin-only read. Anyone can submit a booking or contact
   request; only /api/admin?action=messages (see admin.js) can list them.
   Same Blob-backed store as shows/videos/photos — see _store.js. */

const MAX_LEN = { name: 120, email: 200, phone: 40, message: 4000 };

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, MAX_LEN.name);
  const email = String(body.email || '').trim().slice(0, MAX_LEN.email);
  const phone = String(body.phone || '').trim().slice(0, MAX_LEN.phone);
  const type = body.type === 'booking' ? 'booking' : 'general';
  const message = String(body.message || '').trim().slice(0, MAX_LEN.message);

  if (!name || !isEmail(email) || !message) {
    res.status(400).json({ error: 'Name, a valid email, and a message are required.' });
    return;
  }

  try {
    const store = await readStore();
    const entry = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      type,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    store.messages = [entry, ...store.messages].slice(0, 500);
    await writeStore(store);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('message submit failed:', err.message);
    res.status(503).json({ error: 'Could not send right now — try again shortly, or email directly.' });
  }
};
