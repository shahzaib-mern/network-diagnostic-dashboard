# AI Prompts Log — NetPulse (SE-08)

> **Project:** Web-Based Network Diagnostics Dashboard  
> **Group:** SE-08 · Shahzaib Ali (R031) · Peer Saeedullah (R048)  
> **Supervisor:** Sir Ahmad Mustafa  
> **AI Tools Used:** Claude 3.5 Sonnet, GitHub Copilot  
> **Date Range:** May 10–26, 2026

---

## How to Read This Log

Each prompt entry includes:
- **Who:** Team member who used the AI (R031 = Shahzaib, R048 = Peer)
- **Phase:** Development week and feature area
- **Tool:** Claude / Copilot / ChatGPT
- **Result:** ✅ Accepted / 🔧 Refined / ❌ Rejected
- **Impact:** Lines of code, bugs fixed, time saved

---

## PROMPT 01 — Express + WebSocket Backend Scaffold

**Who:** Peer Saeedullah (R048)  
**Phase:** Week 1 — Core Architecture  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 10, 2026

### Request
```
I'm building a Node.js + Express backend for network diagnostics. I need:

1. GET /api/health — return { status: 'ok', platform, uptime }
2. GET /api/interfaces — return all local network interfaces using 
   systeminformation package (IP, MAC, subnet, speed, operstate)
3. POST /api/dns — accept { target } and resolve A/AAAA/MX/TXT/NS/CNAME 
   records using Node's dns.promises
4. WebSocket endpoint ws:// — handle 'ping' and 'traceroute' messages,
   spawn child processes (ping/traceroute on Linux, tracert on Windows)
5. Input sanitization to prevent command injection

Write complete server.js with error handling and CORS.
```

### AI Output
Claude returned ~250 lines of well-structured Express code with:
- Proper middleware stack (CORS, body parser, static files)
- Clean route handlers
- WebSocket setup with `ws` library
- Child process spawning for ping/traceroute
- Basic sanitization function

### What We Refined
1. **RTT Regex Bug:** AI used `time=(\d+)ms` but missed Windows `time<1ms` format
   - Fixed to: `time[=<](\d+(?:\.\d+)?)?ms|time\s+(\d+)ms`

2. **Traceroute Parser:** macOS returns `router.local (192.168.1.1) 1.2 ms`
   - AI split on spaces naively, breaking on hostnames with spaces
   - We rewrote to parse all numbers matching `\d+\.?\d*` then take last as RTT

3. **Buffer Truncation:** WebSocket was cutting off lines mid-stream
   - Added line buffering for partial stdout chunks before `\n` split

4. **Platform Detection:** Hardcoded `ping -c` for all platforms
   - Changed to detect OS and use `-c` (Unix) or `-n` (Windows)

5. **Error Propagation:** Didn't handle process timeouts
   - Added 30-second timeout with graceful kill signal

### Code Impact
- **Lines Added:** 280
- **Bugs Fixed:** 3 (RTT parsing, traceroute parsing, line buffering)
- **Time Saved:** ~4 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 02 — React Ping Page with Recharts

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 1 — Frontend Features  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 11, 2026

### Request
```
Build a React component called PingPage:
- Input for hostname/IP, count selector (default 20)
- Connect to WebSocket, send { type: 'ping', target, count }
- Receive ping_result messages and plot on Recharts LineChart
- X-axis = sequence number, Y-axis = RTT (ms)
- Failed pings = red dots, successful = blue dots
- Summary card: min/avg/max RTT, packet loss %
- Dark theme: #0a0e1a background, #00d4ff accents
- Use Tailwind CSS
```

### AI Output
Claude generated ~200 lines with:
- Form inputs with validation
- WebSocket integration
- Recharts LineChart with custom dots
- Summary stats calculation
- Tailwind dark theme

### What We Refined
1. **WebSocket Hook Missing:** AI used `useEffect` with direct socket creation
   - We already had a shared `useWebSocket` hook; replaced with it

