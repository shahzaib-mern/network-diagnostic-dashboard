const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

async function fetchJson(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => null);
    const error = body ? `${response.status} ${body}` : `HTTP ${response.status}`;
    throw new Error(error);
  }
  return response.json();
}

export async function fetchInterfaces() {
  return fetchJson('/api/interfaces');
}

export async function fetchDns(target) {
  return fetchJson('/api/dns', {
    method: 'POST',
    body: JSON.stringify({ target }),
  });
}

export async function fetchPing(target, count = 4) {
  return fetchJson('/api/ping', {
    method: 'POST',
    body: JSON.stringify({ target, count }),
  });
}

export async function fetchTraceroute(target) {
  return fetchJson('/api/traceroute', {
    method: 'POST',
    body: JSON.stringify({ target }),
  });
}

export async function fetchHealth() {
  return fetchJson('/api/health');
}

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
