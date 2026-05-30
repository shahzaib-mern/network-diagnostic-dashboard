import React from 'react';
import { BookOpen, Zap, Network, Globe, Route } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';

const glossaryCategories = [
  {
    title: 'Ping Diagnostics',
    icon: Zap,
    color: '#00d4ff',
    entries: [
      {
        term: 'Packets Sent',
        definition: 'Total number of echo request packets transmitted to the target. Each packet is 32 bytes by default.',
        example: 'If you set count to 20, this will show 20 packets sent.',
      },
      {
        term: 'Packets Received',
        definition: 'Number of echo reply packets successfully received from the target. Should equal packets sent if connection is stable.',
        example: 'Received: 20 out of 20 packets means 0% packet loss.',
      },
      {
        term: 'Packet Loss (%)',
        definition: 'Percentage of packets that failed to return from the target. Calculated as (Sent - Received) / Sent × 100. High loss indicates network issues.',
        example: '5 packets lost out of 20 = 25% packet loss',
      },
      {
        term: 'Min RTT (ms)',
        definition: 'Minimum Round Trip Time - the fastest response time from any packet. Shows best-case network latency.',
        example: 'Min RTT of 12 ms means at least one packet returned in 12 milliseconds.',
      },
      {
        term: 'Max RTT (ms)',
        definition: 'Maximum Round Trip Time - the slowest response time from any packet. Shows worst-case network latency.',
        example: 'Max RTT of 45 ms means one packet took 45 milliseconds to return.',
      },
      {
        term: 'Avg RTT (ms)',
        definition: 'Average Round Trip Time - mean of all successful response times. Best indicator of typical network latency.',
        example: 'Avg RTT of 25 ms is the average delay you experience.',
      },
      {
        term: 'RTT Chart',
        definition: 'Visual representation of each ping response time. Blue dots show successful replies, red dots show timeouts or failures.',
        example: 'A consistently flat line shows stable latency; spikes show temporary network issues.',
      },
    ],
  },
  {
    title: 'Traceroute Analysis',
    icon: Route,
    color: '#7c3aed',
    entries: [
      {
        term: 'Hop Number',
        definition: 'Sequential number shown at the left side of each traceroute row. It identifies the position of this node in the path to the target.',
        example: 'If the row shows 1, it is the first hop; 4 means the fourth router along the path.',
      },
      {
        term: 'Hop Row Structure',
        definition: 'Each traceroute row shows the hop number, response state, hop IP or timeout message, RTT value, and a latency bar. The bar visually represents response time relative to the path.',
        example: 'A row with hop 4, IP 8.8.8.8, and 67 ms shows the fourth hop responded in 67 ms.',
      },
      {
        term: 'Latency Bar',
        definition: 'A visual bar showing how long each hop took relative to the maximum expected latency. Longer bars mean slower responses.',
        example: 'If a hop shows 80% on the latency bar, it had a higher response time than earlier hops.',
      },
      {
        term: 'Path Flow',
        definition: 'A visual journey of packet travel, from your device through each hop to the destination. It shows the order and status of each router on the path.',
        example: 'Source → Hop 1 → Hop 2 → Destination helps you see the route at a glance.',
      },
      {
        term: 'IP Address',
        definition: 'Internet Protocol address of the router at this hop. Shows which devices your packets pass through.',
        example: '192.168.1.1 is typically your home router (Hop 1).',
      },
      {
        term: 'RTT (Round Trip Time)',
        definition: 'Time in milliseconds for a probe packet to reach this hop and return. Shows latency at each hop.',
        example: 'Hop 3 RTT of 35 ms means that hop adds ~35 ms to your total latency.',
      },
      {
        term: 'Timeout (✱)',
        definition: 'When a hop does not respond to the probe. Shown as * in the results. May indicate firewall filtering or high latency.',
        example: 'Some ISPs configure routers to not respond to traceroute probes.',
      },
      {
        term: 'Total Hops',
        definition: 'Total number of routers/devices in the complete path to your destination.',
        example: 'Reaching google.com might take 10-15 hops.',
      },
      {
        term: 'Total RTT',
        definition: 'Sum of all RTT values. Approximates total latency through all responding hops.',
        example: 'If 5 hops each have 20 ms RTT, total RTT ~100 ms.',
      },
      {
        term: 'Timeouts Count',
        definition: 'Number of hops that did not respond to probes. High count may indicate routing issues.',
        example: '2 timeouts out of 10 hops suggests 2 routers are not responding.',
      },
      {
        term: 'Path Visualization',
        definition: 'Shows the complete journey your packets take from your device to the destination, with latency colors.',
        example: 'Green < 20ms, Orange 20-100ms, Red > 100ms latencies.',
      },
    ],
  },
  {
    title: 'DNS Lookup',
    icon: Globe,
    color: '#00ff88',
    entries: [
      {
        term: 'A Record',
        definition: 'Address record - maps a domain name to an IPv4 address. Primary record type for web browsing.',
        example: 'google.com A record points to 142.250.175.46',
      },
      {
        term: 'AAAA Record',
        definition: 'IPv6 address record - maps a domain name to an IPv6 address. For next-gen internet addresses.',
        example: 'Not all domains have AAAA records; shows IPv6 support.',
      },
      {
        term: 'MX Record',
        definition: 'Mail Exchange record - specifies email servers for the domain. Priority indicates preference order.',
        example: 'Lower priority (e.g., 10) is tried first; higher priority (e.g., 20) is backup.',
      },
      {
        term: 'CNAME Record',
        definition: 'Canonical Name - creates an alias for another domain. One domain points to another domain.',
        example: 'www.example.com might CNAME to example.com',
      },
      {
        term: 'TXT Record',
        definition: 'Text record - contains text data. Used for SPF, DKIM, DMARC for email security.',
        example: 'SPF record lists authorized email servers to prevent spoofing.',
      },
      {
        term: 'NS Record',
        definition: 'Name Server record - indicates authoritative DNS servers for the domain.',
        example: 'Shows which DNS services manage this domain.',
      },
      {
        term: 'TTL (Time To Live)',
        definition: 'Seconds a DNS record can be cached. Lower TTL = more frequent updates; higher TTL = faster lookup but slower changes.',
        example: 'TTL 3600 = cache for 1 hour; changes take up to 1 hour to propagate.',
      },
      {
        term: 'Reverse Lookup',
        definition: 'Finds the domain name associated with an IP address. Opposite of forward DNS lookup.',
        example: 'Looking up IP 8.8.8.8 might return dns.google.',
      },
      {
        term: 'No Records Found',
        definition: 'The domain exists but has no records of the queried type(s), or domain does not exist.',
        example: 'A domain might have A records but no AAAA (IPv6) records.',
      },
    ],
  },
  {
    title: 'Network Interfaces',
    icon: Network,
    color: '#ffaa00',
    entries: [
      {
        term: 'Interface Name',
        definition: 'System identifier for network interface (e.g., eth0, wlan0). Usually eth = wired, wlan = wireless.',
        example: 'eth0 = first ethernet port; wlan0 = WiFi adapter',
      },
      {
        term: 'IPv4 Address',
        definition: 'Local IP address on this network. Used for communication within your network.',
        example: '192.168.1.100 is a typical home network IP.',
      },
      {
        term: 'IPv6 Address',
        definition: 'Next-generation IP address. Newer networks increasingly use this.',
        example: 'fe80::1 is a link-local IPv6 address.',
      },
      {
        term: 'MAC Address',
        definition: 'Media Access Control address - unique hardware identifier for the network interface.',
        example: '00:1a:2b:3c:4d:5e uniquely identifies this network card.',
      },
      {
        term: 'Bytes Sent',
        definition: 'Total data transmitted from this interface since boot or last reset.',
        example: 'Measured in bytes; 1 GB = 1,073,741,824 bytes.',
      },
      {
        term: 'Bytes Received',
        definition: 'Total data received on this interface since boot or last reset.',
        example: 'Sum of all downloads and network traffic.',
      },
      {
        term: 'Interface Status',
        definition: 'Current state of the interface: up (active), down (inactive), unknown.',
        example: 'Disconnected ethernet shows "down"; active WiFi shows "up".',
      },
      {
        term: 'Speed',
        definition: 'Maximum theoretical speed of the interface in Mbps. Not current speed, but capability.',
        example: 'Ethernet might show 1000 Mbps; WiFi shows 54-866 Mbps.',
      },
    ],
  },
  {
    title: 'Dashboard & General',
    icon: BookOpen,
    color: '#ff3366',
    entries: [
      {
        term: 'Backend Status',
        definition: 'Indicates if the network testing backend server is running. Green = connected, Red = not available.',
        example: 'If red, backend might be offline or unreachable.',
      },
      {
        term: 'Online Status',
        definition: 'Your internet connection status. Green = internet available, Red = offline.',
        example: 'Based on your browser ability to reach external servers.',
      },
      {
        term: 'Latency',
        definition: 'Time delay for data to travel from source to destination and back. Measured in milliseconds (ms).',
        example: '30 ms latency = good for gaming; 150+ ms = noticeable delay.',
      },
      {
        term: 'Bandwidth',
        definition: 'Rate of data transfer. Can mean speed capability or actual current transfer rate.',
        example: '100 Mbps = can transfer 100 megabits per second.',
      },
      {
        term: 'ICMP',
        definition: 'Internet Control Message Protocol - used by Ping and Traceroute to probe network connectivity.',
        example: 'Some firewalls block ICMP, causing Ping to fail.',
      },
      {
        term: 'Target Host',
        definition: 'The destination you are testing - can be domain name or IP address.',
        example: 'google.com, 8.8.8.8, or your.server.com',
      },
      {
        term: 'Timeout',
        definition: 'When a response is not received within a specific time limit (usually 2-3 seconds).',
        example: 'Shows as red dot in Ping or * in Traceroute.',
      },
      {
        term: 'Firewall/Filtering',
        definition: 'Security device/rule blocking or delaying network traffic. Can cause timeouts or high latency.',
        example: 'Corporate firewall may block Ping or DNS lookups.',
      },
    ],
  },
];

