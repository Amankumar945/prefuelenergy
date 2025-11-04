# Prefuel Energy — Project Summary

A full-stack demo ERP for a Solar Rooftop company (India context), covering leads, quotes, projects, inventory, procurement, invoices, announcements, service tickets, HR attendance, and KPI reports.

This monorepo contains a Vite/React/Tailwind client and an Express/Node server with JWT authentication and simple file-based persistence.

Stage 1 (Complete):
- Real-time UI via SSE with auto-reconnect; Live/Offline indicator in the top bar
- Offline-first basics: PWA manifest + service worker shell cache; offline write queue with auto-sync
- Input validation with zod on key write routes (leads, items, quotes, POs, invoices)
- Pagination totals surfaced to UI (leads, quotes, invoices)
- Invoice numbering (INV-YYYYMM-####) and line-level rounding for accurate GST math
- SEO meta on client; one-process production serving (Express serves client/dist)

## Monorepo layout

```
Prefuel Energy/
  client/   # React + Vite + Tailwind UI
  server/   # Express API, JWT, in-memory store persisted to data.json
  README.md # This file
```

## Tech stack
- Client: React 18, Vite, TailwindCSS
- Server: Node.js, Express, jsonwebtoken, cors
- Auth: JWT (7-day expiry), localStorage in client
- Persistence: In-memory with snapshot persisted to `server/data.json`
 - Realtime: Server-Sent Events (SSE) endpoint `/api/stream` with heartbeat and backoff on client
 - Offline: Service worker for shell/static caching; Axios write queue with auto-flush on reconnect

## Quick start (dev)
1) Start API server
```
cd server
npm install
npm start
# API on http://localhost:5000
```

2) Start client
```
cd client
npm install
npm run dev
# UI on http://localhost:5173
```

