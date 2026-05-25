const os = require('os');
const dns = require('dns').promises;
const si = require('systeminformation');
const { exec, spawn } = require('child_process');

const isWindows = os.platform() === 'win32';

function sanitize(input) {
  if (!input || typeof input !== 'string') return null;
  const safe = input.trim().replace(/[^a-zA-Z0-9.\-:_]/g, '');
  return safe.length > 0 && safe.length <= 253 ? safe : null;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parsePingOutput(stdout) {
  const text = String(stdout || '');
  const windowsMatch = text.match(/time[=<]([\d.]+)\s*ms/i);
  const unixMatch = text.match(/time[=<]([\d.]+)\s*ms/i);
  const success = !!(windowsMatch || unixMatch);
  const rtt = success ? parseFloat((windowsMatch || unixMatch)[1]) : null;
  return {
    success,
    rtt,
    raw: text.trim(),
  };
}

function parseTraceLine(line, windows) {
  if (!line || typeof line !== 'string') return null;
  line = line.trim();
  if (!line) return null;

  if (windows) {
    const match = line.match(/^\s*(\d+)\s+([\d<*\s]+ms[\d<*\s]+ms[\d<*\s]+ms|[\*\s]+)\s*([\d.]+|[\w.-]+)?\s*$/i);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    const timePart = match[2] || '';
    const ip = match[3] || '*';
    const times = [...timePart.matchAll(/(\d+)\s*ms/g)].map(m => parseInt(m[1], 10));
    const rtt = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const timedOut = timePart.includes('*') || times.length === 0;
    return { num, ip, rtt, timedOut, raw: line };
  }

  const match = line.match(/^\s*(\d+)\s+([^\s]+)\s+(.*)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const ip = match[2];
  const rest = match[3] || '';
  if (ip === '*') {
    return { num, ip: '*', rtt: null, timedOut: true, raw: line };
  }

  const timeMatches = [...rest.matchAll(/([\d.]+)\s*ms/g)].map(m => parseFloat(m[1]));
  const rtt = timeMatches.length ? parseFloat((timeMatches.reduce((a, b) => a + b, 0) / timeMatches.length).toFixed(2)) : null;
  return {
    num,
    ip,
    rtt,
    timedOut: timeMatches.length === 0,
    raw: line,
  };
}

function buildPingCommand(target) {
  return isWindows
    ? `ping -n 1 -w 2000 ${target}`
    : `ping -c 1 -W 2 ${target}`;
}

function buildTracerouteCommand(target) {
  if (isWindows) {
    return { command: 'tracert', args: ['-d', '-h', '30', '-w', '3000', target], windows: true };
  }
  return { command: 'traceroute', args: ['-n', '-m', '30', '-w', '2', target], windows: false };
}

function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024, ...options }, (err, stdout, stderr) => {
      if (err && stderr && !stdout) return reject(err);
      resolve({ stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

async function runPingBatch(target, count = 4) {
  const sanitized = sanitize(target);
  if (!sanitized) {
    throw new Error('Invalid target');
  }

  const attempts = Math.min(Math.max(parseInt(count, 10) || 4, 1), 8);
  const results = [];

  for (let seq = 1; seq <= attempts; seq += 1) {
    try {
      const { stdout } = await execCommand(buildPingCommand(sanitized));
      const { success, rtt, raw } = parsePingOutput(stdout);
      results.push({ seq, success, rtt, raw, timestamp: Date.now() });
    } catch (err) {
      results.push({ seq, success: false, rtt: null, raw: String(err.message), timestamp: Date.now() });
    }
  }

  const rtts = results.filter(r => r.success && typeof r.rtt === 'number').map(r => r.rtt);
  const summary = {
    sent: results.length,
    received: rtts.length,
    loss: Math.round(((results.length - rtts.length) / results.length) * 100),
    min: rtts.length ? Math.min(...rtts) : null,
    max: rtts.length ? Math.max(...rtts) : null,
    avg: rtts.length ? parseFloat((rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(2)) : null,
  };

  return { target: sanitized, results, summary, timestamp: Date.now() };
}

function collectTraceOutput(child, windows) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const hops = [];

    child.stdout.on('data', (chunk) => {
      buffer += String(chunk);
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      lines.forEach((line) => {
        const hop = parseTraceLine(line, windows);
        if (hop) hops.push(hop);
      });
    });

    child.stdout.on('end', () => {
      if (buffer) {
        const hop = parseTraceLine(buffer, windows);
        if (hop) hops.push(hop);
      }
    });

    child.on('error', reject);
    child.on('close', () => resolve(hops));
  });
}

async function runTraceroute(target) {
  const sanitized = sanitize(target);
  if (!sanitized) {
    throw new Error('Invalid target');
  }

  const { command, args, windows } = buildTracerouteCommand(sanitized);
  const { stdout, stderr } = await execCommand(`${command} ${args.map(a => String(a)).join(' ')}`);
  const raw = stdout || stderr || '';

  const lines = raw.split(/\r?\n/);
  const hops = lines
    .map(line => parseTraceLine(line, windows))
    .filter(Boolean);

  if (hops.length === 0 && !windows) {
    try {
      const fallbackCommand = 'tracepath';
      const fallbackArgs = ['-n', sanitized];
      const { stdout: fallbackOut } = await execCommand(`${fallbackCommand} ${fallbackArgs.join(' ')}`);
      const fallbackLines = String(fallbackOut).split(/\r?\n/);
      fallbackLines.forEach(line => {
        const hop = parseTraceLine(line, false);
        if (hop) hops.push(hop);
      });
    } catch (_) {
      // fallback failed, continue with existing hops
    }
  }

  return {
    target: sanitized,
    hops,
    command: `${command} ${args.join(' ')}`,
    timestamp: Date.now(),
  };
}

async function runTracerouteStream(target, onHop) {
  const sanitized = sanitize(target);
  if (!sanitized) throw new Error('Invalid target');
  const { command, args, windows } = buildTracerouteCommand(sanitized);
  const child = spawn(command, args, { shell: false });
  const hops = [];
  let buffer = '';

  child.stdout.on('data', (chunk) => {
    buffer += String(chunk);
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    lines.forEach((line) => {
      const hop = parseTraceLine(line, windows);
      if (hop) {
        hops.push(hop);
        onHop(hop);
      }
    });
  });

  child.stderr.on('data', () => {});

  return new Promise((resolve, reject) => {
    child.on('close', () => resolve(hops));
    child.on('error', reject);
  });
}

module.exports = {
  os,
  dns,
  si,
  sanitize,
  setCorsHeaders,
  parsePingOutput,
  parseTraceLine,
  buildPingCommand,
  buildTracerouteCommand,
  execCommand,
  runPingBatch,
  runTraceroute,
  runTracerouteStream,
  isWindows,
};