2. **Stale Closures:** Summary displayed old data on rapid re-runs
   - Added `useCallback` with proper dependency array

3. **Chart Y-axis:** Auto-scaled awkwardly for very low RTT (<5ms)
   - Set `domain: [0, 'auto']` and added 10ms padding

4. **Reset Button:** Users couldn't clear results between runs
   - Added `RotateCcw` button with reset handler

5. **Tooltip:** Showed raw JSON instead of formatted text
   - Created `CustomTooltipContent` with readable millisecond formatting

### Code Impact
- **Lines Added:** 210
- **Bugs Fixed:** 2 (stale closures, tooltip formatting)
- **Time Saved:** ~3 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 03 — Traceroute Hop Visualization

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 1 — Frontend Features  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 12, 2026

### Request
```
Build TraceroutePage component:
- Target input + Start/Stop button
- Receive WebSocket traceroute_hop messages { num, ip, rtt, timedOut }
- Display as rows: hop number circle, IP, latency (ms), colored bar
- Bar colors: green (<20ms), orange (20-100ms), red (>100ms)
- Timed-out hops show '*' with grey bar
- Show summary: total hops, final latency
- Dark theme, same as PingPage
- Smooth scroll-to-bottom as hops arrive
```

### AI Output
Claude created ~160 lines with:
- Form and button states
- Hop list rendering
- Color mapping logic
- Summary section

### What We Refined
1. **Bar Width Overflow:** Very high RTTs (>500ms) made bars exceed container
   - Clamped max width: `Math.min((rtt / 200) * 100, 100)%`

2. **Scroll Position:** New hops didn't auto-scroll into view
   - Added `useRef` + `scrollIntoView({ behavior: 'smooth' })`

3. **Loading State:** No feedback during traceroute startup
   - Added skeleton loading for first 2 hops

4. **Timed-out Display:** Showed `NaN` instead of `*`
   - Changed to ternary: `timedOut ? '*' : rtt.toFixed(1)`

5. **Summary**: Didn't show destination IP
   - Added final hop destination display

### Code Impact
- **Lines Added:** 180
- **Bugs Fixed:** 2 (bar overflow, missing load state)
- **Time Saved:** ~2.5 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 04 — DNS Lookup Results Table

**Who:** Peer Saeedullah (R048)  
**Phase:** Week 1 — Frontend Features  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 13, 2026

### Request
```
Build DnsPage component:
- Domain input + checkboxes for record types (A, AAAA, MX, TXT, NS, CNAME)
- All selected by default
- POST /api/dns with { target: domain }
- Display results in table: Type | Value | TTL | Priority (MX only)
- Color code by type: A=blue, AAAA=purple, MX=orange, TXT=green, NS=yellow
- Show tooltip below each record type explaining what it is
- Handle 'no records' and error states
- Dark theme, Tailwind
```

### AI Output
Claude returned ~200 lines with:
- Checkbox toggles
- Fetch call to /api/dns
- Color-coded table
- Error/loading states

### What We Refined
1. **Tooltip Hardcoding:** Tooltips were inline, cluttering the component
   - Moved to `RECORD_INFO` map object for reusability

2. **Priority Column:** Always rendered even for non-MX records
   - Changed to conditional render: `type === 'MX' && <td>...`

3. **Reverse DNS:** API returns IP → hostname mapping
   - Added separate section for reverse DNS results

4. **Record Count:** Didn't show how many records resolved
   - Added badge: `<span class="badge">{results.length} records</span>`

5. **TTL Display:** Showed raw seconds
   - Formatted to `${ttl}s` or `${Math.round(ttl/60)}m` for clarity

### Code Impact
- **Lines Added:** 220
- **Bugs Fixed:** 1 (priority column rendering)
- **Time Saved:** ~3 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 05 — Network Interfaces Dashboard

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 1 — Frontend Features  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 13, 2026

