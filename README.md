# NetPulse — Network Diagnostics Dashboard

A modern full-stack network diagnostics dashboard with live WebSocket ping and traceroute, DNS record inspection, interface discovery, and session history.

## Quick Start

```bash
npm install
npm run dev
```

This installs backend and frontend dependencies, then starts the backend on port `3001` and the frontend on port `5173` using `concurrently`.

Open: http://localhost:5173

## Project Structure

```
network-dashboard/
├── package.json          # Root scripts and dev dependency for concurrent startup
├── backend/
│   ├── package.json      # Express + ws server dependencies
│   └── server.js         # Backend API, DNS lookup, ping/traceroute, WebSocket server
└── frontend/
    ├── package.json      # React, Vite, Recharts, Tailwind
    ├── src/
    │   ├── App.jsx       # Main app routing and history store
    │   ├── hooks/        # useWebSocket, useLocalStorage
    │   ├── pages/        # Dashboard, Interfaces, Ping, Traceroute, DNS, History, Glossary
    │   ├── components/   # Sidebar, Tooltip, Glossary panel
    │   └── utils/        # api.js, getPublicIP.js
    ├── vite.config.js
    └── tailwind.config.js
```

## Features

- Live backend health and connectivity status
- Local network interface discovery
- Real-time ping diagnostics via WebSocket
- Hop-by-hop traceroute path visualization
- DNS lookup for A, AAAA, MX, CNAME, TXT, NS records
- History of recent actions stored in browser localStorage
- Glossary with networking term explanations

## How It Works

### Backend

- Built with `Express` and `ws`.
- Uses `systeminformation` to gather real network interfaces and traffic stats.
- Implements a `/api/dns` POST route for DNS lookups.
- Maintains a persistent WebSocket server for `ping` and `traceroute` operations.
- Runs system `ping` and `traceroute` (or `tracert` on Windows) as subprocesses.
- Parses command output into JSON events and sends them back to the client in real time.

### Frontend

- Built with `React`, `Vite`, `Tailwind CSS`, `Recharts`, and `lucide-react`.
- Uses a shared `useWebSocket` hook for a persistent socket connection.
- Each diagnostics page sends a request message to the backend and listens for live updates.
- History is stored in browser `localStorage` and is reused across pages.

## Page Workflows

### Dashboard

- Shows backend health from `/api/health`.
- Uses browser online/offline events and backend health polling.
- Displays key information like public IP, connectivity, and session actions.

### Interfaces

- Calls `/api/interfaces` to gather local network adapters.
- Uses `systeminformation.networkInterfaces()` and `networkStats()`.
- Displays interface name, IPv4/IPv6, MAC, subnet, speed, and traffic counters.

### Ping

- User enters a target host or IP and packet count.
- Frontend sends `{ type: 'ping', target, count, interval }` via WebSocket.
- Backend spawns system `ping`, parses RTT from stdout, and emits `ping_result` for each packet.
- The UI renders live progress, a line chart of RTT values, packet loss, and summary statistics.
- Stop button sends `{ type: 'stop' }` to cancel the active ping stream.

### Traceroute

- User enters a target and starts traceroute.
- Frontend sends `{ type: 'traceroute', target }` over WebSocket.
- Backend runs system `traceroute` or `tracert`, streaming each hop line as `traceroute_hop`.
- The UI builds a hop-by-hop path view, with labels for status, latency, and timeout.
- A flow preview panel visualizes the route from source to destination.

### DNS Lookup

- User enters a domain or IP and clicks Lookup.
- Frontend POSTs to `/api/dns` with `{ target }`.
- Backend attempts `dns.resolve*` for A, AAAA, MX, CNAME, TXT, NS.
- If the local resolver fails, it retries using public resolvers `1.1.1.1` and `8.8.8.8`.
- Results and reverse lookup data are returned and grouped by record type.

### History

- Shows recent ping, traceroute, and DNS lookup operations.
- Stored in localStorage via `useLocalStorage`.
- Allows quick navigation back to any diagnostic page.

## Backend Details

- `sanitize(input)` limits target strings to safe host characters.
- `/api/dns` uses `dns.promises` and fallback resolvers.
- WebSocket messages:
  - `ping_start`, `ping_result`, `ping_done`
  - `traceroute_start`, `traceroute_hop`, `traceroute_done`
  - `stopped`, `error`
- Ping and traceroute logic handles platform differences between Windows and Unix.

## Frontend Details

- `useWebSocket` maintains a single shared WebSocket connection.
- Event handlers are added to a global handler set so multiple pages can listen.
- `api.js` provides REST helpers and `getWsUrl()` for environment-aware WebSocket URLs.
- Pages use `onResult` callbacks to add operations into history.

## Run Commands

- `npm run dev` — install dependencies and start backend + frontend
- `npm run dev:backend` — backend only
- `npm run dev:frontend` — frontend only
- `npm run build --prefix frontend` — build production frontend
- `npm start --prefix backend` — start backend only

## Notes for Viva

- The system is designed for live, interactive diagnostics.
- Ping/traceroute are streamed via WebSocket to preserve real-time progress.
- DNS lookup is REST-based because it is a single request/response workflow.
- The architecture separates concerns cleanly: backend handles OS-level networking and system commands, while frontend handles visualization and user interaction.
- The new `.docx` file contains a complete architecture and workflow narrative for viva preparation.
