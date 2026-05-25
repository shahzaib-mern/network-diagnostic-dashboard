import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { fetchDns } from '../utils/api';
import { Tooltip } from '../components/Tooltip';

const TYPE_COLORS = {
  A:     { bg: '#00d4ff11', text: '#00d4ff', border: '#00d4ff22' },
  AAAA:  { bg: '#7c3aed11', text: '#a78bfa', border: '#7c3aed22' },
  MX:    { bg: '#ffaa0011', text: '#ffaa00', border: '#ffaa0022' },
  CNAME: { bg: '#00ff8811', text: '#00ff88', border: '#00ff8822' },
  TXT:   { bg: '#ff336611', text: '#ff3366', border: '#ff336622' },
  NS:    { bg: '#e2e8f011', text: '#94a3b8', border: '#1e2d5a' },
};

const TYPE_DESCRIPTIONS = {
  A:     'Maps domain to IPv4 address',
  AAAA:  'Maps domain to IPv6 address',
  MX:    'Mail exchange server',
  CNAME: 'Alias for another domain name',
  TXT:   'Text info (SPF, DKIM, etc.)',
  NS:    'Authoritative name server',
};

export default function DnsPage({ onResult }) {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useLocalStorage('netpulse-dns-history', []);

  const lookup = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await fetchDns(target.trim());
      setResult(data);
      setHistory(prev => [{ target: target.trim(), count: data.records.length, time: Date.now() }, ...prev].slice(0, 10));
      onResult({ type: 'dns', target: target.trim(), time: Date.now() });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = result?.records?.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {}) || {};

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div>
        <h2 className="font-display text-xl font-bold text-[#e2e8f0]">
          <Tooltip term="DNS">DNS</Tooltip> Lookup
        </h2>
        <p className="text-[#475569] text-xs font-mono mt-1">
          Resolve domain names and inspect DNS records
        </p>
      </div>

      {/* Input */}
      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-mono text-[#475569] mb-1.5 block">Domain Name</label>
            <input
              className="input-field"
              placeholder="e.g., google.com, github.com"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && lookup()}
              disabled={loading}
            />
          </div>
          <button onClick={lookup} disabled={loading || !target.trim()}
            className="btn-primary flex items-center gap-2">
            {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            Lookup
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-[#475569] font-mono self-center">Quick:</span>
          {['google.com', 'cloudflare.com', 'github.com', 'amazon.com'].map(d => (
            <button key={d} onClick={() => { setTarget(d); }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#1e2d5a22] border border-[#1e2d5a]
                text-[#475569] hover:text-[#94a3b8] hover:border-[#00d4ff33] transition-all">
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#ff336611] border border-[#ff336633] rounded-xl text-[#ff3366] text-sm font-mono">
          Resolution failed: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slideUp">
          {/* Header */}
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-mono text-lg font-bold text-[#00d4ff]">{result.target}</div>
                {result.reverseLookup && (
                  <div className="text-xs text-[#475569] font-mono mt-0.5">
                    Reverse: {result.reverseLookup}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-[#e2e8f0]">{result.records.length}</div>
                <div className="text-xs text-[#475569] font-mono">Records Found</div>
              </div>
            </div>
          </div>

          {result.records.length === 0 ? (
            <div className="card text-center py-8 text-[#475569] font-mono text-sm">
              No DNS records found for this domain
            </div>
          ) : (
            Object.entries(grouped).map(([type, records]) => {
              const colors = TYPE_COLORS[type] || TYPE_COLORS.NS;
              return (
                <div key={type} className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge font-bold text-xs px-2.5 py-1"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {type}
                    </span>
                    <span className="text-xs text-[#475569] font-mono">
                      {TYPE_DESCRIPTIONS[type] || 'DNS Record'}
                    </span>
                    <span className="ml-auto text-xs text-[#475569] font-mono">
                      {records.length} record{records.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {records.map((rec, i) => (
                      <div key={i} className="flex items-start justify-between gap-4 p-2.5 bg-[#0a0e1a] rounded-xl border border-[#1e2d5a]">
                        <div className="font-mono text-sm text-[#e2e8f0] break-all flex-1">{rec.value}</div>
                        <div className="flex gap-3 shrink-0 text-xs font-mono text-[#475569]">
                          {rec.priority !== undefined && (
                            <span>Priority: {rec.priority}</span>
                          )}
                          {rec.ttl && (
                            <span>
                              <Tooltip term="TTL">TTL</Tooltip>: {rec.ttl}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && !result && (
        <div className="card">
          <div className="section-title">Recent Lookups</div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <button key={i} onClick={() => setTarget(item.target)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#ffffff05]
                  border border-transparent hover:border-[#1e2d5a] transition-all text-left">
                <span className="font-mono text-sm text-[#94a3b8]">{item.target}</span>
                <span className="font-mono text-xs text-[#475569]">{item.count} records</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="card text-center py-16">
          <Search size={40} className="mx-auto mb-4 text-[#1e2d5a]" />
          <p className="font-mono text-sm text-[#475569]">Enter a domain name to look up its DNS records</p>
          {history.length > 0 && (
            <div className="text-xs text-[#94a3b8] mt-3">Recent lookups are saved in localStorage.</div>
          )}
        </div>
      )}
    </div>
  );
}