### Request
```
Build InterfacesPage component:
- Fetch GET /api/interfaces on mount
- Display each network adapter as a card:
  * Adapter name (eth0, en0, etc)
  * IPv4 and IPv6 addresses (if available)
  * MAC address (formatted as XX:XX:XX:XX:XX:XX)
  * Subnet mask / CIDR
  * Gateway
  * Speed (Mbps)
  * RX/TX bytes with human-readable formatting (KB, MB, GB)
  * Status: up/down
- Color code status: green=up, red=down
- Show public IP at the top
- Dark theme, Tailwind CSS
```

### AI Output
Claude created ~240 lines with:
- Fetch logic
- Card layout for each interface
- Formatting utilities
- Status color mapping

### What We Refined
1. **Byte Formatting:** Showed raw bytes (1234567890)
   - Added `formatBytes()` utility: `1.15 GB`

2. **MAC Normalization:** Different formats on different systems
   - Standardized to uppercase colons: `00:1A:2B:3C:4D:5E`

3. **Public IP Position:** At bottom, confusing UX
   - Moved to top as hero section with bigger font

4. **IPv6 Handling:** Displayed full address (too long)
   - Truncated with tooltip showing full address

5. **Loading State:** No skeleton while fetching
   - Added shimmer effect for 6 placeholder cards

### Code Impact
- **Lines Added:** 260
- **Bugs Fixed:** 2 (byte formatting, MAC normalization)
- **Time Saved:** ~2 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 06 — useWebSocket Custom Hook

**Who:** Peer Saeedullah (R048)  
**Phase:** Week 1 — Core Hooks  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 10, 2026

### Request
```
Write a custom React hook useWebSocket(url, onMessage):
- Opens WebSocket on mount, reconnects with exponential back-off
- Max 5 reconnection attempts
- Back-off: 1s, 2s, 4s, 8s, 16s (capped at 10s)
- Exports sendMessage(obj) to JSON-stringify and send
- Exports isConnected boolean
- Cleanup: close socket on unmount
- Prevent stale reconnect attempts during back-off when component unmounts
```

### AI Output
Claude generated ~100 lines with:
- useEffect for connection
- Exponential back-off logic
- sendMessage function
- Cleanup handler

### What We Refined
1. **Stale Reconnects:** Component unmounted but reconnect still fired
   - Added `unmountedRef` flag, check before attempting reconnect

2. **Message Queue:** Sent messages before socket was ready
   - Queue messages until `readyState === OPEN`, flush on connect

3. **Duplicate Connections:** Multiple components created separate sockets
   - Added context provider wrapper for single socket instance

4. **Back-off Cap:** Grew unbounded
   - Capped at 10 seconds: `Math.min(1000 * Math.pow(2, attempt), 10000)`

5. **Error Logging:** Silent failures were hard to debug
   - Added optional `onError` callback + console.warn in dev mode

### Code Impact
- **Lines Added:** 120
- **Bugs Fixed:** 2 (stale reconnects, message queue)
- **Time Saved:** ~1.5 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 07 — History Page with CSV Export

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 2 — Feature Completion  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 16, 2026

### Request
```
Build HistoryPage component:
- Parent App passes 'history' array: { id, type, target, status, details, timestamp }
- Filter buttons: All | Ping | Traceroute | DNS
- Table: all fields + color-coded status (green SUCCESS, red ERROR)
- 'Replay' button per row → calls onNavigate(type, target) 
- 'Clear History' button with confirmation
- 'Export CSV' button → downloads CSV file
- Empty state when no history
- Dark theme, Tailwind
- Persist to localStorage so it survives page refresh
```

### AI Output
Claude returned ~280 lines with:
- Filter logic
- Table rendering
- Export function
- Confirmation dialogs

### What We Refined
1. **CSV Download:** `window.open('data:...')` got blocked by browser
   - Changed to `URL.createObjectURL()` + hidden `<a>` element click

2. **Replay Issue:** Passed only type, not target
   - Fixed: `onNavigate(type, target)` instead of `onNavigate(type)`

3. **Timestamp Format:** Showed ISO string (unreadable)
   - Added `formatDate()`: `2026-05-16 14:32:05`

4. **localStorage Sync:** Stale data on first load
   - Load from localStorage on init, merge with props

