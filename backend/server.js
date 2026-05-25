const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { exec, spawn } = require('child_process');
const os = require('os');
const si = require('systeminformation');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// ── Utility: detect OS ───────────────────────────────────────────────
const isWindows = os.platform() === 'win32';
const isLinux   = os.platform() === 'linux';
const isMac     = os.platform() === 'darwin';

// ── Utility: sanitize user input ─────────────────────────────────────
function sanitize(input) {
  if (!input || typeof input !== 'string') return null;
  // Allow only hostname/IP safe characters
  const safe = input.trim().replace(/[^a-zA-Z0-9.\-:_]/g, '');
  if (safe.length === 0 || safe.length > 253) return null;
  return safe;
}

// ── Route: GET /api/health ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: os.platform(), timestamp: Date.now() });
});

// ── Route: GET /api/interfaces ────────────────────────────────────────
app.get('/api/interfaces', async (req, res) => {
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

    // Check internet connectivity
    let isOnline = false;
    try {
      await dns.lookup('google.com');
      isOnline = true;
    } catch (_) {}

    res.json({
      interfaces,
      gateway: defaultGateway || '',
      hostname: os.hostname(),
      platform: os.platform(),
      isOnline,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Route: POST /api/dns ──────────────────────────────────────────────
app.post('/api/dns', async (req, res) => {
  const target = sanitize(req.body.target);
  if (!target) return res.status(400).json({ error: 'Invalid target' });

  try {
    const results = [];
    const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];

    await Promise.allSettled(
      recordTypes.map(async (type) => {
        try {
          let records;
          switch (type) {
            case 'A':     records = await dns.resolve4(target, { ttl: true }); break;
            case 'AAAA':  records = await dns.resolve6(target, { ttl: true }); break;
            case 'MX':    records = await dns.resolveMx(target); break;
            case 'CNAME': records = await dns.resolveCname(target); break;
            case 'TXT':   records = await dns.resolveTxt(target); break;
            case 'NS':    records = await dns.resolveNs(target); break;
            default:      records = [];
          }
          if (records && records.length > 0) {
            records.forEach(r => {
              if (type === 'A' || type === 'AAAA') {
                results.push({ type, value: r.address, ttl: r.ttl });
              } else if (type === 'MX') {
                results.push({ type, value: r.exchange, priority: r.priority, ttl: null });
              } else if (type === 'TXT') {
                results.push({ type, value: r.join(' '), ttl: null });
              } else {
                results.push({ type, value: String(r), ttl: null });
              }
            });
          }
        } catch (_) {}
      })
    );

    // Also try reverse lookup if it's an IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    let reverseLookup = null;
    if (ipRegex.test(target)) {
      try {
        const hostnames = await dns.reverse(target);
        reverseLookup = hostnames[0] || null;
      } catch (_) {}
    }

    res.json({
      target,
      records: results,
      reverseLookup,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Route: POST /api/ping ──────────────────────────────────────────────
app.post('/api/ping', async (req, res) => {
  setCorsHeaders(res);
  const target = sanitize(req.body.target);
  if (!target) return res.status(400).json({ error: 'Invalid target' });

  try {
    const result = await runPingBatch(target, req.body.count);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Route: POST /api/traceroute ───────────────────────────────────────
app.post('/api/traceroute', async (req, res) => {
  setCorsHeaders(res);
  const target = sanitize(req.body.target);
  if (!target) return res.status(400).json({ error: 'Invalid target' });

  try {
    const result = await runTraceroute(target);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WebSocket: Ping ───────────────────────────────────────────────────
// ws message: { type: 'ping', target, count, interval }
// ws message: { type: 'stop' }

// ── WebSocket: Traceroute ─────────────────────────────────────────────
// ws message: { type: 'traceroute', target }

wss.on('connection', (ws) => {
  let activeProcess = null;
  let pingInterval = null;
  let pingCount = 0;
  let maxCount = 10;
  let isStopped = false;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'stop') {
      isStopped = true;
      if (pingInterval) clearInterval(pingInterval);
      if (activeProcess) { try { activeProcess.kill('SIGTERM'); } catch (_) {} }
      ws.send(JSON.stringify({ type: 'stopped' }));
      return;
    }

    if (msg.type === 'ping') {
      const target = sanitize(msg.target);
      if (!target) { ws.send(JSON.stringify({ type: 'error', message: 'Invalid target' })); return; }
      maxCount = Math.min(Math.max(parseInt(msg.count) || 10, 1), 50);
      const intervalMs = Math.max(parseInt(msg.interval) || 1000, 500);
      isStopped = false;
      pingCount = 0;

      ws.send(JSON.stringify({ type: 'ping_start', target, count: maxCount }));

      const doPing = () => {
        if (isStopped || pingCount >= maxCount) {
          clearInterval(pingInterval);
          if (!isStopped) ws.send(JSON.stringify({ type: 'ping_done' }));
          return;
        }

        const seq = ++pingCount;
        const start = Date.now();

        // Use system ping command for one packet
        const pingCmd = isWindows
          ? `ping -n 1 -w 2000 ${target}`
          : `ping -c 1 -W 2 ${target}`;

        exec(pingCmd, (err, stdout) => {
          if (isStopped) return;

          const elapsed = Date.now() - start;
          let rtt = null;
          let success = false;

          if (!err) {
            // Parse RTT from output
            const rttMatch = isWindows
              ? stdout.match(/Average = (\d+)ms/) || stdout.match(/time[=<](\d+)ms/i)
              : stdout.match(/time[=<]([\d.]+) ms/i) || stdout.match(/time[=<]([\d.]+)ms/i);

            if (rttMatch) {
              rtt = parseFloat(rttMatch[1]);
              success = true;
            }
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping_result',
              seq,
              target,
              rtt,
              success,
              timestamp: Date.now()
            }));
          }
        });
      };

      // First ping immediately, then on interval
      doPing();
      pingInterval = setInterval(doPing, intervalMs);
    }

    if (msg.type === 'traceroute') {
      const target = sanitize(msg.target);
      if (!target) { ws.send(JSON.stringify({ type: 'error', message: 'Invalid target' })); return; }
      isStopped = false;

      ws.send(JSON.stringify({ type: 'traceroute_start', target }));

      const traceCmd = isWindows ? 'tracert' : 'traceroute';
      const traceArgs = isWindows
        ? ['-d', '-h', '30', '-w', '3000', target]
        : ['-m', '30', '-w', '3', '-n', target];

      activeProcess = spawn(traceCmd, traceArgs);
      let hopNum = 0;

      let traceBuffer = '';
      activeProcess.stdout.on('data', (chunk) => {
        if (isStopped) return;
        traceBuffer += chunk.toString();
        const lines = traceBuffer.split(/\r?\n/);
        traceBuffer = lines.pop() || '';

        lines.forEach(line => {
          line = line.trim();
          if (!line) return;

          const hop = parseTraceLine(line, isWindows);
          if (hop) {
            hopNum++;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'traceroute_hop', hop: { ...hop, num: hopNum } }));
            }
          }
        });
      });

      activeProcess.stdout.on('end', () => {
        if (traceBuffer) {
          const lastHop = parseTraceLine(traceBuffer.trim(), isWindows);
          if (lastHop) {
            hopNum++;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'traceroute_hop', hop: { ...lastHop, num: hopNum } }));
            }
          }
        }
      });

      activeProcess.stderr.on('data', () => {});

      activeProcess.on('close', () => {
        if (ws.readyState === WebSocket.OPEN && !isStopped) {
          ws.send(JSON.stringify({ type: 'traceroute_done' }));
        }
      });

      activeProcess.on('error', (err) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
      });
    }
  });

  ws.on('close', () => {
    isStopped = true;
    if (pingInterval) clearInterval(pingInterval);
    if (activeProcess) { try { activeProcess.kill('SIGTERM'); } catch (_) {} }
  });
});

