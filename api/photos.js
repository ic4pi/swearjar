const { readStore } = require('./_store');

/* Public, read-only photo gallery list. Adding, editing and deleting
   happens through /api/admin (see admin.js) — same split as
   api/shows.js. */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { photos } = await readStore();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.status(200).json({ photos });
  } catch (err) {
    console.error('photos list failed:', err.message);
    res.status(200).json({ photos: [] });
  }
};
