// API base: use Vite proxy in dev (empty string = relative), or explicit URL via env var
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

async function fetchJson(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => null);
    throw new Error(body ? `${response.status}: ${body}` : `HTTP ${response.status}`);
  }
  return response.json();
}

export const fetchHealth     = ()       => fetchJson('/api/health');
export const fetchInterfaces = ()       => fetchJson('/api/interfaces');
export const fetchDns        = (target) => fetchJson('/api/dns', { method: 'POST', body: JSON.stringify({ target }) });

// These are kept for REST fallback but real usage is via WebSocket
export const fetchPing = (target, count = 4) =>
  fetchJson('/api/ping', { method: 'POST', body: JSON.stringify({ target, count }) });

export const fetchTraceroute = (target) =>
  fetchJson('/api/traceroute', { method: 'POST', body: JSON.stringify({ target }) });

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatRtt(rtt) {
  if (rtt === null || rtt === undefined) return '—';
  return `${rtt} ms`;
}

// WebSocket URL — respects Vite proxy in dev, or custom env var
export function getWsUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    const base = import.meta.env.VITE_API_BASE_URL;
    return base.replace(/^http/, 'ws');
  }
  // In dev, connect directly to backend WebSocket server
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//localhost:3001`;
}