export default function GlossaryPage() {
  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#e2e8f0]">Network Diagnostics Glossary</h1>
        <p className="text-[#475569] text-sm font-mono mt-2">
          Complete guide to understanding all metrics, terms, and values in NetPulse. Learn what each result means and how to interpret network diagnostics.
        </p>
      </div>

      {glossaryCategories.map((category) => {
        const IconComponent = category.icon;
        return (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: `${category.color}11` }}>
                <IconComponent size={24} style={{ color: category.color }} />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#e2e8f0]">{category.title}</h2>
            </div>

            <div className="grid gap-4">
              {category.entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="card border-l-4 transition-all hover:shadow-lg"
                  style={{ borderLeftColor: category.color }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-bold text-[#e2e8f0] text-lg">{entry.term}</h3>
                    <span className="px-2 py-1 text-xs font-mono rounded bg-[#1e2d5a] text-[#00d4ff]">
                      {category.title.split(' ')[0]}
                    </span>
                  </div>

                  <p className="text-[#94a3b8] text-sm mb-3">{entry.definition}</p>

                  <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1e2d5a]">
                    <div className="text-xs text-[#475569] font-mono mb-1">Example:</div>
                    <div className="text-sm font-mono text-[#00d4ff]">{entry.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="card border-t-2 border-[#1e2d5a] pt-6">
        <h3 className="font-bold text-[#e2e8f0] mb-3">Need More Help?</h3>
        <div className="space-y-2 text-sm text-[#94a3b8]">
          <p>
            <strong>High Packet Loss?</strong> Check your network connection, move closer to WiFi router, or test with a wired connection.
          </p>
          <p>
            <strong>High Latency?</strong> Indicates network congestion. Try testing at off-peak hours or contact your ISP.
          </p>
          <p>
            <strong>Traceroute shows timeouts?</strong> Firewalls may be filtering ICMP. This is normal; not all routers respond.
          </p>
          <p>
            <strong>DNS showing no records?</strong> Domain may not exist, or your DNS servers aren't configured properly. Try different nameservers.
          </p>
          <p>
            <strong>Backend not running?</strong> Start the backend server to enable Ping and Traceroute tests.
          </p>
        </div>
      </div>
    </div>
  );
}
