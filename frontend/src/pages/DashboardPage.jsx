import React, { useEffect, useState } from 'react';
import { getPublicIP } from '../utils/getPublicIP';
import { Activity, Wifi, Globe, GitBranch, Search, AlertTriangle } from 'lucide-react';
import { fetchInterfaces } from '../utils/api';
import { Tooltip } from '../components/Tooltip';

function StatCard({ title, value, sub, color, icon: Icon, onClick }) {
  return (
    <button onClick={onClick}
      className="card text-left hover:border-[#00d4ff33] transition-all duration-200 hover:-translate-y-0.5 group w-full">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}33` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#1e2d5a]">
          <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="font-mono text-xl font-bold text-[#e2e8f0] mb-0.5">{value}</div>
      <div className="text-xs font-medium text-[#94a3b8]">{title}</div>
      {sub && <div className="text-xs text-[#475569] mt-1 font-mono">{sub}</div>}
    </button>
  );
}

function RadarViz({ isOnline }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {[24, 36, 48].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-[#1e2d5a]"
          style={{ width: r * 2, height: r * 2, opacity: 0.5 - i * 0.1 }} />
      ))}
      {isOnline && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="radar-sweep absolute inset-0 origin-center"
            style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.15) 30deg, transparent 60deg)' }} />
        </div>
      )}
      <div className={`w-3 h-3 rounded-full z-10 ${isOnline ? 'bg-[#00ff88] glow-online' : 'bg-[#ff3366] glow-danger'}`} />
      <div className="absolute w-full h-px bg-[#1e2d5a]" />
      <div className="absolute h-full w-px bg-[#1e2d5a]" />
    </div>
  );
}

export default function DashboardPage({ onNavigate, history }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicIP, setPublicIP] = useState('');
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const load = () => {
    setLoading(true); setError(null);
    fetchInterfaces()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { getPublicIP().then(setPublicIP); }, []);
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  const pingHistory  = history.filter(h => h.type === 'ping');
  const traceHistory = history.filter(h => h.type === 'traceroute');
  const dnsHistory   = history.filter(h => h.type === 'dns');
  const lastPing     = pingHistory[0];
  const lastTrace    = traceHistory[0];
  const lastDns      = dnsHistory[0];

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e2e8f0] tracking-wide">
            NET<span className="text-[#00d4ff]">PULSE</span>
          </h1>
          <p className="text-[#475569] text-sm mt-1 font-mono">
            {data ? `${data.hostname} · ${data.platform}` : 'Loading system info…'}
          </p>
          <div className="mt-2 flex gap-4 text-xs font-mono text-[#475569]">
            <span><span className="text-[#94a3b8]">Public IP:</span> {publicIP || 'Detecting…'}</span>
            {data?.gateway && <span><span className="text-[#94a3b8]">Gateway:</span> {data.gateway}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RadarViz isOnline={data?.isOnline} />
          <div>
            <div className={`font-mono text-sm font-bold ${data?.isOnline ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
              {loading ? '…' : data?.isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className="text-[#475569] text-xs font-mono">{clock}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#ff336611] border border-[#ff336633] rounded-xl text-[#ff3366] text-sm">
          <AlertTriangle size={16} />
          <span className="font-mono flex-1">Backend error: {error}</span>
          <button onClick={load} className="text-xs underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Interfaces" value={loading ? '—' : (data?.interfaces?.length ?? 0)}
          sub={data?.interfaces?.[0]?.ip4 || ''} color="#00d4ff" icon={Wifi} onClick={() => onNavigate('interfaces')} />
        <StatCard title="Last Ping RTT" value={lastPing ? `${lastPing.avgRtt ?? '?'} ms` : '—'}
          sub={lastPing ? lastPing.target : 'No tests yet'} color="#00ff88" icon={Activity} onClick={() => onNavigate('ping')} />
        <StatCard title="Last Trace Hops" value={lastTrace ? lastTrace.hops : '—'}
          sub={lastTrace ? lastTrace.target : 'No traces yet'} color="#7c3aed" icon={GitBranch} onClick={() => onNavigate('traceroute')} />
        <StatCard title="DNS Lookups" value={dnsHistory.length}
          sub={lastDns ? lastDns.target : 'No lookups yet'} color="#ffaa00" icon={Search} onClick={() => onNavigate('dns')} />
      </div>

      {/* Interfaces quick view */}
      {data?.interfaces?.length > 0 && (
        <div className="card">
          <div className="section-title">Active Network Interfaces</div>
          <div className="grid gap-3">
            {data.interfaces.map((iface, i) => (
              <div key={i} className="flex flex-wrap items-center gap-4 p-3 bg-[#0a0e1a] rounded-xl border border-[#1e2d5a]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${iface.operstate === 'up' ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
                  <span className="font-mono text-sm font-semibold text-[#e2e8f0]">{iface.name}</span>
                  <span className="text-xs text-[#475569] hidden sm:block">{iface.type}</span>
                </div>
                <div className="font-mono text-sm">
                  <Tooltip term="IP"><span className="text-[#00d4ff]">{iface.ip4}</span></Tooltip>
                </div>
                {iface.netmask && (
                  <div className="font-mono text-xs text-[#475569]">
                    <Tooltip term="Subnet">{iface.netmask}</Tooltip>
                  </div>
                )}
                {iface.mac && (
                  <div className="font-mono text-xs text-[#475569]">
                    <Tooltip term="MAC">{iface.mac}</Tooltip>
                  </div>
                )}
                <div className="ml-auto flex gap-3 text-xs font-mono text-[#475569]">
                  {iface.speed > 0 && <span>{iface.speed} Mbps</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <div className="card">
          <div className="section-title">Recent Activity</div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono py-2 border-b border-[#1e2d5a] last:border-0">
                <span className={`badge ${
                  item.type === 'ping' ? 'bg-[#00ff8811] text-[#00ff88]' :
                  item.type === 'traceroute' ? 'bg-[#7c3aed22] text-[#a78bfa]' :
                  'bg-[#ffaa0011] text-[#ffaa00]'}`}>
                  {item.type}
                </span>
                <span className="text-[#94a3b8] flex-1 truncate">{item.target}</span>
                <span className="text-[#475569]">{new Date(item.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
