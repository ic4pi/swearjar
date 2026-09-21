const { readStore } = require('./_store');

/* Public, read-only site settings — currently just the donate button's
   Cash App tag. Changed through /api/admin (see admin.js). */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { settings } = await readStore();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ settings });
  } catch (err) {
    console.error('settings read failed:', err.message);
    res.status(200).json({ settings: {} });
  }
};
