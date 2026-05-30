export async function getPublicIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return d.ip || '';
  } catch {
    try {
      const r = await fetch('https://ipv4.icanhazip.com', { signal: AbortSignal.timeout(5000) });
      return (await r.text()).trim();
    } catch { return ''; }
  }
}
