import React from 'react';
import { Activity, Globe, GitBranch, Search, Clock, BookOpen, Wifi } from 'lucide-react';

const NAV = [
  { id: 'dashboard', icon: Activity, label: 'Dashboard' },
  { id: 'interfaces', icon: Wifi, label: 'Interfaces' },
  { id: 'ping', icon: Globe, label: 'Ping Test' },
  { id: 'traceroute', icon: GitBranch, label: 'Traceroute' },
  { id: 'dns', icon: Search, label: 'DNS Lookup' },
  { id: 'history', icon: Clock, label: 'History' },
];

export default function Sidebar({ active, onNavigate, onGlossary, isOnline }) {
  return (
    <aside className="w-16 lg:w-56 bg-[#0a0e1a] border-r border-[#1e2d5a] flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-[#1e2d5a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00d4ff11] border border-[#00d4ff33] flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#00d4ff]" style={{
              boxShadow: '0 0 8px #00d4ff, 0 0 16px #00d4ff66'
            }} />
          </div>
          <span className="hidden lg:block font-display text-sm font-bold text-[#e2e8f0] tracking-wider">
            NET<span className="text-[#00d4ff]">PULSE</span>
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b border-[#1e2d5a]">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-[#00ff88] glow-online' : 'bg-[#ff3366] glow-danger'}`} />
        <span className="text-xs font-mono text-[#475569]">
          {isOnline ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
              ${active === id
                ? 'bg-[#00d4ff11] text-[#00d4ff] border border-[#00d4ff22]'
                : 'text-[#475569] hover:text-[#94a3b8] hover:bg-[#ffffff05]'
              }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{label}</span>
            {active === id && (
              <div className="hidden lg:block ml-auto w-1 h-1 rounded-full bg-[#00d4ff]" />
            )}
          </button>
        ))}
      </nav>

      {/* Glossary button */}
      <div className="p-2 border-t border-[#1e2d5a]">
        <button
          onClick={onGlossary}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569]
            hover:text-[#94a3b8] hover:bg-[#ffffff05] transition-all duration-150"
        >
          <BookOpen size={16} className="shrink-0" />
          <span className="hidden lg:block text-sm font-medium">Glossary</span>
        </button>
      </div>
    </aside>
  );
}
