import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, RotateCcw, Wifi } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';
import { Tooltip } from '../components/Tooltip';

const CustomDot = ({ cx, cy, payload }) => {
  if (!payload?.success) return <circle cx={cx} cy={cy} r={4} fill="#ff3366" />;
  return <circle cx={cx} cy={cy} r={3} fill="#00d4ff" stroke="#0a0e1a" strokeWidth={1.5} />;
};

const CustomTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#141c35] border border-[#1e2d5a] rounded-xl p-3 text-xs font-mono shadow-xl">
      <div className="text-[#475569] mb-1">Packet #{d.seq}</div>
      {d.success
        ? <div className="text-[#00d4ff] font-bold">{d.rtt} ms</div>
        : <div className="text-[#ff3366] font-bold">Timeout</div>}
    </div>
  );
};

export default function PingPage({ onResult }) {
  const [target, setTarget] = useState('');
  const [count, setCount] = useState(20);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingResult, setPendingResult] = useState(null);
  const expectedCount = useRef(20);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'ping_start':
        break;
      case 'ping_result':
        setResults(rs => [...rs, { seq: msg.seq, rtt: msg.rtt, success: msg.success, timestamp: msg.timestamp }]);
        break;
      case 'ping_done':
        setRunning(false);
        setStatus('done');
        setResults(rs => {
          const rtts = rs.filter(r => r.success && r.rtt !== null).map(r => r.rtt);
          setSummary({
            sent: rs.length,
            received: rtts.length,
            loss: rs.length ? Math.round(((rs.length - rtts.length) / rs.length) * 100) : 0,
            min: rtts.length ? Math.min(...rtts) : null,
            max: rtts.length ? Math.max(...rtts) : null,
            avg: rtts.length ? parseFloat((rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(2)) : null,
          });
          const avgRtt = rtts.length ? parseFloat((rtts.reduce((a,b)=>a+b,0)/rtts.length).toFixed(2)) : null;
          const loss = rs.length ? Math.round(((rs.length - rtts.length) / rs.length) * 100) : 0;
          setPendingResult({ type: 'ping', target: target.trim(), avgRtt, loss, time: Date.now() });
          return rs;
        });
        break;
      case 'stopped':
        setRunning(false);
        setStatus('idle');
        break;
      case 'error':
        setErrorMsg(msg.message);
        setRunning(false);
        setStatus('error');
        break;
    }
  }, [target]);

  // Defer the onResult callback to avoid setState during render warning
  useEffect(() => {
    if (pendingResult) {
      onResult?.(pendingResult);
      setPendingResult(null);
    }
  }, [pendingResult, onResult]);

  const { send, stop } = useWebSocket(handleMessage);

  const startPing = () => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setErrorMsg(''); setResults([]); setSummary(null); setStatus('running'); setRunning(true);
    expectedCount.current = count;
    send({ type: 'ping', target: trimmed, count, interval: 1000 });
  };

  const stopPing = () => { stop(); setRunning(false); setStatus('stopped'); };

  const reset = () => { setResults([]); setSummary(null); setStatus('idle'); setErrorMsg(''); };

  const validRtts = results.filter(r => r.success && r.rtt !== null);
  const avgRtt = validRtts.length
    ? Math.round(validRtts.reduce((a, b) => a + b.rtt, 0) / validRtts.length) : null;

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div>
        <h2 className="font-display text-xl font-bold text-[#e2e8f0]">
          <Tooltip term="Ping">Ping</Tooltip> Diagnostic
        </h2>
        <p className="text-[#475569] text-xs font-mono mt-1">Send ICMP packets and visualize round-trip times in real time</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-mono text-[#475569] mb-1.5 block">Target Host / IP</label>
            <input className="input-field" placeholder="e.g., google.com or 8.8.8.8"
              value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !running && startPing()}
              disabled={running} />
          </div>
          <div className="w-28">
            <label className="text-xs font-mono text-[#475569] mb-1.5 block">Packets</label>
            <input type="number" min={1} max={50} className="input-field" value={count}
              onChange={e => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
              disabled={running} />
          </div>
          <div className="flex gap-2">
            {!running
              ? <button onClick={startPing} disabled={!target.trim()} className="btn-primary flex items-center gap-2">
                  <Play size={14} /> Start
                </button>
              : <button onClick={stopPing} className="btn-danger flex items-center gap-2">
                  <Square size={14} /> Stop
                </button>}
            <button onClick={reset} disabled={running} className="btn-ghost flex items-center gap-2">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        {running && results.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono text-[#475569] mb-1">
              <span>Progress</span><span>{results.length} / {count}</span>
            </div>
            <div className="h-1 bg-[#1e2d5a] rounded-full overflow-hidden">
              <div className="h-full bg-[#00d4ff] rounded-full transition-all duration-300"
                style={{ width: `${(results.length / count) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Avg RTT', value: avgRtt !== null ? `${avgRtt} ms` : '—', color: '#00d4ff', tooltip: 'RTT' },
            { label: 'Min RTT', value: validRtts.length ? `${Math.min(...validRtts.map(r=>r.rtt))} ms` : '—', color: '#00ff88' },
            { label: 'Max RTT', value: validRtts.length ? `${Math.max(...validRtts.map(r=>r.rtt))} ms` : '—', color: '#ffaa00' },
            { label: 'Packet Loss', tooltip: 'PacketLoss',
              value: results.length > 0 ? `${Math.round((results.filter(r=>!r.success).length / results.length)*100)}%` : '0%',
              color: results.filter(r=>!r.success).length > 0 ? '#ff3366' : '#00ff88' },
          ].map((s, i) => (
            <div key={i} className="card p-3">
              <div className="text-xs font-mono text-[#475569] mb-1">
                {s.tooltip ? <Tooltip term={s.tooltip}>{s.label}</Tooltip> : s.label}
              </div>
              <div className="font-mono text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <div className="section-title">RTT over time</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={results} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d5a" />
              <XAxis dataKey="seq" tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                label={{ value: 'Packet #', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} />
              <RechartsTip content={<CustomTooltipContent />} />
              {avgRtt && (
                <ReferenceLine y={avgRtt} stroke="#00d4ff33" strokeDasharray="4 4"
                  label={{ value: `avg ${avgRtt}ms`, fill: '#00d4ff66', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              )}
              <Line type="monotone" dataKey="rtt" stroke="#00d4ff" strokeWidth={2}
                dot={<CustomDot />} activeDot={{ r: 5, fill: '#00d4ff', stroke: '#0a0e1a' }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {summary && status === 'done' && (
        <div className="card border-[#00ff8822] animate-slideUp">
          <div className="section-title text-[#00ff88]">Ping Summary</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono font-bold text-[#00ff88]">{summary.received}</div>
              <div className="text-xs text-[#475569] font-mono">Received</div>
            </div>
            <div>
              <div className={`text-2xl font-mono font-bold ${summary.loss > 0 ? 'text-[#ff3366]' : 'text-[#475569]'}`}>
                {summary.loss}%
              </div>
              <div className="text-xs text-[#475569] font-mono">Packet Loss</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#00d4ff]">
                {summary.avg !== null ? `${summary.avg}ms` : '—'}
              </div>
              <div className="text-xs text-[#475569] font-mono">Avg RTT</div>
            </div>
          </div>
          {summary.loss === 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#00ff88] font-mono">
              <Wifi size={12} /> Host fully reachable with no packet loss
            </div>
          )}
          {summary.loss === 100 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#ff3366] font-mono">
              ✕ Host unreachable — check the address or network connectivity
            </div>
          )}
        </div>
      )}

      {results.length === 0 && status === 'idle' && (
        <div className="card text-center py-16 text-[#1e2d5a]">
          <Wifi size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-mono text-sm text-[#475569]">Enter a target and click Start to begin</p>
        </div>
      )}
    </div>
  );
}
