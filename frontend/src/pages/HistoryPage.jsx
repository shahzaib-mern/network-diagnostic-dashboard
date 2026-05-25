import React from 'react';
import { Clock, Trash2, Activity, GitBranch, Search, Wifi } from 'lucide-react';

const TYPE_META = {
  ping:       { icon: Activity,   label: 'Ping',       color: '#00ff88' },
  traceroute: { icon: GitBranch,  label: 'Traceroute', color: '#a78bfa' },
  dns:        { icon: Search,     label: 'DNS Lookup', color: '#ffaa00' },
};

export default function HistoryPage({ history, onClear, onNavigate }) {
  if (history.length === 0) {
    return (
      <div className="p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-[#e2e8f0]">Session History</h2>
        </div>
        <div className="card text-center py-20">
          <Clock size={40} className="mx-auto mb-4 text-[#1e2d5a]" />
          <p className="font-mono text-sm text-[#475569]">No diagnostic operations performed yet</p>
          <p className="font-mono text-xs text-[#2d3a5a] mt-2">History clears when you close the browser tab</p>
          <div className="flex gap-3 justify-center mt-6">
            {['ping', 'traceroute', 'dns'].map(t => {
              const meta = TYPE_META[t];
              return (
                <button key={t} onClick={() => onNavigate(t)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1e2d5a]
                    text-xs font-mono text-[#475569] hover:border-[#00d4ff33] hover:text-[#00d4ff] transition-all">
                  <meta.icon size={12} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const grouped = { ping: [], traceroute: [], dns: [] };
  history.forEach(item => { if (grouped[item.type]) grouped[item.type].push(item); });

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[#e2e8f0]">Session History</h2>
          <p className="text-[#475569] text-xs font-mono mt-1">{history.length} operations · saved to browser localStorage</p>
        </div>
        <button onClick={onClear}
          className="btn-ghost flex items-center gap-2 text-[#ff336688] hover:text-[#ff3366] hover:border-[#ff336622]">
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <div key={type} className="card p-3 text-center cursor-pointer hover:border-[#1e2d5a88]"
            onClick={() => onNavigate(type)}>
            <div className="font-mono text-2xl font-bold" style={{ color: meta.color }}>
              {grouped[type].length}
            </div>
            <div className="text-xs text-[#475569] font-mono mt-0.5">{meta.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="section-title">Full Timeline</div>
        <div className="space-y-2">
          {[...history].reverse().map((item, i) => {
            const meta = TYPE_META[item.type];
            const Icon = meta?.icon || Clock;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0e1a] border border-[#1e2d5a]
                hover:border-[#1e2d5a88] transition-all animate-slideUp" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${meta?.color}11`, border: `1px solid ${meta?.color}22` }}>
                  <Icon size={12} style={{ color: meta?.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-[#e2e8f0] truncate">{item.target}</div>
                  <div className="text-xs text-[#475569] font-mono mt-0.5">
                    {item.type === 'ping' && item.avgRtt !== null && `avg ${item.avgRtt} ms · ${item.loss}% loss`}
                    {item.type === 'traceroute' && `${item.hops} hops`}
                    {item.type === 'dns' && 'DNS resolved'}
                  </div>
                </div>
                <div className="text-xs font-mono text-[#475569] shrink-0">
                  {new Date(item.time).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
