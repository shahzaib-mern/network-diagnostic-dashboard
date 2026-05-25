const { runPingBatch, sanitize, setCorsHeaders } = require('./_shared');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const target = sanitize(body.target);
  const count = Math.min(Math.max(parseInt(body.count, 10) || 4, 1), 8);
  if (!target) return res.status(400).json({ error: 'Invalid target' });

  try {
    const result = await runPingBatch(target, count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