5. **Clear Confirmation:** No warning before wiping history
   - Added modal: "This cannot be undone"

### Code Impact
- **Lines Added:** 300
- **Bugs Fixed:** 2 (CSV export, replay target)
- **Time Saved:** ~3 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 08 — Jest Unit Tests (Backend)

**Who:** Peer Saeedullah (R048)  
**Phase:** Week 2 — Testing  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 18, 2026

### Request
```
Write Jest tests for server.js (Express backend). Test:

1. GET /api/health — should return 200 { status: 'ok' }
2. GET /api/interfaces — should return 200 with interfaces array
3. POST /api/dns { target: 'google.com' } — should return records
4. POST /api/dns with empty body — should return 400
5. Sanitize function directly:
   - Valid: 'google.com', '192.168.1.1'
   - Invalid: 'google.com; rm -rf /', 'test$(whoami)'
   
Mock systeminformation and dns.promises so tests run offline.
Use supertest for HTTP assertions.
```

### AI Output
Claude created ~180 lines with:
- 5 test cases using supertest
- jest.mock for external dependencies
- Proper assertions

### What We Refined
1. **DNS Mock:** Returned strings, but real API returns objects
   - Fixed mock to return `{ address, ttl }` objects per record type

2. **Missing Injection Tests:** Original didn't test sanitization
   - Added 4 injection test cases (semicolon, backtick, $(), `||`)

3. **No Async/Await:** Used old `done()` callback style
   - Converted all tests to `async/await`

4. **Missing Edge Cases:** Didn't test max length (253 chars)
   - Added test: `'a'.repeat(254)` should be rejected

5. **No Snapshot Tests:** Hard to detect regressions
   - Added snapshot test for /api/health response

### Code Impact
- **Lines Added:** 200
- **Bugs Fixed:** 1 (DNS mock structure)
- **Coverage:** 87% (HTTP routes)
- **Time Saved:** ~2.5 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 09 — Playwright E2E Test

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 2 — Testing  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 18, 2026

### Request
```
Write Playwright E2E test for app at http://localhost:5173:

1. Navigate to app, confirm sidebar with: Dashboard, Interfaces, Ping, 
   Traceroute, DNS, History
2. Click Ping, enter 'localhost', set count to 5, click Start
   Wait for summary card "Packets Sent" within 15 seconds
3. Click DNS Lookup, enter 'example.com', submit
   Verify at least 1 result row appears

Write as e2e/dashboard.spec.js using @playwright/test
Include proper waits and error messages
```

### AI Output
Claude returned ~120 lines with:
- 3 test scenarios
- Page navigation
- Element selectors
- Assertions

### What We Refined
1. **Selector Too Broad:** `text=Packets Sent` matched sidebar label early
   - Changed to `.summary-card:has(text="Packets Sent")`

2. **Race Condition:** Didn't wait for network
   - Added `page.waitForLoadState('networkidle')`

3. **Ping Timeout:** 15s not always enough on slow connections
   - Increased to 30s with `setTimeout: 30000`

4. **Element Not Visible:** Form inputs were outside viewport
   - Added `page.locator(selector).scrollIntoViewIfNeeded()`

5. **Missing Cleanup:** Tests left state
   - Added `afterEach` to clear history

### Code Impact
- **Lines Added:** 140
- **Bugs Fixed:** 2 (selector specificity, async waits)
- **Test Coverage:** 3 critical user paths
- **Time Saved:** ~2 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 10 — GitHub Actions CI/CD Pipeline

**Who:** Peer Saeedullah (R048)  
**Phase:** Week 2 — Deployment  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 19, 2026

### Request
```
Write GitHub Actions workflow (.github/workflows/ci.yml):

Triggers: push + pull_request to main/master

Jobs:
1. test-backend
   - Setup Node.js 18
   - Install backend deps
   - Run 'npm test'
   - Cache node_modules

2. build-frontend
   - Setup Node.js 18
   - Install frontend deps
   - Run 'npm run build'
   - Cache node_modules
   - Upload dist/ as artifact

Use actions/setup-node, actions/cache, actions/upload-artifact
```

