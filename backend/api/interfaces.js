const { si, setCorsHeaders } = require('./_shared');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [netIfaces, defaultGateway, networkStats] = await Promise.all([
      si.networkInterfaces(),
      si.networkGatewayDefault(),
      si.networkStats()
    ]);

    const statsMap = {};
    (networkStats || []).forEach(s => { statsMap[s.iface] = s; });

    const interfaces = (netIfaces || [])
      .filter(iface => !iface.internal && iface.ip4 && iface.ip4 !== '127.0.0.1')
      .map(iface => ({
        name: iface.iface,
        ip4: iface.ip4,
        ip6: iface.ip6 || '',
        mac: iface.mac || '',
        netmask: iface.ip4subnet || '',
        type: iface.type || 'unknown',
        speed: iface.speed || 0,
        operstate: iface.operstate || 'unknown',
        dhcp: iface.dhcp || false,
        rx_bytes: statsMap[iface.iface]?.rx_bytes || 0,
        tx_bytes: statsMap[iface.iface]?.tx_bytes || 0,
      }));

    let isOnline = false;
    try { await require('dns').promises.lookup('google.com'); isOnline = true; } catch (_) {}

    res.json({
      interfaces,
      gateway: defaultGateway || '',
      hostname: require('os').hostname(),
      platform: require('os').platform(),
      isOnline,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
