const { put, list } = require('@vercel/blob');

/* ── SITE STORE ─────────────────────────────────────────────────────────
   The one piece of mutable admin content that doesn't fit Stripe (shows,
   the donate cashtag): kept as a single JSON file in Vercel Blob storage
   rather than a database, matching hexpo's "no persistent server, no
   SQLite" approach — Blob is already a dependency here for product image
   uploads (see api/admin.js), so this reuses it rather than adding a new
   supplier.

   Needs a Blob store connected to the Vercel project (Storage -> Create ->
   Blob) and BLOB_READ_WRITE_TOKEN set. Until then, reads fall back to
   defaults and writes fail with a clear error — the storefront and public
   endpoints must never go down just because Blob isn't wired up yet.

   Read-modify-write isn't atomic here: two admin edits landing in the same
   instant could clobber each other. Fine for one admin editing a handful
   of shows now and then; not fine at real concurrent-writer scale.
── */

const STORE_PATH = 'store/site-data.json';

// `auth` is deliberately separate from `settings`: api/settings.js returns
// `settings` verbatim to anyone (it's the public donate-cashtag read), so
// the day-to-day admin password must never live in that object or it would
// leak over the public endpoint.
const DEFAULTS = {
  shows: [],
  videos: [],
  photos: [],
  settings: { cashAppTag: '$TourettesInc' },
  auth: { password: 'TOURETTES2026', isDefault: true },
};

function defaults() {
  return {
    shows: [],
    videos: [],
    photos: [],
    settings: { ...DEFAULTS.settings },
    auth: { ...DEFAULTS.auth },
  };
}

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStore() {
  if (!configured()) return defaults();

  try {
    const { blobs } = await list({ prefix: STORE_PATH, limit: 1 });
    const entry = blobs.find((b) => b.pathname === STORE_PATH);
    if (!entry) return defaults();

    const res = await fetch(entry.url, { cache: 'no-store' });
    if (!res.ok) return defaults();

    const data = await res.json();
    return {
      shows: Array.isArray(data.shows) ? data.shows : [],
      videos: Array.isArray(data.videos) ? data.videos : [],
      photos: Array.isArray(data.photos) ? data.photos : [],
      settings: { ...DEFAULTS.settings, ...(data && typeof data.settings === 'object' ? data.settings : {}) },
      auth: { ...DEFAULTS.auth, ...(data && typeof data.auth === 'object' ? data.auth : {}) },
    };
  } catch (err) {
    console.error('site store read failed:', err.message);
    return defaults();
  }
}

async function writeStore(data) {
  if (!configured()) {
    const err = new Error(
      'No Blob store connected. In Vercel: Storage -> Create -> Blob, connect it to this project, then redeploy.'
    );
    err.code = 'not_configured';
    throw err;
  }
  await put(STORE_PATH, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

module.exports = { readStore, writeStore, configured, DEFAULTS };