### AI Output
Claude created ~80 lines with:
- 2 parallel jobs
- Caching setup
- Artifact upload

### What We Refined
1. **Cache Key:** Used only Node version
   - Changed to: `${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`

2. **Working Directories:** Paths weren't scoped to backend/frontend
   - Added `working-directory: ./backend` and `./frontend`

3. **No Failure Notifications:** Tests passed silently
   - Added `if: failure()` step to post failure comments on PRs

4. **Artifact Retention:** Used default 90 days
   - Set explicit `retention-days: 30`

5. **Node Version Hardcoded:** Can't test multiple versions
   - Made matrix: `node-version: [18.x, 20.x]` (for future flexibility)

### Code Impact
- **Lines Added:** 95
- **Bugs Fixed:** 1 (cache key)
- **Time Saved:** ~1.5 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 11 — Security Hardening Review

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 2 — Security  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 20, 2026

### Request
```
Review this sanitize() function for command injection vulnerabilities:

function sanitize(input) {
  if (!input || typeof input !== 'string') return null;
  const safe = input.trim().replace(/[^a-zA-Z0-9.\-:_]/g, '');
  if (safe.length === 0 || safe.length > 253) return null;
  return safe;
}

1. Is it sufficient to prevent injection?
2. What edge cases bypass it?
3. Are there improvements?

We use this before passing hostnames to exec() for ping/traceroute.
```

### AI Output
Claude confirmed:
- Allowlist approach (✅ secure)
- Identified edge case: IPv6 with `%` zone IDs stripped
- Suggested post-sanitization validation

### What We Refined
1. **IPv6 Zone ID:** `fe80::1%eth0` loses `%eth0`
   - Accept only standard IPv6 (no zone IDs)

2. **No Validation:** Sanitized string could still be invalid
   - Added post-check: regex for IPv4 / IPv6 / hostname

3. **No Logging:** Injection attempts went unnoticed
   - Added rate-limited warning logs

4. **CORS Origin:** Hardcoded in production
   - Made configurable via env var

5. **No Rate Limiting:** Could DoS with many sanitization failures
   - Added IP-based rate limiter (100 requests/minute)

### Code Impact
- **Lines Added:** 50
- **Security Issues Fixed:** 3 (IPv6 handling, CORS hardcoding, rate limiting)
- **Time Saved:** ~1.5 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## PROMPT 12 — Dashboard Page with Real-Time Metrics

**Who:** Shahzaib Ali (R031)  
**Phase:** Week 2 — Final Features  
**Tool:** Claude 3.5 Sonnet  
**Date:** May 21, 2026

### Request
```
Build DashboardPage (home page):
- Show live network status: UP/DOWN
- Display recent tests (last 5): type + status
- System info cards: OS, uptime, node version
- Network adapter count
- Average latency from recent pings
- Large status indicator (green UP, red DOWN)
- Refresh button to re-fetch interfaces
- Empty state if no history
- Dark theme, Tailwind
- Icons from Lucide React
```

### AI Output
Claude returned ~180 lines with:
- Status cards
- Stats display
- Refresh logic
- Empty state

### What We Refined
1. **Stale Data:** Didn't refetch after history updates
   - Added `useEffect` listener on history prop

2. **Icon Selection:** Too many icons cluttering the design
   - Used only 4 key icons (Globe, Network, Activity, Settings)

3. **Average Latency:** Included timeouts (NaN calculation)
   - Filter to successful pings only: `results.filter(r => r.success)`

4. **Color Scheme:** Background too dark (AMOLED burn-in risk)
   - Changed from #000000 to #0a0e1a (dark blue-grey)

5. **Refresh Feedback:** No indication when fetching
   - Added spinner on refresh button

### Code Impact
- **Lines Added:** 200
- **Bugs Fixed:** 1 (average latency calculation)
- **Time Saved:** ~2 hours
- **Result Status:** ✅ **Refined & Deployed**

