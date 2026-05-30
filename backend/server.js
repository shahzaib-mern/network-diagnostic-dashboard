'use strict';

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const WebSocket  = require('ws');
const { exec, spawn } = require('child_process');
const os         = require('os');
const dns        = require('dns').promises;
const si         = require('systeminformation');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// ── CORS ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  // Deployment: add your production domain here, e.g.:
  // process.env.FRONTEND_URL,
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (same-origin, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ── Utility: detect OS ───────────────────────────────────────────────
const isWindows = os.platform() === 'win32';

// ── Utility: sanitize user input ─────────────────────────────────────
function sanitize(input) {
  if (!input || typeof input !== 'string') return null;
  const safe = input.trim().replace(/[^a-zA-Z0-9.\-:_]/g, '');
  if (safe.length === 0 || safe.length > 253) return null;
  return safe;
}

// ── Route: GET /api/health ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: os.platform(),
    hostname: os.hostname(),
    timestamp: Date.now(),
  });
});

// ── Route: GET /api/interfaces ────────────────────────────────────────
app.get('/api/interfaces', async (_req, res) => {
  try {
    const [netIfaces, defaultGateway, networkStats] = await Promise.all([
      si.networkInterfaces(),
      si.networkGatewayDefault(),
      si.networkStats(),
    ]);

    const statsMap = {};
    (networkStats || []).forEach(s => { statsMap[s.iface] = s; });

    const interfaces = (netIfaces || [])
      .filter(iface => !iface.internal && iface.ip4 && iface.ip4 !== '127.0.0.1')
      .map(iface => ({
        name:       iface.iface,
        ip4:        iface.ip4,
        ip6:        iface.ip6 || '',
        mac:        iface.mac || '',
        netmask:    iface.ip4subnet || '',
        type:       iface.type || 'unknown',
        speed:      iface.speed || 0,
        operstate:  iface.operstate || 'unknown',
        dhcp:       iface.dhcp || false,
        rx_bytes:   statsMap[iface.iface]?.rx_bytes || 0,
        tx_bytes:   statsMap[iface.iface]?.tx_bytes || 0,
      }));

    // Internet connectivity check
    let isOnline = false;
    try { await dns.lookup('1.1.1.1'); isOnline = true; } catch (_) {}

    res.json({
      interfaces,
      gateway:  defaultGateway || '',
      hostname: os.hostname(),
      platform: os.platform(),
      isOnline,
      timestamp: Date.now(),
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
    const dnsTimeoutMs = 5000;

    const publicResolver = new dns.Resolver();
    publicResolver.setServers(['1.1.1.1', '8.8.8.8']);

    await Promise.allSettled(
      recordTypes.map(async (type) => {
        try {
          let records = [];
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), dnsTimeoutMs)
          );

          const resolveWithFallback = async (method, opts) => {
            try {
              return await Promise.race([dns[method](target, opts), timeoutPromise]);
            } catch (err) {
              try {
                return await Promise.race([publicResolver[method](target, opts), timeoutPromise]);
              } catch (_err) {
                return [];
              }
            }
          };

          try {
            switch (type) {
              case 'A':
                records = await resolveWithFallback('resolve4', { ttl: true });
                if ((!records || records.length === 0) && !records?.length) {
                  records = (await dns.lookup(target, { all: true })).filter(r => r.family === 4);
                }
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    results.push({ type: 'A', value: r.address || String(r), ttl: r.ttl || null });
                  });
                }
                break;
              case 'AAAA':
                records = await resolveWithFallback('resolve6', { ttl: true });
                if ((!records || records.length === 0) && !records?.length) {
                  records = (await dns.lookup(target, { all: true })).filter(r => r.family === 6);
                }
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    results.push({ type: 'AAAA', value: r.address || String(r), ttl: r.ttl || null });
                  });
                }
                break;
              case 'MX':
                records = await resolveWithFallback('resolveMx');
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    results.push({ type: 'MX', value: r.exchange || String(r), priority: r.priority || null, ttl: null });
                  });
                }
                break;
              case 'CNAME':
                records = await resolveWithFallback('resolveCname');
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    results.push({ type: 'CNAME', value: String(r), ttl: null });
                  });
                }
                break;
              case 'TXT':
                records = await resolveWithFallback('resolveTxt');
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    const value = Array.isArray(r) ? r.join(' ') : String(r);
                    results.push({ type: 'TXT', value, ttl: null });
                  });
                }
                break;
              case 'NS':
                records = await resolveWithFallback('resolveNs');
                if (Array.isArray(records)) {
                  records.forEach(r => {
                    results.push({ type: 'NS', value: String(r), ttl: null });
                  });
                }
                break;
              default:
                records = [];
            }
          } catch (err) {
            // Silently ignore individual query failures
          }
        } catch (_) {}
      })
    );

    // Reverse lookup if IP
    let reverseLookup = null;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(target)) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), dnsTimeoutMs)
        );
        const hostnames = await Promise.race([dns.reverse(target), timeoutPromise]);
        reverseLookup = hostnames[0] || null;
      } catch (_) {}
    }

    res.json({ target, records: results, reverseLookup, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WebSocket handler ─────────────────────────────────────────────────
wss.on('connection', (ws) => {
  let activeProcess  = null;
  let pingInterval   = null;
  let pingCount      = 0;
  let maxCount       = 10;
  let isStopped      = false;

  const safeSend = (obj) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  };

  const cleanup = () => {
    isStopped = true;
    if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
    if (activeProcess) {
      try { activeProcess.kill('SIGTERM'); } catch (_) {}
      activeProcess = null;
    }
  };

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    // ── STOP ──────────────────────────────────────────────────────
    if (msg.type === 'stop') {
      cleanup();
      safeSend({ type: 'stopped' });
      return;
    }

    // ── PING ──────────────────────────────────────────────────────
    if (msg.type === 'ping') {
      cleanup();
      const target = sanitize(msg.target);
      if (!target) { safeSend({ type: 'error', message: 'Invalid target' }); return; }

      maxCount    = Math.min(Math.max(parseInt(msg.count) || 10, 1), 50);
      const intervalMs = Math.max(parseInt(msg.interval) || 1000, 500);
      isStopped   = false;
      pingCount   = 0;

      safeSend({ type: 'ping_start', target, count: maxCount });

      const doPing = () => {
        if (isStopped || pingCount >= maxCount) {
          if (pingInterval) clearInterval(pingInterval);
          if (!isStopped) safeSend({ type: 'ping_done' });
          return;
        }
        const seq   = ++pingCount;
        const start = Date.now();

        const pingArgs = isWindows
          ? ['-n', '1', '-w', '2000', target]
          : ['-c', '1', '-W', '2', target];
        const pingCmd  = isWindows ? 'ping' : 'ping';

        const proc = spawn(pingCmd, pingArgs);
        let stdout  = '';
        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.on('close', (code) => {
          if (isStopped) return;
          let rtt     = null;
          let success = false;

          if (code === 0) {
            let rttMatch = null;
            if (isWindows) {
              // Windows ping output: "Reply from X: bytes=32 time<1ms TTL=119"
              // or "Average = 1ms" in batch summary
              rttMatch = stdout.match(/Average\s*=\s*([\d.]+)\s*ms/i) 
                      || stdout.match(/time[=<]([\d.]+)\s*ms/i);
            } else {
              // Linux/Mac ping output: "time=1.234 ms" or "time<2.000 ms"
              rttMatch = stdout.match(/time[=<]([\d.]+)\s*ms/i);
            }
            if (rttMatch) {
              rtt     = parseFloat(rttMatch[1]);
              success = true;
            }
          }

          safeSend({ type: 'ping_result', seq, target, rtt, success, timestamp: Date.now() });
        });
        proc.on('error', () => {
          if (!isStopped) safeSend({ type: 'ping_result', seq, target, rtt: null, success: false, timestamp: Date.now() });
        });
      };

      doPing();
      pingInterval = setInterval(doPing, intervalMs);
    }

    // ── TRACEROUTE ────────────────────────────────────────────────
    if (msg.type === 'traceroute') {
      cleanup();
      const target = sanitize(msg.target);
      if (!target) { safeSend({ type: 'error', message: 'Invalid target' }); return; }
      isStopped = false;

      safeSend({ type: 'traceroute_start', target });

      // Build command & args per platform
      const traceCmd  = isWindows ? 'tracert' : 'traceroute';
      const traceArgs = isWindows
        ? ['-d', '-h', '30', '-w', '3000', target]
        : ['-m', '30', '-w', '3', '-q', '3', '-n', target];

      activeProcess = spawn(traceCmd, traceArgs);

      let traceBuffer = '';

      activeProcess.stdout.on('data', (chunk) => {
        if (isStopped) return;
        traceBuffer += chunk.toString();
        const lines = traceBuffer.split(/\r?\n/);
        traceBuffer  = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const hop = parseTraceLine(trimmed, isWindows);
          if (hop) safeSend({ type: 'traceroute_hop', hop });
        }
      });

      activeProcess.stdout.on('end', () => {
        if (traceBuffer.trim()) {
          const hop = parseTraceLine(traceBuffer.trim(), isWindows);
          if (hop) safeSend({ type: 'traceroute_hop', hop });
        }
      });

      activeProcess.stderr.on('data', () => {});

      activeProcess.on('close', () => {
        if (!isStopped) safeSend({ type: 'traceroute_done' });
        activeProcess = null;
      });

      activeProcess.on('error', (err) => {
        safeSend({ type: 'error', message: `traceroute not available: ${err.message}` });
      });
    }
  });

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// ── Parse traceroute line ─────────────────────────────────────────────
//
// Linux/Mac output:
//   " 1  192.168.1.1  1.234 ms  1.456 ms  1.789 ms"
//   " 2  * * *"
//
// Windows (tracert) output:
//   "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
//   "  5     *        *        *     Request timed out."
//
function parseTraceLine(line, windows) {
  if (windows) {
    // Match "  N   <1 ms  <1 ms  <1 ms  A.B.C.D" or timeout variant
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    if (!match) return null;
    const num = parseInt(match[1]);
    if (isNaN(num)) return null;
    const rest = match[2];

    const isTimeout = /Request timed out/i.test(rest) || !/\d/.test(rest.replace(/\*/g, ''));
    if (isTimeout) return { num, ip: '*', rtt: null, timedOut: true, raw: line };

    const ipMatch = rest.match(/([\d.]+)\s*$/);
    const ip      = ipMatch ? ipMatch[1] : '*';
    const times   = [...rest.matchAll(/(\d+)\s*ms/gi)].map(m => parseInt(m[1]));
    const rtt     = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

    return { num, ip, rtt, timedOut: rtt === null, raw: line };
  } else {
    // Linux/Mac: first token is hop number
    const match = line.match(/^\s*(\d+)\s+(.*)/);
    if (!match) return null;
    const num = parseInt(match[1]);
    if (isNaN(num) || num < 1 || num > 64) return null;
    const rest = match[2].trim();

    // Timeout: all stars
    if (/^\*[\s*]*$/.test(rest)) {
      return { num, ip: '*', rtt: null, timedOut: true, raw: line };
    }

    // Extract IP (first token)
    const parts = rest.split(/\s+/);
    const ip    = parts[0];
    // Extract all ms values
    const times = [...rest.matchAll(/([\d.]+)\s*ms/g)].map(m => parseFloat(m[1]));
    const rtt   = times.length
      ? parseFloat((times.reduce((a, b) => a + b, 0) / times.length).toFixed(2))
      : null;

    return { num, ip, rtt, timedOut: times.length === 0, raw: line };
  }
}

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀  NetPulse Backend  →  http://localhost:${PORT}`);
  console.log(`📡  WebSocket ready`);
  console.log(`🖥   Platform: ${os.platform()} | Node: ${process.version}\n`);
});
