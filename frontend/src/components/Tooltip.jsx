import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const GLOSSARY = {
  IP: { title: 'IP Address', def: 'A unique numerical label assigned to each device on a network. Like a postal address for your computer.', example: 'e.g., 192.168.1.1' },
  RTT: { title: 'Round-Trip Time (RTT)', def: 'The time it takes for a packet to travel from your device to a destination and back. Lower is better.', example: 'e.g., 12 ms means very fast' },
  TTL: { title: 'Time to Live (TTL)', def: 'A counter in every IP packet. Each router decrements it by 1. When it hits 0, the packet is discarded — used by traceroute to discover hops.', example: 'e.g., TTL=64 is Linux default' },
  DNS: { title: 'Domain Name System', def: 'Translates human-readable domain names into IP addresses. Like a phonebook for the internet.', example: 'google.com → 142.250.80.46' },
  Hop: { title: 'Hop', def: 'Each intermediate router or gateway a packet passes through on its way to a destination. More hops = more potential for delay.', example: 'Home → ISP → CDN → Server' },
  Ping: { title: 'Ping', def: 'A utility that sends ICMP Echo Request packets to test if a host is reachable and measure how long it takes to get a reply.', example: 'ping google.com' },
  Gateway: { title: 'Default Gateway', def: 'The router that handles traffic leaving your local network. Usually your home router\'s IP address.', example: 'e.g., 192.168.1.1' },
  Subnet: { title: 'Subnet Mask', def: 'Defines which portion of an IP address is the network part vs. the device part. It determines your local network range.', example: '255.255.255.0 = /24 network' },
  MAC: { title: 'MAC Address', def: 'A unique hardware identifier burned into your network interface card. Unlike an IP address, it does not change.', example: 'e.g., A1:B2:C3:D4:E5:F6' },
  Traceroute: { title: 'Traceroute', def: 'Discovers the path packets take across a network by sending probes with incrementally increasing TTL values to reveal each hop.', example: 'Shows router IPs between you and a server' },
  ICMP: { title: 'ICMP', def: 'Internet Control Message Protocol — used for diagnostic and error reporting. Ping and Traceroute both rely on ICMP.', example: 'Echo Request / Echo Reply' },
  PacketLoss: { title: 'Packet Loss', def: 'Percentage of packets that never reach their destination. Any packet loss above 1–2% indicates a network problem.', example: '0% = perfect, 100% = unreachable' },
};

export function Tooltip({ term, children }) {
  const [visible, setVisible] = useState(false);
  const info = GLOSSARY[term];
  if (!info) return <>{children}</>;

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <HelpCircle size={11} className="text-[#475569]" />
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3
          bg-[#141c35] border border-[#00d4ff33] rounded-xl text-left
          shadow-xl z-50 animate-fadeIn pointer-events-none">
          <div className="text-[#00d4ff] font-semibold text-xs mb-1">{info.title}</div>
          <div className="text-[#94a3b8] text-xs leading-relaxed mb-1">{info.def}</div>
          {info.example && (
            <div className="text-[#475569] text-xs font-mono">{info.example}</div>
          )}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2
            bg-[#141c35] border-b border-r border-[#00d4ff33] rotate-45" />
        </span>
      )}
    </span>
  );
}

export function GlossaryPanel({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1628] border border-[#1e2d5a] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 animate-slideUp"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg text-[#00d4ff]">Network Glossary</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>
        <div className="space-y-4">
          {Object.entries(GLOSSARY).map(([key, info]) => (
            <div key={key} className="p-3 bg-[#0a0e1a] rounded-xl border border-[#1e2d5a]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs text-[#00d4ff] font-semibold bg-[#00d4ff11] px-2 py-0.5 rounded">{key}</span>
                <span className="text-sm text-[#e2e8f0] font-medium">{info.title}</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{info.def}</p>
              {info.example && <p className="text-xs text-[#475569] font-mono mt-1">{info.example}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
