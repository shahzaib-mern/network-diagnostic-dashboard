import React, { useState, useCallback, useEffect } from 'react';
import { Play, Square, GitBranch, AlertCircle, CheckCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Tooltip } from '../components/Tooltip';

function HopRow({ hop, index }) {
  const isTimeout = hop.timedOut || hop.ip === '*';
  const rttColor = hop.rtt === null ? '#475569'
    : hop.rtt < 20  ? '#00ff88'
    : hop.rtt < 100 ? '#ffaa00'
    : '#ff3366';
  const statusLabel = isTimeout ? 'Timeout / no response' : 'Responded successfully';
  const latencyLabel = hop.rtt !== null ? `${hop.rtt} ms` : 'No response';
  const barValue = Math.min((hop.rtt ?? 0) / 300 * 100, 100);

  return (
    <div className="hop-node" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#141c35] border border-[#1e2d5a] flex items-center justify-center">
              <span className="font-mono text-sm text-[#00d4ff]">{hop.num}</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.24em] text-[#475569]">Hop step</div>
              <div className="font-mono text-sm text-[#e2e8f0]">{isTimeout ? '* * * (Request Timeout)' : hop.ip}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#94a3b8]">
            <div className="rounded-full border border-[#1e2d5a] px-2 py-1 bg-[#0a0e1a]">{statusLabel}</div>
            <div className="rounded-full border border-[#1e2d5a] px-2 py-1 bg-[#0a0e1a]">Latency: <span className="text-[#e2e8f0] font-semibold">{latencyLabel}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#94a3b8]">
          <div className="rounded-xl border border-[#1e2d5a] bg-[#0a0e1a] p-2">
            <div className="text-[10px] uppercase tracking-[0.3em]">Hop</div>
            <div className="mt-1 font-semibold text-[#e2e8f0]">{hop.num}</div>
          </div>
          <div className="rounded-xl border border-[#1e2d5a] bg-[#0a0e1a] p-2">
            <div className="text-[10px] uppercase tracking-[0.3em]">Status</div>
            <div className="mt-1 font-semibold text-[#e2e8f0]">{isTimeout ? 'Timeout' : 'Responded'}</div>
          </div>
          <div className="rounded-xl border border-[#1e2d5a] bg-[#0a0e1a] p-2">
            <div className="text-[10px] uppercase tracking-[0.3em]">Latency</div>
            <div className="mt-1 font-semibold" style={{ color: rttColor }}>{latencyLabel}</div>
          </div>
        </div>
      </div>

      {!isTimeout && hop.rtt !== null && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8] mb-2">
            <span>Latency bar</span>
            <span>{Math.round(barValue)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#1e2d5a] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barValue}%`, background: rttColor }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TraceroutePage({ onResult }) {
  const [target, setTarget] = useState('');
  const [hops, setHops] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [currentTarget, setCurrentTarget] = useState('');
  const [pendingResult, setPendingResult] = useState(null);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'traceroute_start':
        setCurrentTarget(msg.target);
        break;
      case 'traceroute_hop':
        if (msg.hop) setHops(hs => {
          // Deduplicate by hop number — use the authoritative num from server
          const exists = hs.find(h => h.num === msg.hop.num);
          if (exists) return hs;
          return [...hs, msg.hop];
        });
        break;
      case 'traceroute_done':
        setRunning(false);
        setDone(true);
        setHops(hs => {
          const hopCount = hs.length;
          setPendingResult({ type: 'traceroute', target: currentTarget || target.trim(), hops: hopCount, time: Date.now() });
          return hs;
        });
        break;
      case 'stopped':
        setRunning(false);
        break;
      case 'error':
        setError(msg.message);
        setRunning(false);
        break;
    }
  }, [target, currentTarget]);

  // Defer the onResult callback to avoid setState during render warning
  useEffect(() => {
    if (pendingResult) {
      onResult?.(pendingResult);
      setPendingResult(null);
    }
  }, [pendingResult, onResult]);

  const { send, stop } = useWebSocket(handleMessage);

  const startTrace = () => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setError(''); setHops([]); setDone(false); setRunning(true);
    send({ type: 'traceroute', target: trimmed });
  };

  const stopTrace = () => { stop(); setRunning(false); };

  const totalRtt = hops.filter(h => !h.timedOut && h.rtt).reduce((s, h) => s + h.rtt, 0);
  const validHops = hops.filter(h => !h.timedOut && h.rtt !== null);
  const timeouts = hops.filter(h => h.timedOut).length;
  const pathNodes = hops.map(hop => ({
    label: `Hop ${hop.num}`,
    subtitle: hop.ip === '*' ? 'Timeout' : hop.ip,
    status: hop.rtt === null ? 'No response' : `${hop.rtt} ms`,
  }));

  const pathPreview = pathNodes.length > 6
    ? [...pathNodes.slice(0, 4), { label: `+${pathNodes.length - 4} more`, subtitle: '', status: '' }]
    : pathNodes;

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div>
        <h2 className="font-display text-xl font-bold text-[#e2e8f0]">
          <Tooltip term="Traceroute">Traceroute</Tooltip> Visualization
        </h2>
        <p className="text-[#475569] text-xs font-mono mt-1">Map the network path hop-by-hop to any destination</p>
      </div>

      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-mono text-[#475569] mb-1.5 block">Target Host / IP</label>
            <input className="input-field" placeholder="e.g., google.com or 1.1.1.1"
              value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !running && startTrace()}
              disabled={running} />
          </div>
          <div className="flex gap-2">
            {!running
              ? <button onClick={startTrace} disabled={!target.trim()} className="btn-primary flex items-center gap-2">
                  <Play size={14} /> Trace
                </button>
              : <button onClick={stopTrace} className="btn-danger flex items-center gap-2">
                  <Square size={14} /> Stop
                </button>}
          </div>
        </div>
      </div>

      {hops.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#7c3aed]">{hops.length}</div>
            <div className="text-xs text-[#475569] font-mono"><Tooltip term="Hop">Total Hops</Tooltip></div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#00d4ff]">
              {validHops.length > 0 ? `${totalRtt.toFixed(1)} ms` : '—'}
            </div>
            <div className="text-xs text-[#475569] font-mono"><Tooltip term="RTT">Total RTT</Tooltip></div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#ff3366]">{timeouts}</div>
            <div className="text-xs text-[#475569] font-mono">Timeouts</div>
          </div>
        </div>
      )}

      {hops.length > 0 && (
        <>
          <div className="card p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-display text-sm font-bold text-[#e2e8f0]">Path Flow</div>
                <div className="text-xs font-mono text-[#94a3b8] mt-1">
                  Shows how the request travels from your device through each hop to reach the destination.
                </div>
              </div>
              <div className="text-xs font-mono text-[#94a3b8] flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full border border-[#1e2d5a] bg-[#0a0e1a]">Source</span>
                <span>→</span>
                <span className="px-2 py-1 rounded-full border border-[#1e2d5a] bg-[#0a0e1a]">Hop number</span>
                <span>→</span>
                <span className="px-2 py-1 rounded-full border border-[#1e2d5a] bg-[#0a0e1a]">Latency</span>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 py-2">
                <div className="flex-shrink-0 px-3 py-2 rounded-2xl bg-[#141c35] border border-[#1e2d5a] text-[#00d4ff] text-[11px] font-mono font-semibold">
                  Source
                </div>
                {pathPreview.map((node, idx) => (
                  <React.Fragment key={`${node.label}-${idx}`}>
                    <span className="text-[#94a3b8]">→</span>
                    <div className="min-w-[110px] flex-shrink-0 px-3 py-2 rounded-2xl bg-[#0a0e1a] border border-[#1e2d5a]">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#475569]">{node.label}</div>
                      <div className="text-[11px] font-mono text-[#e2e8f0] truncate mt-1">{node.subtitle || node.status || '...'}</div>
                    </div>
                  </React.Fragment>
                ))}
                <span className="text-[#94a3b8]">→</span>
                <div className="min-w-[110px] flex-shrink-0 px-3 py-2 rounded-2xl bg-[#081c10] border border-[#0f4f2f] text-[#00ff88] text-[11px] font-mono font-semibold">
                  Destination
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title mb-0">
                Path: <span className="text-[#00d4ff]">{currentTarget || target}</span>
              </div>
              {running && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#00d4ff]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" /> Tracing…
                </div>
              )}
              {done && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#00ff88]">
                  <CheckCircle size={12} /> Complete — {hops.length} hops
                </div>
              )}
            </div>

            {/* Source */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00d4ff08] border border-[#00d4ff22] mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#00d4ff22] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
              </div>
              <div className="font-mono text-sm text-[#00d4ff] font-bold">Your Device (Source)</div>
            </div>

            <div className="space-y-1.5">
              {hops.map((hop, i) => (
                <React.Fragment key={hop.num}>
                  <div className="hop-connector ml-3.5" />
                  <HopRow hop={hop} index={i} />
                </React.Fragment>
              ))}
            </div>

          {running && (
            <div className="flex items-center gap-3 p-3 mt-1.5">
              <div className="hop-connector ml-3.5" />
              <div className="w-7 h-7 rounded-lg border border-[#1e2d5a] border-dashed flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1e2d5a] animate-pulse" />
              </div>
              <div className="font-mono text-xs text-[#475569] animate-pulse">Discovering next hop…</div>
            </div>
          )}

          {done && hops.length > 0 && (
            <>
              <div className="hop-connector ml-3.5" />
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00ff8808] border border-[#00ff8822]">
                <div className="w-7 h-7 rounded-lg bg-[#00ff8822] flex items-center justify-center">
                  <GitBranch size={12} className="text-[#00ff88]" />
                </div>
                <div className="font-mono text-sm text-[#00ff88] font-bold">{currentTarget || target} (Destination)</div>
              </div>
            </>
          )}
        </div>
      </>
      )}

      {hops.length === 0 && !running && (
        <div className="card text-center py-16">
          <GitBranch size={40} className="mx-auto mb-4 text-[#1e2d5a]" />
          <p className="font-mono text-sm text-[#475569]">Enter a target and click Trace to map the network path</p>
          <p className="font-mono text-xs text-[#2d3a5a] mt-2">Uses real system traceroute — requires backend running</p>
        </div>
      )}
    </div>
  );
}
