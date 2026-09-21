const { readStore } = require('./_store');

/* Public, read-only list of upcoming shows. Adding, editing and deleting
   shows happens through /api/admin (see admin.js) — this endpoint is the
   read side the storefront polls, same split as api/products.js. */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { shows } = await readStore();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.status(200).json({ shows });
  } catch (err) {
    console.error('shows list failed:', err.message);
    res.status(200).json({ shows: [] });
  }
};