### Environment variables (server)
- `PORT` (default: `5000`)
- `JWT_SECRET` (default: `prefuel_energy_dev_secret_please_change`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
 - `DATA_FILE`, `DATA_BACKUP_DIR`, `DATA_BACKUP_KEEP` (optional; file snapshot path and backups)

### Environment variables (client)
- `VITE_API_BASE_URL` (default: `http://localhost:5000`)

## Authentication and roles
- Roles: `admin`, `staff`, `hr`, `ops`, `quotes`, `finance`, `sales` (enforced on both client routes and server endpoints)
- Demo users (plain text passwords; demo only):
  - Admin: `admin@prefuel` / `Admin@12345`
  - Admin (Narendra): `Narendra@prefuel` / `Narendra@greentree`
  - Staff: `staff@prefuel` / `Staff@12345`
  - HR: `hr@prefuel` / `Hr@2025!`
  - Ops (Dashboard • Projects • Inventory): `pk5099985@gmail.com` / `9105928915`
  - Quotes (Dashboard • Quotes): `joshi@gmail.com` / `joshi@123`
  - Finance (Dashboard • Invoices • Reports): `deppak@gmail.com` / `deepak@123`
  - Sales (Dashboard • Leads • Quotes • Projects): `Awasthi@prefuel` / `Awasthi@123`

Client stores `token` and `user` in `localStorage` and injects `Authorization: Bearer <token>` via Axios interceptor. On 401, it clears storage and redirects to `/login`.

## Frontend routes (role gating)
- `/login` — anyone
- `/` — Dashboard (admin, staff)
- `/projects` — Projects list (admin, staff)
- `/projects/:id` — Project details (admin, staff)
- `/leads` — Leads (admin, staff)
- `/quotes` — Quotes (admin, staff)
- `/inventory` — Inventory (admin, staff)
- `/procurement` — Purchase Orders (admin, staff)
- `/invoices` — Invoices (admin, staff)
- `/service` — Service Tickets (admin, staff)
- `/hr` — HR Dashboard (hr)
- `/announcements` — Announcements (all authenticated; create requires admin)
- `/reports` — Reports & KPIs (all authenticated)

## API surface (high-level)
Base URL: `http://localhost:5000`

Realtime
- `GET /api/stream` (auth) → SSE stream of `{ type, entity, id, payload }`

Auth
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/me` (auth) → `{ user }`

Dashboard & Reports
- `GET /api/stats` (auth) → overview counts for dashboard
- `GET /api/reports/summary?days|from|to` (auth) → KPIs and trends

Projects
- `GET /api/projects` (auth)
- `GET /api/projects/:id` (auth)
- `POST /api/projects/:id/milestones` (auth) → update steps/installer/schedule/acquisition/followUp

Leads
- `GET /api/leads` (auth) → supports pagination `?page=&size=`, returns `{ leads, page, size, total }`
- `POST /api/leads` (auth)
- `PUT /api/leads/:id` (auth)
- `DELETE /api/leads/:id` (auth + admin)

Quotes
- `GET /api/quotes` (auth) → supports `?page=&size=`, returns `{ quotes, page, size, total }`
- `POST /api/quotes` (auth)
- `PUT /api/quotes/:id` (auth)
- `POST /api/quotes/:id/convert` (auth) → creates a project, marks quote accepted

Inventory Items
- `GET /api/items` (auth) (supports `?page=&size=` pagination)
- `POST /api/items` (auth)
- `PUT /api/items/:id` (auth + admin)
- `DELETE /api/items/:id` (auth + admin)

Procurement / Purchase Orders
- `GET /api/purchase-orders` (auth)
- `POST /api/purchase-orders` (auth) → compute totals server-side
- `POST /api/purchase-orders/:id/receive` (auth) → increments stock; marks received

Invoices
- `GET /api/invoices` (auth) → supports `?page=&size=`, returns `{ invoices, page, size, total }` and per-invoice `{ totals }`
- `POST /api/invoices` (auth) → if `quoteId` set and no items provided, derives lines from quote; IDs like `INV-YYYYMM-####`
- `PUT /api/invoices/:id` (auth) → recomputes totals and mirrors to `amount`

Documents
- `GET /api/documents` (auth) → filter by `entityType`, `entityId`
- `POST /api/documents` (auth) → validates http(s) URL

Tasks
- `GET /api/tasks` (auth) → optional `?projectId=` filter
- `POST /api/tasks` (auth)
- `PUT /api/tasks/:id` (auth)

Attendance (HR)
- `GET /api/attendance` (auth)
- `POST /api/attendance` (auth)

Announcements
- `GET /api/announcements` (auth) → filters by date window (active period)
- `POST /api/announcements` (auth + admin)
- `PUT /api/announcements/:id` (auth + admin)

Service Tickets
- `GET /api/service-tickets` (auth) → `?projectId=&leadId=` filters
- `POST /api/service-tickets` (auth)
- `PUT /api/service-tickets/:id` (auth)

## Data persistence and seeding
- Runtime state is in-memory, snapshotted to `server/data.json` using `saveData()` after mutations
- On boot, `loadData()` hydrates state from `data.json` if present
- Seeders (idempotent) extend inventory:
  - Hardware and cabling (e.g., Nut & Bolt Set, AC/DC Cable)
  - Branded inverters (Solax/Havells/Growatt/Luminous; 3–5 kW)
  - Branded panels (Adani/Premier/Tata/Waaree; 500/540W)

Tip: To reset demo data, stop the server, delete `server/data.json`, and start the server again.

## Key calculations and business logic

### Purchase Orders totals
Given lines with `(qty, unitPrice, taxPercent)`:
- `subtotal = Σ (qty × unitPrice)`
- `tax = Σ (qty × unitPrice × taxPercent/100)`
- `grandTotal = round((subtotal + tax), 2)`

Server recomputes totals for list and on creation/receive.

### Invoice totals and outstanding
- Same line-level math as POs
- Each invoice response includes `{ totals: { subtotal, tax, grandTotal } }`
- Mirror `invoice.amount = grandTotal` for legacy compatibility
- Outstanding computed in reports: `outstanding = totalAll - paidAll`
- Aging buckets allocate unpaid grand totals by days since `createdAt`: `0–30`, `31–60`, `61–90`, `90+`

### Invoice numbering
- IDs are generated as `INV-YYYYMM-####` (resets counter when server restarts in this demo; persist counter if needed).

### Reports KPIs and trends
- Leads: counts by status; daily creation trend in selected window
- Conversion by source/channel: aggregates `leadsData` `{ total, won, rate% }`
- Projects: counts by status; `avgCycleDays` from first→last done step dates
- POs: open vs total; on-time GRN = `% received within 7 days of creation`
- Invoices: totals (sum of `grandTotal`), paid totals, outstanding; daily amount trend

## Example flows (cURL)

Login
```bash
curl -sS -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prefuel","password":"Admin@12345"}'
```

Create a Lead (auth)
```bash
curl -sS -X POST http://localhost:5000/api/leads \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Anil Kumar","phone":"+91-9000000001","email":"anil@example.com","source":"organic"}'
```

Create a Quote and Convert to Project (auth)
```bash
# Create quote
curl -sS -X POST http://localhost:5000/api/quotes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"leadId":"l1","items":[{"name":"Solar Panel 500W","qty":4,"price":9000}]}'

# Convert quote to project
curl -sS -X POST http://localhost:5000/api/quotes/q2001/convert \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"customerName":"Sharma Residence","siteAddress":"Noida","capacityKw":5}'
```

Create PO and Mark Received (auth)
```bash
# Create PO
curl -sS -X POST http://localhost:5000/api/purchase-orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"supplier":"ABC Solar Distributor","lines":[{"itemId":"i1","qty":10,"unitPrice":5000,"taxPercent":12}]}'

# Receive PO (increments stock)
curl -sS -X POST http://localhost:5000/api/purchase-orders/po123/receive \
  -H "Authorization: Bearer $TOKEN"
```

Create Invoice from Quote (auth)
```bash
curl -sS -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"quoteId":"q2003","customerName":"Customer","status":"draft"}'
```

## Known gaps and recommendations
- Offline queue uses localStorage (simple). Consider IndexedDB + Background Sync for large queues.
- Offline conflict resolution is last-write-wins (server). Consider domain-specific merge strategies if needed.
- Service worker requires HTTPS in production. Ensure MilesWeb serves your domain via HTTPS.
- Invoice counter resets on server restart (demo). Persist counter if external numbering is required.

## Security notes (demo-only)
- Passwords are plain text; JWT secret is defaulted; CORS is permissive for local dev. Do not use as-is in production.
- Add rate limiting (beyond login), audit persistence, and structured validation for production.

## Production build & deploy (MilesWeb)
1) Client build (already done in repo, repeat as needed):
```
cd client
npm install
npm run build
```
2) Server env (.env):
```
PORT=5000
JWT_SECRET=change_me
CORS_ORIGIN=https://your-domain.example
```
3) Start server in production (one process serving API + static UI):
```
cd server
NODE_ENV=production node index.js
```
4) Health check: `GET /healthz` should return `{ ok: true }`
5) Ensure HTTPS so the service worker and offline cache work.

## Developer tips
- Clearing auth: remove `localStorage` keys `token` and `user`
- Resetting data: delete `server/data.json` (with server stopped) to reseed on next start
- CSV exports include UTF-8 BOM to preserve `₹` in Excel

---
© Green Tree • Prefuel Energy — Demo ERP for Solar Rooftop (India)
