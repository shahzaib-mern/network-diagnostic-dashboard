# NetPulse — Web-Based Network Diagnostics Dashboard
### Group SE-08 | Final Year Project | Dept. of Software Engineering, University of Sargodha

A full-stack interactive network diagnostics dashboard built with **React + Vite** (frontend) and **Node.js + Express** (backend).

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Live connectivity status, interface overview, recent activity |
| **Network Interfaces** | Local IP, MAC, subnet, gateway, rx/tx bytes |
| **Ping Diagnostic** | Real-time RTT chart with min/max/avg/loss stats |
| **Traceroute** | Progressive hop-by-hop path visualization |
| **DNS Lookup** | A, AAAA, MX, CNAME, TXT, NS record resolution |
| **Session History** | In-memory log of all diagnostic operations |
| **Glossary** | Tooltip + panel explanations for all networking terms |

---

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- **npm 9+** (included with Node.js)
- OS: Windows / Linux / macOS

---

## Quick Start

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run backend (Terminal 1)

```bash
cd backend
npm start
# → Running on http://localhost:3001
```

### 3. Run frontend (Terminal 2)

```bash
cd frontend
npm run dev
# → Open http://localhost:5173
```

---

## One-Command Start (Linux / macOS)

```bash
chmod +x start.sh
./start.sh
```

---

## Project Structure

```
network-dashboard/
├── backend/
│   ├── server.js          # Express + WebSocket server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Root component + routing
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InterfacesPage.jsx
│   │   │   ├── PingPage.jsx
│   │   │   ├── TraceroutePage.jsx
│   │   │   ├── DnsPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Tooltip.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   └── utils/
│   │       └── api.js
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── start.sh               # One-command launcher
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express 4, ws (WebSocket) |
| System Info | systeminformation |
| Real-time | WebSockets (ping/traceroute streaming) |

---

## Notes

- **Ping & Traceroute** require the backend to execute OS commands. The app will show a warning banner if the backend is not reachable.
- On **Windows**, traceroute uses `tracert`. On **Linux/macOS**, it uses `traceroute` (install with `sudo apt install traceroute` if missing).
- All diagnostic history is **session-only** — it resets when you close the browser tab, by design.

---

## Supervisor
Sir Ahmad Mustafa

## Team
| Name | Roll No | Role |
|---|---|---|
| Shahzaib Ali | R031 | Leader |
| Peer Saeedullah | R048 | Member |
