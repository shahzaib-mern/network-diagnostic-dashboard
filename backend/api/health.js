const { os, setCorsHeaders } = require('./_shared');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.status(200).json({ status: 'ok', platform: os.platform(), timestamp: Date.now() });
};