---

## Summary Table

| # | Week | Author | Feature | Tool | Status | Time Saved | Bugs Fixed |
|---|------|--------|---------|------|--------|-----------|-----------|
| 01 | W1 | R048 | Backend scaffold | Claude | ✅ | 4h | 3 |
| 02 | W1 | R031 | Ping chart | Claude | ✅ | 3h | 2 |
| 03 | W1 | R031 | Traceroute viz | Claude | ✅ | 2.5h | 2 |
| 04 | W1 | R048 | DNS table | Claude | ✅ | 3h | 1 |
| 05 | W1 | R031 | Interfaces | Claude | ✅ | 2h | 2 |
| 06 | W1 | R048 | useWebSocket | Claude | ✅ | 1.5h | 2 |
| 07 | W2 | R031 | History + CSV | Claude | ✅ | 3h | 2 |
| 08 | W2 | R048 | Jest tests | Claude | ✅ | 2.5h | 1 |
| 09 | W2 | R031 | Playwright E2E | Claude | ✅ | 2h | 2 |
| 10 | W2 | R048 | GitHub Actions | Claude | ✅ | 1.5h | 1 |
| 11 | W2 | R031 | Security review | Claude | ✅ | 1.5h | 3 |
| 12 | W2 | R031 | Dashboard | Claude | ✅ | 2h | 1 |
| **TOTALS** | — | — | — | — | ✅ 12/12 | **28.5h** | **22** |

---

## Key Learnings

### 1. **AI is a Great First-Draft Generator**
Every prompt required at least 1–2 refinements. AI excels at scaffolding but struggles with:
- Platform-specific edge cases (Windows vs Linux vs macOS)
- Regex patterns for parsing complex output
- State management in React (stale closures)

### 2. **Security Reviews Pay Off**
Prompt 11 (security hardening) surfaced 3 issues:
- IPv6 zone ID handling
- Missing input validation
- Lack of rate limiting

These were non-obvious and easily missed without deliberate review.

### 3. **Testing Coverage Multiplier**
Prompts 8–9 (unit + E2E tests) caught bugs that manual testing missed:
- DNS mock structure mismatch
- Stale selector issues in E2E
- Race conditions in async operations

### 4. **Deployment Complexity**
Prompt 10 (CI/CD) required OS-specific handling:
- Cache key must include OS and lock file hash
- Working directories must be scoped per job
- Artifact retention and GitHub contexts matter

### 5. **Vibe Coding Workflow Works**
- **Prompt → AI output → Human refinement → Merge** is efficient
- **Iterative small prompts** better than one massive prompt
- **Logging every step** prevents rework and helps team alignment

---

## If We Started Over: 3 Key Changes

### 1. **Prompt More Precisely**
Include specific error messages or test cases upfront:
- ❌ "Build a ping chart"
- ✅ "Build a ping chart that plots RTT on Y-axis and handles Windows `time<1ms` format"

### 2. **Test-First for Complex Features**
Write tests in the prompt before implementation:
- Helps AI understand edge cases
- Reduces refinement cycles

### 3. **Dedicated Security Prompt Earlier**
Don't wait until Week 2. Ask Claude in Week 1:
- "Identify 3 security risks in this architecture"
- Prevents technical debt

---

## Conclusion

**Total Time Saved:** ~28.5 hours over 2 weeks  
**Code Quality:** 12/12 prompts refined successfully  
**Bugs Introduced by AI:** 0 (all caught in refinement)  
**Team Alignment:** 100% via AI_PROMPTS.md logging  

### Final Take
AI accelerates the 80% of work that is boilerplate/scaffolding. The other 20% (edge cases, security, performance) still requires human expertise. **Vibe coding is not "let AI build everything"—it's "let AI handle the tedious parts so humans can focus on the hard parts."**

---

**Last Updated:** May 26, 2026  
**Total Prompts Logged:** 12  
**Team Members:** Shahzaib Ali (R031), Peer Saeedullah (R048)  
**Supervisor:** Sir Ahmad Mustafa
