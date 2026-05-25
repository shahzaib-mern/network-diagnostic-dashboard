import React, { useState } from 'react';
import { Play, GitBranch, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchTraceroute } from '../utils/api';
import { Tooltip } from '../components/Tooltip';

function HopRow({ hop, index, total }) {
  const isTimeout = hop.timedOut || hop.ip === '*';
  const rttColor = hop.rtt === null ? '#475569'
    : hop.rtt < 20 ? '#00ff88'
    : hop.rtt < 100 ? '#ffaa00'
    : '#ff3366';

  return (
    <div className="hop-node" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Number */}
      <div className="w-7 h-7 rounded-lg bg-[#141c35] border border-[#1e2d5a] flex items-center justify-center shrink-0">
        <span className="font-mono text-xs text-[#475569]">{hop.num}</span>
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {isTimeout
          ? <AlertCircle size={14} className="text-[#ff336666]" />
          : <CheckCircle size={14} className="text-[#00ff8866]" />}
      </div>

      {/* IP / hostname */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm text-[#e2e8f0] truncate">
          {isTimeout ? <span className="text-[#475569]">* * * (Request Timeout)</span> : hop.ip}
        </div>
      </div>

      {/* RTT */}
      <div className="shrink-0 font-mono text-sm font-bold" style={{ color: rttColor }}>
        {hop.rtt !== null ? `${hop.rtt} ms` : <span className="text-[#475569]">—</span>}
      </div>

      {/* RTT bar */}
      {!isTimeout && hop.rtt !== null && (
        <div className="w-24 hidden md:block">
          <div className="h-1.5 bg-[#1e2d5a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((hop.rtt / 200) * 100, 100)}%`,
                background: rttColor
              }} />
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

  const startTrace = async () => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setError('');
    setHops([]);
    setDone(false);
    setRunning(true);

    try {
      const data = await fetchTraceroute(trimmed);
      const mapped = (data.hops || []).map((hop, index) => ({ ...hop, num: index + 1 }));
      setHops(mapped);
      setDone(true);
      onResult({ type: 'traceroute', target: trimmed, hops: mapped.length, time: Date.now() });
      if (mapped.length === 0) {
        setError('No hops detected. Check that traceroute is available on the backend host.');
      }
    } catch (err) {
      setError(err.message || 'Traceroute failed');
    } finally {
      setRunning(false);
    }
  };

  const totalRtt = hops.filter(h => !h.timedOut && h.rtt).reduce((s, h) => s + h.rtt, 0);
  const validHops = hops.filter(h => !h.timedOut);

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div>
        <h2 className="font-display text-xl font-bold text-[#e2e8f0]">
          <Tooltip term="Traceroute">Traceroute</Tooltip> Visualization
        </h2>
        <p className="text-[#475569] text-xs font-mono mt-1">
          Map the network path hop-by-hop to any destination
        </p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-mono text-[#475569] mb-1.5 block">Target Host / IP</label>
            <input
              className="input-field"
              placeholder="e.g., google.com or 1.1.1.1"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !running && startTrace()}
              disabled={running}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={startTrace} disabled={running || !target.trim()} className="btn-primary flex items-center gap-2">
              <Play size={14} /> Trace
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#ff336611] border border-[#ff336633] rounded-xl text-[#ff3366] text-sm font-mono">
          {error}
        </div>
      )}

      {/* Summary bar */}
      {hops.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#7c3aed]">{hops.length}</div>
            <div className="text-xs text-[#475569] font-mono">
              <Tooltip term="Hop">Total Hops</Tooltip>
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#00d4ff]">
              {validHops.length > 0 ? `${Math.round(totalRtt)} ms` : '—'}
            </div>
            <div className="text-xs text-[#475569] font-mono">
              <Tooltip term="RTT">Total RTT</Tooltip>
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-mono text-xl font-bold text-[#ff3366]">
              {hops.filter(h => h.timedOut).length}
            </div>
            <div className="text-xs text-[#475569] font-mono">Timeouts</div>
          </div>
        </div>
      )}

      {/* Hop visualization */}
      {hops.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title mb-0">
              Path: <span className="text-[#00d4ff]">{target}</span>
            </div>
            {running && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#00d4ff]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                Tracing...
              </div>
            )}
            {done && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#00ff88]">
                <CheckCircle size={12} />
                Complete
              </div>
            )}
          </div>

          {/* Source node */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00d4ff08] border border-[#00d4ff22] mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#00d4ff22] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
            </div>
            <div className="font-mono text-sm text-[#00d4ff] font-bold">Your Device (Source)</div>
          </div>

          {/* Hops */}
          <div className="space-y-1.5">
            {hops.map((hop, i) => (
              <React.Fragment key={i}>
                <div className="hop-connector ml-3.5" />
                <HopRow hop={hop} index={i} total={hops.length} />
              </React.Fragment>
            ))}
          </div>

          {/* Running indicator */}
          {running && (
            <div className="flex items-center gap-3 p-3 mt-1.5">
              <div className="hop-connector ml-3.5" />
              <div className="w-7 h-7 rounded-lg border border-[#1e2d5a] border-dashed flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1e2d5a] animate-pulse" />
              </div>
              <div className="font-mono text-xs text-[#475569] animate-pulse">Discovering next hop…</div>
            </div>
          )}

          {/* Destination node */}
          {done && hops.length > 0 && (
            <>
              <div className="hop-connector ml-3.5" />
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00ff8808] border border-[#00ff8822]">
                <div className="w-7 h-7 rounded-lg bg-[#00ff8822] flex items-center justify-center">
                  <GitBranch size={12} className="text-[#00ff88]" />
                </div>
                <div className="font-mono text-sm text-[#00ff88] font-bold">{target} (Destination)</div>
              </div>
            </>
          )}
        </div>
      )}

      {hops.length === 0 && !running && (
        <div className="card text-center py-16">
          <GitBranch size={40} className="mx-auto mb-4 text-[#1e2d5a]" />
          <p className="font-mono text-sm text-[#475569]">Enter a target and click Trace to map the network path</p>
          <p className="font-mono text-xs text-[#2d3a5a] mt-2">
            Note: traceroute requires the backend server to be running
          </p>
        </div>
      )}
    </div>
  );
}
