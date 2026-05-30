import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, ArrowDown, ArrowUp, HardDrive } from 'lucide-react';
import { fetchInterfaces, formatBytes } from '../utils/api';
import { Tooltip } from '../components/Tooltip';

export default function InterfacesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    fetchInterfaces()
      .then(d => { setData(d); setLoading(false); setLastUpdated(new Date()); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[#e2e8f0]">Network Interfaces</h2>
          <p className="text-[#475569] text-xs font-mono mt-1">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#ff336611] border border-[#ff336633] rounded-xl text-[#ff3366] text-sm font-mono">
          {error} — Is the backend running on port 3001?
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Hostname', value: data.hostname, icon: HardDrive },
            { label: 'Platform', value: data.platform },
            { label: 'Gateway', value: data.gateway || '—', tooltip: 'Gateway' },
            { label: 'Internet', value: data.isOnline ? 'Connected' : 'Offline',
              color: data.isOnline ? '#00ff88' : '#ff3366' },
          ].map((item, i) => (
            <div key={i} className="card p-3">
              <div className="text-[#475569] text-xs font-mono mb-1">{item.label}</div>
              <div className="font-mono text-sm font-semibold" style={{ color: item.color || '#e2e8f0' }}>
                {item.tooltip ? <Tooltip term={item.tooltip}>{item.value}</Tooltip> : item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.interfaces?.length === 0 && (
        <div className="card text-center py-12 text-[#475569] font-mono text-sm">
          No active network interfaces found
        </div>
      )}

      <div className="grid gap-4">
        {(data?.interfaces || []).map((iface, i) => (
          <div key={i} className="card animate-slideUp" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${iface.operstate === 'up' ? 'bg-[#00ff8811] border border-[#00ff8822]' : 'bg-[#ff336611] border border-[#ff336622]'}`}>
                  {iface.operstate === 'up'
                    ? <Wifi size={18} className="text-[#00ff88]" />
                    : <WifiOff size={18} className="text-[#ff3366]" />}
                </div>
                <div>
                  <div className="font-mono font-bold text-[#e2e8f0]">{iface.name}</div>
                  <div className="text-xs text-[#475569]">
                    {iface.type || 'Unknown'}
                    {iface.speed > 0 && ` · ${iface.speed} Mbps`}
                    {iface.dhcp && ' · DHCP'}
                  </div>
                </div>
              </div>
              <span className={`badge text-xs ${iface.operstate === 'up'
                ? 'bg-[#00ff8811] text-[#00ff88] border border-[#00ff8822]'
                : 'bg-[#ff336611] text-[#ff3366] border border-[#ff336622]'}`}>
                {(iface.operstate || 'unknown').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'IPv4 Address', value: iface.ip4, tooltip: 'IP', color: '#00d4ff' },
                { label: 'Subnet Mask', value: iface.netmask || '—', tooltip: 'Subnet' },
                { label: 'MAC Address', value: iface.mac || '—', tooltip: 'MAC' },
                { label: 'IPv6 Address', value: iface.ip6 || '—', tooltip: 'IP' },
                iface.rx_bytes > 0 && { label: 'Received', value: formatBytes(iface.rx_bytes), icon: ArrowDown, iconColor: '#00ff88' },
                iface.tx_bytes > 0 && { label: 'Transmitted', value: formatBytes(iface.tx_bytes), icon: ArrowUp, iconColor: '#00d4ff' },
              ].filter(Boolean).map((field, j) => (
                <div key={j} className="bg-[#0a0e1a] rounded-xl p-3 border border-[#1e2d5a]">
                  <div className="text-[#475569] text-xs mb-1 flex items-center gap-1">
                    {field.icon && <field.icon size={10} style={{ color: field.iconColor }} />}
                    {field.tooltip
                      ? <Tooltip term={field.tooltip}>{field.label}</Tooltip>
                      : field.label}
                  </div>
                  <div className="font-mono text-sm font-semibold truncate" style={{ color: field.color || '#94a3b8' }}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loading && !data && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card h-40 animate-pulse bg-[#0f1628]">
              <div className="h-4 bg-[#1e2d5a] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[#1e2d5a] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