// ── Parse traceroute line ─────────────────────────────────────────────
function parseTraceLine(line, windows) {
  if (windows) {
    // Windows: "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
    const match = line.match(/^\s*(\d+)\s+([\d<*\s]+ms[\d<*\s]+ms[\d<*\s]+ms|[\*\s]+)\s*([\d.]+|[\w.-]+)?\s*$/i);
    if (!match) return null;
    const num = parseInt(match[1]);
    if (isNaN(num)) return null;
    const timePart = match[2] || '';
    const ip = match[3] || null;
    const times = [...timePart.matchAll(/(\d+)\s*ms/g)].map(m => parseInt(m[1]));
    const rtt = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const timedOut = timePart.includes('*') || times.length === 0;
    return { ip: ip || '*', rtt, timedOut, raw: line.trim() };
  } else {
    // Linux/Mac: "  1  192.168.1.1  1.234 ms  1.456 ms  1.789 ms"
    const match = line.match(/^\s*(\d+)\s+([^\s]+)\s+(.*)/);
    if (!match) return null;
    const ip = match[2];
    if (ip === '*') return { ip: '*', rtt: null, timedOut: true, raw: line.trim() };
    const times = [...match[3].matchAll(/([\d.]+)\s*ms/g)].map(m => parseFloat(m[1]));
    const rtt = times.length > 0 ? parseFloat((times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)) : null;
    return { ip, rtt, timedOut: times.length === 0, raw: line.trim() };
  }
}

// ── Start server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Network Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🖥  Platform: ${os.platform()} | Node: ${process.version}\n`);
});
