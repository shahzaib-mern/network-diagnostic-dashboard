const { dns, sanitize, setCorsHeaders } = require('./_shared');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const target = sanitize(body.target);
  if (!target) return res.status(400).json({ error: 'Invalid target' });

  try {
    const results = [];
    const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];

    await Promise.all(recordTypes.map(async (type) => {
      try {
        let records;
        switch (type) {
          case 'A': records = await dns.resolve4(target, { ttl: true }); break;
          case 'AAAA': records = await dns.resolve6(target, { ttl: true }); break;
          case 'MX': records = await dns.resolveMx(target); break;
          case 'CNAME': records = await dns.resolveCname(target); break;
          case 'TXT': records = await dns.resolveTxt(target); break;
          case 'NS': records = await dns.resolveNs(target); break;
          default: records = [];
        }
        if (records && records.length > 0) {
          records.forEach(r => {
            if (type === 'A' || type === 'AAAA') {
              results.push({ type, value: r.address, ttl: r.ttl });
            } else if (type === 'MX') {
              results.push({ type, value: r.exchange, priority: r.priority, ttl: null });
            } else if (type === 'TXT') {
              results.push({ type, value: Array.isArray(r) ? r.join(' ') : String(r), ttl: null });
            } else {
              results.push({ type, value: String(r), ttl: null });
            }
          });
        }
      } catch (_) {}
    }));

    let reverseLookup = null;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(target)) {
      try {
        const hostnames = await dns.reverse(target);
        reverseLookup = hostnames[0] || null;
      } catch (_) {}
    }

    res.json({ target, records: results, reverseLookup, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
