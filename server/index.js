const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'prefuel_energy_dev_secret_please_change';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// In-memory users (simple for MVP)
// Passwords are stored in plain text strictly for demo simplicity. Do NOT use in production.
const users = [
  {
    id: 'u1',
    name: 'Prefuel Admin',
    email: 'admin@prefuel',
    role: 'admin',
    password: 'Admin@12345',
  },
  {
    id: 'u2',
    name: 'Prefuel Staff',
    email: 'staff@prefuel',
    role: 'staff',
    password: 'Staff@12345',
  },
  {
    id: 'u3',
    name: 'Green Tree HR',
    email: 'hr@prefuel',
    role: 'hr',
    password: 'Hr@2025!',
  },
];

// In-memory sample data
const leads = {
  organic: 42,
  inorganic: 23,
};

const teleCallers = [
  { id: 't1', name: 'Aarav', active: true },
  { id: 't2', name: 'Priya', active: false },
  { id: 't3', name: 'Rohit', active: true },
  { id: 't4', name: 'Neha', active: false },
];

const conversions = {
  total: 27,
  bySource: {
    organic: 18,
    inorganic: 9,
  },
};

const projects = [
  {
    id: 'p1',
    customerName: 'Sharma Residence',
    siteAddress: 'Sector 21, Noida, UP',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 5,
    status: 'working', // working | completed | not_started
    installation: {
      installedItems: [
        { item: 'Panels', qty: 10, unit: 'pcs' },
        { item: 'Inverter', qty: 1, unit: 'unit' },
        { item: 'Mounting Structure', qty: 1, unit: 'set' },
      ],
      pendingItems: [
        { item: 'Wiring', qty: 1, unit: 'set' },
        { item: 'Net Metering', qty: 1, unit: 'approval' },
      ],
      scheduledDate: '2025-10-05',
      installerName: 'Ravi Kumar',
      lastUpdated: '2025-09-29',
      steps: [
        { name: 'Site Survey', status: 'done', date: '2025-09-22' },
        { name: 'Design & BOM', status: 'done', date: '2025-09-24' },
        { name: 'Installation', status: 'in_progress', date: '2025-10-05' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
    acquisition: {
      sourceType: 'telecaller', // telecaller | site_agent | survey | organic | inorganic | digital_ads | referral
      sourceChannel: 'Inbound Call',
      agent: { id: 'tc1', name: 'Aarav (Telecaller)', phone: '+91-9000000101' },
    },
    followUp: {
      ownerRole: 'telecaller',
      person: { id: 'tc1', name: 'Aarav', phone: '+91-9000000101' },
      lastContacted: '2025-10-04',
    },
  },
  {
    id: 'p2',
    customerName: 'Gupta Apartments',
    siteAddress: 'Baner, Pune, MH',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 15,
    status: 'completed',
    installation: {
      installedItems: [
        { item: 'Panels', qty: 30, unit: 'pcs' },
        { item: 'Inverter', qty: 2, unit: 'unit' },
        { item: 'Mounting Structure', qty: 1, unit: 'set' },
        { item: 'Wiring', qty: 1, unit: 'set' },
        { item: 'Net Metering', qty: 1, unit: 'approval' },
      ],
      pendingItems: [],
      scheduledDate: '2025-08-20',
      installerName: 'Pooja Singh',
      lastUpdated: '2025-09-10',
      steps: [
        { name: 'Site Survey', status: 'done', date: '2025-08-01' },
        { name: 'Design & BOM', status: 'done', date: '2025-08-05' },
        { name: 'Installation', status: 'done', date: '2025-08-20' },
        { name: 'Net Metering', status: 'done', date: '2025-08-28' },
      ],
    },
    acquisition: {
      sourceType: 'organic',
      sourceChannel: 'Website',
    },
    followUp: {
      ownerRole: 'site_agent',
      person: { id: 'sa2', name: 'Pooja (Field)', phone: '+91-9000000202' },
      lastContacted: '2025-09-29',
    },
  },
  {
    id: 'p3',
    customerName: 'Patel Villa',
    siteAddress: 'SG Highway, Ahmedabad, GJ',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 7.5,
    status: 'not_started',
    installation: {
      installedItems: [],
      pendingItems: [
        { item: 'Site Survey', qty: 1, unit: 'visit' },
        { item: 'Design & BOM', qty: 1, unit: 'doc' },
      ],
      scheduledDate: '2025-10-12',
      installerName: 'To Assign',
      lastUpdated: '2025-09-26',
      steps: [
        { name: 'Site Survey', status: 'pending' },
        { name: 'Design & BOM', status: 'pending' },
        { name: 'Installation', status: 'pending' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
    acquisition: {
      sourceType: 'digital_ads',
      sourceChannel: 'Meta Ads',
    },
    followUp: {
      ownerRole: 'sales',
      person: { id: 'sl1', name: 'Meera (Sales)', phone: '+91-9000000303' },
      lastContacted: '2025-09-30',
    },
  },
  // Additional sample projects for testing filters (India context)
  {
    id: 'p4',
    customerName: 'Singh Bungalow',
    siteAddress: 'Vaishali Nagar, Jaipur, RJ',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 7,
    status: 'working',
    installation: {
      installedItems: [
        { item: 'Panels', qty: 12, unit: 'pcs' },
        { item: 'Inverter', qty: 1, unit: 'unit' },
      ],
      pendingItems: [
        { item: 'Net Metering', qty: 1, unit: 'approval' },
      ],
      scheduledDate: '2025-10-08',
      installerName: 'Rahul Verma',
      lastUpdated: '2025-10-02',
      steps: [
        { name: 'Site Survey', status: 'done', date: '2025-09-25' },
        { name: 'Design & BOM', status: 'done', date: '2025-09-28' },
        { name: 'Installation', status: 'in_progress', date: '2025-10-08' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
    acquisition: {
      sourceType: 'referral',
      sourceChannel: 'Neighbour Referral',
      agent: { id: 'sl2', name: 'Priya (Sales)', phone: '+91-9000000404' },
    },
    followUp: {
      ownerRole: 'sales',
      person: { id: 'sl2', name: 'Priya', phone: '+91-9000000404' },
      lastContacted: '2025-10-03',
    },
  },
  {
    id: 'p5',
    customerName: 'Roy Residency',
    siteAddress: 'Salt Lake, Kolkata, WB',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 10,
    status: 'completed',
    installation: {
      installedItems: [
        { item: 'Panels', qty: 20, unit: 'pcs' },
        { item: 'Inverter', qty: 2, unit: 'unit' },
        { item: 'Wiring', qty: 1, unit: 'set' },
      ],
      pendingItems: [],
      scheduledDate: '2025-07-18',
      installerName: 'Sourav Dutta',
      lastUpdated: '2025-08-05',
      steps: [
        { name: 'Site Survey', status: 'done', date: '2025-07-01' },
        { name: 'Design & BOM', status: 'done', date: '2025-07-05' },
        { name: 'Installation', status: 'done', date: '2025-07-18' },
        { name: 'Net Metering', status: 'done', date: '2025-07-30' },
      ],
    },
    acquisition: {
      sourceType: 'organic',
      sourceChannel: 'Website',
    },
    followUp: {
      ownerRole: 'site_agent',
      person: { id: 'sa3', name: 'Sourav (Field)', phone: '+91-9000000505' },
      lastContacted: '2025-07-30',
    },
  },
  {
    id: 'p6',
    customerName: 'Verma House',
    siteAddress: 'Gomti Nagar, Lucknow, UP',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw: 6,
    status: 'not_started',
    installation: {
      installedItems: [],
      pendingItems: [
        { item: 'Site Survey', qty: 1, unit: 'visit' },
      ],
      scheduledDate: '2025-10-15',
      installerName: 'To Assign',
      lastUpdated: '2025-10-01',
      steps: [
        { name: 'Site Survey', status: 'pending' },
        { name: 'Design & BOM', status: 'pending' },
        { name: 'Installation', status: 'pending' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
    acquisition: {
      sourceType: 'digital_ads',
      sourceChannel: 'Google Ads',
    },
    followUp: {
      ownerRole: 'telecaller',
      person: { id: 'tc3', name: 'Neha', phone: '+91-9000000606' },
      lastContacted: '2025-10-04',
    },
  },
  {
    id: 'p7',
    customerName: 'TechPark Tower A',
    siteAddress: 'Hinjawadi Phase 2, Pune, MH',
    scheme: 'Commercial Rooftop (India)',
    capacityKw: 25,
    status: 'working',
    installation: {
      installedItems: [
        { item: 'Panels', qty: 45, unit: 'pcs' },
        { item: 'Inverter', qty: 3, unit: 'unit' },
      ],
      pendingItems: [
        { item: 'Mounting Structure', qty: 1, unit: 'set' },
      ],
      scheduledDate: '2025-10-12',
      installerName: 'Pooja Singh',
      lastUpdated: '2025-10-03',
      steps: [
        { name: 'Site Survey', status: 'done', date: '2025-09-20' },
        { name: 'Design & BOM', status: 'in_progress', date: '2025-10-03' },
        { name: 'Installation', status: 'pending' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
    acquisition: {
      sourceType: 'inorganic',
      sourceChannel: 'Cold Outreach',
      agent: { id: 'sl4', name: 'Karan (Sales)', phone: '+91-9000000707' },
    },
    followUp: {
      ownerRole: 'sales',
      person: { id: 'sl4', name: 'Karan', phone: '+91-9000000707' },
      lastContacted: '2025-10-03',
    },
  },
];

// New in-memory modules for MVP ERP features
const leadsData = [
  {
    id: 'l1',
    name: 'Anil Kumar',
    phone: '+91-9000000001',
    email: 'anil@example.com',
    source: 'organic', // organic | referral | inbound | outbound
    status: 'new', // new | qualified | quoted | won | lost
    projectSizeKw: 5,
    createdAt: '2025-09-25T10:00:00Z',
    acquisition: { sourceType: 'organic', sourceChannel: 'Website' },
    owner: { role: 'telecaller', person: { id: 'tc1', name: 'Aarav', phone: '+91-9000000101' } },
  },
  {
    id: 'l2',
    name: 'Meera Gupta',
    phone: '+91-9000000002',
    email: 'meera@example.com',
    source: 'referral',
    status: 'qualified',
    projectSizeKw: 3,
    createdAt: '2025-09-28T10:00:00Z',
    acquisition: { sourceType: 'referral', sourceChannel: 'Customer Referral' },
    owner: { role: 'sales', person: { id: 'sl1', name: 'Meera', phone: '+91-9000000303' } },
  },
];

const items = [
  { id: 'i1', name: 'Solar Panel 500W', sku: 'SP-500', unit: 'pcs', stock: 40, minStock: 20 },
  { id: 'i2', name: 'String Inverter 5kW', sku: 'INV-5K', unit: 'unit', stock: 6, minStock: 4 },
  { id: 'i3', name: 'Mounting Structure', sku: 'MS-SET', unit: 'set', stock: 10, minStock: 5 },
];

const purchaseOrders = [
  // { id, supplier, items:[{itemId, qty, unitPrice, taxPercent}], status: ordered|received, createdAt, totals:{subtotal, tax, grandTotal} }
  {
    id: 'po1001',
    supplier: 'ABC Solar Distributor – Noida',
    items: [
      { itemId: 'i1', qty: 12, unitPrice: 5200, taxPercent: 12 }, // 500W panels
      { itemId: 'i2', qty: 1, unitPrice: 32000, taxPercent: 18 }, // 5kW inverter
    ],
    status: 'ordered',
    createdAt: '2025-10-02T10:00:00Z',
    totals: { subtotal: 0, tax: 0, grandTotal: 0 }, // will be recalculated on read/create
  },
  {
    id: 'po1002',
    supplier: 'Sunrise Renewables – Jaipur',
    items: [
      { itemId: 'i3', qty: 5, unitPrice: 8500, taxPercent: 18 }, // Mounting structure
    ],
    status: 'ordered',
    createdAt: '2025-10-03T09:30:00Z',
    totals: { subtotal: 0, tax: 0, grandTotal: 0 },
  },
];

const quotes = [
  // { id, leadId, projectId, amount, status: draft|sent|accepted|rejected, items:[{itemId, name, qty, price}], createdAt }
  // Residential 2 kW sample (approx ₹35/W → ~₹70,000)
  {
    id: 'q2001',
    name: 'Residential 2 kW — Rooftop Subsidy',
    leadId: 'l1',
    projectId: null,
    status: 'sent',
    items: [
      { itemId: 'i1', name: 'Solar Panel 500W', qty: 4, price: 9000 }, // ₹36,000
      { itemId: 'i2', name: 'String Inverter 2kW', qty: 1, price: 18000 }, // ₹18,000
      { itemId: 'i3', name: 'Mounting Structure (set)', qty: 1, price: 8000 }, // ₹8,000
      { itemId: null, name: 'BOS (cables, DCDB/ACDB, earthing)', qty: 1, price: 8000 }, // ₹8,000
    ],
    amount: 36000 + 18000 + 8000 + 8000,
    createdAt: '2025-10-02T12:00:00Z',
  },
  // Commercial 5 kW sample (₹30/W → ₹1,50,000)
  {
    id: 'q2002',
    name: 'Commercial 5 kW — ₹30/W',
    leadId: 'l2',
    projectId: null,
    status: 'sent',
    items: [
      { itemId: 'i1', name: 'Solar Panel 500W', qty: 10, price: 9000 }, // ₹90,000
      { itemId: 'i2', name: 'String Inverter 5kW', qty: 1, price: 32000 }, // ₹32,000
      { itemId: 'i3', name: 'Mounting Structure (set)', qty: 1, price: 14000 }, // ₹14,000
      { itemId: null, name: 'BOS + Installation', qty: 1, price: 14000 }, // ₹14,000
    ],
    amount: 90000 + 32000 + 14000 + 14000, // ₹1,50,000
    createdAt: '2025-10-03T09:00:00Z',
  },
  // Commercial 7.5 kW sample (₹30/W → ₹2,25,000)
  {
    id: 'q2003',
    name: 'Commercial 7.5 kW — ₹30/W',
    leadId: null,
    projectId: null,
    status: 'sent',
    items: [
      { itemId: 'i1', name: 'Solar Panel 500W', qty: 15, price: 9000 }, // ₹1,35,000
      { itemId: null, name: 'String Inverter 7.5kW', qty: 1, price: 50000 }, // ₹50,000 (illustrative)
      { itemId: 'i3', name: 'Mounting Structure (set)', qty: 1, price: 20000 }, // ₹20,000
      { itemId: null, name: 'BOS + Installation', qty: 1, price: 20000 }, // ₹20,000
    ],
    amount: 135000 + 50000 + 20000 + 20000, // ₹2,25,000
    createdAt: '2025-10-03T10:30:00Z',
  },
  // Commercial 10 kW sample (₹30/W → ₹3,00,000)
  {
    id: 'q2004',
    name: 'Commercial 10 kW — ₹30/W',
    leadId: null,
    projectId: null,
    status: 'sent',
    items: [
      { itemId: 'i1', name: 'Solar Panel 500W', qty: 20, price: 9000 }, // ₹1,80,000
      { itemId: null, name: 'String Inverter 10kW', qty: 1, price: 70000 }, // ₹70,000 (illustrative)
      { itemId: 'i3', name: 'Mounting Structure (set)', qty: 1, price: 26000 }, // ₹26,000
      { itemId: null, name: 'BOS + Installation', qty: 1, price: 24000 }, // ₹24,000
    ],
    amount: 180000 + 70000 + 26000 + 24000, // ₹3,00,000
    createdAt: '2025-10-03T11:00:00Z',
  },
];

const documents = [
  // { id, entityType: 'lead'|'project', entityId, title, url, uploadedAt }
];

const tasks = [
  // { id, projectId, title, assignee, dueDate, status: 'open'|'done' }
];

let attendanceRecord = { date: '', present: 0, absent: 0 };

// Service tickets and invoices (new)
const serviceTickets = [
  // { id, projectId, leadId, title, priority: 'low'|'medium'|'high', status: 'open'|'in_progress'|'resolved', assignedTo, createdAt }
];

const invoices = [
  // { id, quoteId, customerName, items:[{ description, qty, price, taxPercent }], status: 'draft'|'sent'|'paid', createdAt }
  {
    id: 'inv1001',
    quoteId: null,
    customerName: 'Sharma Residence',
    items: [
      { description: 'Solar Panel 500W', qty: 10, price: 5200, taxPercent: 12 },
      { description: 'String Inverter 5kW', qty: 1, price: 32000, taxPercent: 18 },
      { description: 'Mounting Structure (set)', qty: 1, price: 8500, taxPercent: 18 },
    ],
    status: 'sent',
    createdAt: '2025-10-03T10:00:00Z',
  },
  {
    id: 'inv1002',
    quoteId: null,
    customerName: 'Gupta Apartments',
    items: [
      { description: 'Panels (30 pcs)', qty: 1, price: 155000, taxPercent: 12 },
      { description: 'Inverters (2 units)', qty: 1, price: 60000, taxPercent: 18 },
      { description: 'Wiring + BOS', qty: 1, price: 18000, taxPercent: 18 },
    ],
    status: 'paid',
    createdAt: '2025-09-12T15:30:00Z',
  },
];

// Announcements (global)
const announcements = [
  // { id, title, body, audience: 'all'|'staff'|'hr'|'sales', startsAt, endsAt, active: boolean, createdBy }
  { id: 'a1', title: 'October Incentive', body: 'Complete 10 sites in October to win a smartphone!', audience: 'all', startsAt: '2025-10-01', endsAt: '2025-10-31', active: true, createdBy: 'admin' },
];

// Audit logs (simple)
const auditLogs = [
  // { id, ts, user, entity, action, entityId, details }
];

// Helpers
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Simple role guard
function requireRole(role) {
  return function(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }
}

// Basic validators
function toPosNumber(val, def = 0) {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return def;
  return n;
}

function clampTax(t) {
  const n = toPosNumber(t, 0);
  return Math.max(0, Math.min(28, n));
}

function isSafeHttpUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Persistence helpers (save/load in-memory data to disk)
const DATA_PATH = path.join(__dirname, 'data.json');
function saveData() {
  try {
    const snapshot = {
      projects,
      leadsData,
      items,
      purchaseOrders,
      quotes,
      documents,
      tasks,
      attendanceRecord,
      serviceTickets,
      invoices,
      announcements,
      leads,
      teleCallers,
      conversions,
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
  } catch (err) {
    // ignore persistence errors in MVP
  }
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) return;
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.projects)) { projects.splice(0, projects.length, ...parsed.projects); }
    if (Array.isArray(parsed.leadsData)) { leadsData.splice(0, leadsData.length, ...parsed.leadsData); }
    if (Array.isArray(parsed.items)) { items.splice(0, items.length, ...parsed.items); }
    if (Array.isArray(parsed.purchaseOrders)) { purchaseOrders.splice(0, purchaseOrders.length, ...parsed.purchaseOrders); }
    if (Array.isArray(parsed.quotes)) { quotes.splice(0, quotes.length, ...parsed.quotes); }
    if (Array.isArray(parsed.documents)) { documents.splice(0, documents.length, ...parsed.documents); }
    if (Array.isArray(parsed.tasks)) { tasks.splice(0, tasks.length, ...parsed.tasks); }
    if (parsed.attendanceRecord && typeof parsed.attendanceRecord === 'object') { attendanceRecord = parsed.attendanceRecord; }
    if (Array.isArray(parsed.serviceTickets)) { serviceTickets.splice(0, serviceTickets.length, ...parsed.serviceTickets); }
    if (Array.isArray(parsed.invoices)) { invoices.splice(0, invoices.length, ...parsed.invoices); }
    if (Array.isArray(parsed.announcements)) { announcements.splice(0, announcements.length, ...parsed.announcements); }
    if (Array.isArray(parsed.auditLogs)) { auditLogs.splice(0, auditLogs.length, ...parsed.auditLogs); }
    if (parsed.leads && typeof parsed.leads === 'object') { Object.assign(leads, parsed.leads); }
    if (Array.isArray(parsed.teleCallers)) { teleCallers.splice(0, teleCallers.length, ...parsed.teleCallers); }
    if (parsed.conversions && typeof parsed.conversions === 'object') { Object.assign(conversions, parsed.conversions); }
  } catch (err) {
    // ignore load errors in MVP
  }
}

loadData();

// Seed missing inventory items from provided list (idempotent)
function seedInventoryDefaults() {
  const desired = [
    { name: 'Nut & Bolt Set', sku: 'NUT-BOLT-SET', unit: 'pcs' },
    { name: 'Bar Saddle', sku: 'BAR-SADDLE', unit: 'pcs' },
    { name: 'Fastener', sku: 'FASTENER', unit: 'pcs' },
    { name: 'Mid Clamp', sku: 'MID-CLAMP', unit: 'pcs' },
    { name: 'End Clamp', sku: 'END-CLAMP', unit: 'pcs' },
    { name: 'AC Cable', sku: 'CABLE-AC', unit: 'm' },
    { name: 'DC Cable', sku: 'CABLE-DC', unit: 'm' },
    { name: 'Earthing Wire', sku: 'EARTH-WIRE', unit: 'm' },
    { name: 'PVC Pipe', sku: 'PVC-PIPE', unit: 'm' },
    { name: 'Flexible Pipe', sku: 'FLEX-PIPE', unit: 'm' },
    { name: 'Saddle Clamp', sku: 'SADDLE-CLAMP', unit: 'pcs' },
    { name: 'Cable Tie', sku: 'CABLE-TIE', unit: 'pcs' },
    { name: 'Insulation Tape', sku: 'INS-TAPE', unit: 'pcs' },
  ];
  const have = new Set(items.map((it) => it.sku?.toLowerCase()));
  let added = false;
  desired.forEach((d) => {
    if (!have.has(d.sku.toLowerCase())) {
      items.push({ id: `i${Date.now()}${Math.floor(Math.random()*1000)}`, name: d.name, sku: d.sku, unit: d.unit, stock: 0, minStock: d.unit === 'm' ? 100 : 20 });
      added = true;
    }
  });
  if (added) saveData();
}

seedInventoryDefaults();

// Replace generic inverter with brand-specific 3–5 kW models (idempotent)
function seedInverterModels() {
  // Remove legacy generic inverter if present
  const legacyIdx = items.findIndex((it) => (it.sku === 'INV-5K') || (it.name && it.name.toLowerCase() === 'string inverter 5kw'));
  if (legacyIdx !== -1) {
    items.splice(legacyIdx, 1);
  }

  const brands = [
    { brand: 'Solax', code: 'SOLAX' },
    { brand: 'Havells', code: 'HAVELLS' },
    { brand: 'Growatt', code: 'GROWATT' },
    { brand: 'Luminous', code: 'LUMINOUS' },
  ];
  const powers = [
    { label: '3kW', code: '3K' },
    { label: '4kW', code: '4K' },
    { label: '5kW', code: '5K' },
  ];
  const haveSku = new Set(items.map((it) => it.sku?.toUpperCase()));
  let changed = legacyIdx !== -1;
  brands.forEach((b) => {
    powers.forEach((p) => {
      const sku = `INV-${b.code}-${p.code}`;
      if (!haveSku.has(sku)) {
        items.push({ id: `i${Date.now()}${Math.floor(Math.random()*1000)}`, name: `${b.brand} Inverter ${p.label}`, sku, unit: 'unit', stock: 0, minStock: 2 });
        changed = true;
      }
    });
  });
  if (changed) saveData();
}

seedInverterModels();

// Seed branded solar panel models (idempotent)
function seedPanelModels() {
  const brands = [
    { brand: 'Adani', code: 'ADANI' },
    { brand: 'Premier', code: 'PREMIER' },
    { brand: 'Tata', code: 'TATA' },
    { brand: 'Waaree', code: 'WAAREE' },
  ];
  const wattages = [500, 540];
  const haveSku = new Set(items.map((it) => it.sku?.toUpperCase()));
  let changed = false;
  brands.forEach((b) => {
    wattages.forEach((w) => {
      const sku = `PV-${b.code}-${w}W`;
      if (!haveSku.has(sku)) {
        items.push({ id: `i${Date.now()}${Math.floor(Math.random()*1000)}`, name: `${b.brand} Solar Panel ${w}W`, sku, unit: 'pcs', stock: 0, minStock: 20 });
        changed = true;
      }
    });
  });
  if (changed) saveData();
}

seedPanelModels();

// Audit helper
function logAudit(req, entity, action, entityId, details) {
  try {
    const entry = {
      id: `al${Date.now()}${Math.floor(Math.random()*1000)}`,
      ts: new Date().toISOString(),
      user: req?.user?.email || 'system',
      entity,
      action,
      entityId,
      details,
    };
    auditLogs.unshift(entry);
    // Keep last 2000 entries to limit file size
    if (auditLogs.length > 2000) auditLogs.length = 2000;
  } catch (_) {}
}

function paginate(arr, page, size) {
  const p = Math.max(1, Number(page) || 0);
  const s = Math.max(1, Math.min(200, Number(size) || 20));
  const start = (p - 1) * s;
  const slice = arr.slice(start, start + s);
  return { data: slice, page: p, size: s, total: arr.length };
}

// Rate limiter for login (very basic, in-memory)
const loginAttempts = new Map(); // key: ip, value: { count, ts }
function loginRateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 20;
  const rec = loginAttempts.get(ip) || { count: 0, ts: now };
  if (now - rec.ts > windowMs) {
    rec.count = 0;
    rec.ts = now;
  }
  rec.count += 1;
  loginAttempts.set(ip, rec);
  if (rec.count > maxAttempts) {
    return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  }
  next();
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Prefuel Energy API' });
});

app.post('/api/auth/login', loginRateLimit, (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/stats', authMiddleware, (req, res) => {
  const teleStats = {
    total: teleCallers.length,
    active: teleCallers.filter((t) => t.active).length,
    available: teleCallers.filter((t) => !t.active).length,
  };
  // Leads pipeline
  const pipeline = {
    total: leadsData.length,
    new: leadsData.filter(l=>l.status==='new').length,
    qualified: leadsData.filter(l=>l.status==='qualified').length,
    quoted: leadsData.filter(l=>l.status==='quoted').length,
    won: leadsData.filter(l=>l.status==='won').length,
    lost: leadsData.filter(l=>l.status==='lost').length,
  };
  // Inventory health
  const lowStock = items.filter((it) => it.stock <= it.minStock).length;
  const projectCounts = {
    working: projects.filter(p=>p.status==='working').length,
    completed: projects.filter(p=>p.status==='completed').length,
    not_started: projects.filter(p=>p.status==='not_started').length,
  };
  const data = {
    leads: { total: leads.organic + leads.inorganic, organic: leads.organic, inorganic: leads.inorganic },
    teleCallers: teleStats,
    conversions,
    pipeline,
    inventory: { items: items.length, lowStock },
    projects: projectCounts,
  };
  res.json(data);
});

// Reports summary (KPIs and simple trends)
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  const days = Math.max(1, Math.min(180, Number(req.query.days) || 30));
  const now = new Date();
  const startTs = now.getTime() - days * 24 * 60 * 60 * 1000;
  function dayKey(d) {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0,10);
  }

  // Leads KPIs
  const leadStatusCounts = leadsData.reduce((acc, l) => { acc[l.status] = (acc[l.status]||0)+1; return acc; }, {});
  const leadTrend = {};
  leadsData.forEach((l) => {
    const k = dayKey(l.createdAt);
    const ts = k ? new Date(k).getTime() : 0;
    if (k && ts >= startTs) leadTrend[k] = (leadTrend[k]||0) + 1;
  });

  // Projects KPIs
  const projCounts = {
    working: projects.filter(p=>p.status==='working').length,
    completed: projects.filter(p=>p.status==='completed').length,
    not_started: projects.filter(p=>p.status==='not_started').length,
  };
  const projectTrend = {};
  projects.forEach((p)=>{
    const createdLike = p.createdAt || p.installation?.lastUpdated;
    const k = createdLike ? dayKey(createdLike) : null;
    const ts = k ? new Date(k).getTime() : 0;
    if (k && ts >= startTs) projectTrend[k] = (projectTrend[k]||0)+1;
  });

  // POs
  const openPOs = purchaseOrders.filter(po=>po.status!=='received').length;
  const poTrend = {};
  purchaseOrders.forEach((po)=>{
    const k = dayKey(po.createdAt);
    const ts = k ? new Date(k).getTime() : 0;
    if (k && ts >= startTs) poTrend[k] = (poTrend[k]||0)+1;
  });

  // Invoices
  function ensureInvTotals(inv) {
    if (!inv.totals) {
      inv.totals = calculateInvoiceTotals(inv);
    }
    return inv.totals;
  }
  let invTotal = 0, invPaid = 0;
  invoices.forEach((inv)=>{
    const t = ensureInvTotals(inv);
    invTotal += t.grandTotal || 0;
    if (inv.status === 'paid') invPaid += t.grandTotal || 0;
  });
  const invOutstanding = Math.max(0, invTotal - invPaid);
  const invoiceTrend = {};
  invoices.forEach((inv)=>{
    const k = dayKey(inv.createdAt);
    const ts = k ? new Date(k).getTime() : 0;
    const t = ensureInvTotals(inv);
    if (k && ts >= startTs) invoiceTrend[k] = (invoiceTrend[k]||0) + (t.grandTotal||0);
  });

  // Inventory
  const lowStock = items.filter((it)=> it.stock <= it.minStock).length;

  // Compose response
  const summary = {
    leads: {
      total: leadsData.length,
      byStatus: leadStatusCounts,
    },
    projects: projCounts,
    purchaseOrders: { open: openPOs, total: purchaseOrders.length },
    invoices: { totalAmount: invTotal, paidAmount: invPaid, outstandingAmount: invOutstanding },
    inventory: { items: items.length, lowStock },
  };

  function toSeries(mapObj) {
    // Return sorted array of { date, value }
    return Object.keys(mapObj).sort().map((k)=> ({ date: k, value: mapObj[k] }));
  }

  const trends = {
    leadsCreated: toSeries(leadTrend),
    projectsCreated: toSeries(projectTrend),
    purchaseOrdersCreated: toSeries(poTrend),
    invoicesAmount: toSeries(invoiceTrend),
  };

  res.json({ days, summary, trends });
});

app.get('/api/projects', authMiddleware, (req, res) => {
  res.json({ projects });
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

// Update project milestones / basic fields
app.post('/api/projects/:id/milestones', authMiddleware, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const { steps, installerName, scheduledDate, installedItems, pendingItems, status, acquisition, followUp } = req.body || {};
  if (steps) project.installation.steps = steps;
  if (installerName) project.installation.installerName = installerName;
  if (scheduledDate) project.installation.scheduledDate = scheduledDate;
  if (Array.isArray(installedItems)) project.installation.installedItems = installedItems;
  if (Array.isArray(pendingItems)) project.installation.pendingItems = pendingItems;
  if (status) project.status = status;
  if (acquisition) project.acquisition = acquisition;
  if (followUp) project.followUp = followUp;
  project.installation.lastUpdated = new Date().toISOString().slice(0,10);
  res.json({ ok: true, project });
});

// Leads CRUD
app.get('/api/leads', authMiddleware, (req, res) => {
  res.json({ leads: leadsData });
});

app.post('/api/leads', authMiddleware, (req, res) => {
  let { name, phone, email, source = 'organic', status = 'new', projectSizeKw = 0, acquisition = null, owner = null } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  name = String(name).slice(0, 100);
  phone = phone ? String(phone).slice(0, 20) : '';
  email = email ? String(email).slice(0, 100) : '';
  projectSizeKw = toPosNumber(projectSizeKw, 0);
  const lead = {
    id: `l${Date.now()}`,
    name, phone, email, source, status, projectSizeKw,
    createdAt: new Date().toISOString(),
    acquisition: acquisition || null,
    owner: owner || null,
  };
  leadsData.unshift(lead);
  saveData();
  res.json({ lead });
});

app.put('/api/leads/:id', authMiddleware, (req, res) => {
  const idx = leadsData.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
  leadsData[idx] = { ...leadsData[idx], ...req.body };
  saveData();
  res.json({ lead: leadsData[idx] });
});

app.delete('/api/leads/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = leadsData.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
  const [removed] = leadsData.splice(idx, 1);
  saveData();
  res.json({ removed });
});

// Quotes simple create/list
app.get('/api/quotes', authMiddleware, (req, res) => {
  res.json({ quotes });
});

app.post('/api/quotes', authMiddleware, (req, res) => {
  const { leadId, projectId = null, items: quoteItems = [], status = 'draft', name = null } = req.body || {};
  const safeItems = (Array.isArray(quoteItems)? quoteItems: []).map((it)=> ({
    ...it,
    qty: toPosNumber(it.qty, 0),
    price: toPosNumber(it.price, 0),
  }))
  const amount = safeItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const q = { id: `q${Date.now()}`, leadId, projectId, items: quoteItems, status, amount, createdAt: new Date().toISOString() };
  if (name) q.name = String(name).slice(0, 120);
  quotes.unshift(q);
  saveData();
  res.json({ quote: q });
});

app.put('/api/quotes/:id', authMiddleware, (req, res) => {
  const idx = quotes.findIndex((q) => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Quote not found' });
  quotes[idx] = { ...quotes[idx], ...req.body };
  res.json({ quote: quotes[idx] });
});

// Convert quote to project
app.post('/api/quotes/:id/convert', authMiddleware, (req, res) => {
  const q = quotes.find((qq) => qq.id === req.params.id);
  if (!q) return res.status(404).json({ message: 'Quote not found' });
  const customerName = req.body?.customerName || `Project from ${q.leadId || 'quote'}`;
  const capacityKw = toPosNumber(req.body?.capacityKw, 0);
  const newProject = {
    id: `p${Date.now()}`,
    customerName,
    siteAddress: req.body?.siteAddress || 'To Assign',
    scheme: 'Rooftop Solar Subsidy Scheme (India)',
    capacityKw,
    status: 'not_started',
    installation: {
      installedItems: [],
      pendingItems: [],
      scheduledDate: '',
      installerName: 'To Assign',
      lastUpdated: new Date().toISOString().slice(0,10),
      steps: [
        { name: 'Site Survey', status: 'pending' },
        { name: 'Design & BOM', status: 'pending' },
        { name: 'Installation', status: 'pending' },
        { name: 'Net Metering', status: 'pending' },
      ],
    },
  };
  projects.unshift(newProject);
  q.status = 'accepted';
  q.projectId = newProject.id;
  saveData();
  res.json({ project: newProject, quote: q });
});

// Inventory and procurement
app.get('/api/items', authMiddleware, (req, res) => {
  const { page, size } = req.query || {};
  if (page || size) {
    const result = paginate(items, page, size);
    return res.json({ items: result.data, page: result.page, size: result.size, total: result.total });
  }
  res.json({ items });
});

app.post('/api/items', authMiddleware, (req, res) => {
  let { name, sku, unit = 'pcs', stock = 0, minStock = 0 } = req.body || {};
  if (!name || !sku) return res.status(400).json({ message: 'name and sku required' });
  name = String(name).slice(0, 120);
  sku = String(sku).slice(0, 60);
  const it = { id: `i${Date.now()}`, name, sku, unit, stock: toPosNumber(stock, 0), minStock: toPosNumber(minStock, 0) };
  items.push(it);
  saveData();
  logAudit(req, 'item', 'create', it.id, { name: it.name, sku: it.sku });
  res.json({ item: it });
});

// Update item details
app.put('/api/items/:id', authMiddleware, (req, res) => {
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Item not found' });
  const patch = { ...req.body };
  if (patch.name) patch.name = String(patch.name).slice(0, 120);
  if (patch.sku) patch.sku = String(patch.sku).slice(0, 60);
  if (patch.stock !== undefined) patch.stock = toPosNumber(patch.stock, items[idx].stock || 0);
  if (patch.minStock !== undefined) patch.minStock = toPosNumber(patch.minStock, items[idx].minStock || 0);
  items[idx] = { ...items[idx], ...patch };
  saveData();
  logAudit(req, 'item', 'update', items[idx].id, patch);
  res.json({ item: items[idx] });
});

// Delete item (admin only)
app.delete('/api/items/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Item not found' });
  const [removed] = items.splice(idx, 1);
  saveData();
  logAudit(req, 'item', 'delete', removed.id, { sku: removed.sku });
  res.json({ removed });
});

function calculatePoTotals(po) {
  const subtotal = (po.items || []).reduce((sum, ln) => sum + (Number(ln.qty)||0) * (Number(ln.unitPrice)||0), 0)
  const tax = (po.items || []).reduce((sum, ln) => {
    const base = (Number(ln.qty)||0) * (Number(ln.unitPrice)||0)
    return sum + base * ((Number(ln.taxPercent)||0) / 100)
  }, 0)
  const grandTotal = Math.round((subtotal + tax) * 100) / 100
  return { subtotal, tax, grandTotal }
}

app.get('/api/purchase-orders', authMiddleware, (req, res) => {
  const enriched = purchaseOrders.map((po) => ({ ...po, totals: calculatePoTotals(po) }))
  res.json({ purchaseOrders: enriched });
});

app.post('/api/purchase-orders', authMiddleware, (req, res) => {
  let { supplier = 'Vendor', lines = [], status = 'ordered' } = req.body || {};
  supplier = String(supplier).slice(0, 160);
  const normalized = (Array.isArray(lines)? lines: []).map((ln) => ({
    itemId: ln.itemId,
    qty: toPosNumber(ln.qty, 0),
    unitPrice: toPosNumber(ln.unitPrice, 0),
    taxPercent: clampTax(ln.taxPercent),
  }))
  const po = { id: `po${Date.now()}`, supplier, items: normalized, status, createdAt: new Date().toISOString() };
  po.totals = calculatePoTotals(po)
  purchaseOrders.unshift(po);
  saveData();
  res.json({ purchaseOrder: po });
});

// Receive PO -> increment stock
app.post('/api/purchase-orders/:id/receive', authMiddleware, (req, res) => {
  const po = purchaseOrders.find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ message: 'PO not found' });
  if (po.status === 'received') return res.status(400).json({ message: 'Already received' });
  po.items.forEach((line) => {
    const it = items.find((i) => i.id === line.itemId);
    if (it) it.stock += Number(line.qty) || 0;
  });
  po.status = 'received';
  saveData();
  logAudit(req, 'purchaseOrder', 'receive', po.id, { lines: po.items?.length||0 });
  res.json({ purchaseOrder: po, items });
});

// Documents attach/list
app.get('/api/documents', authMiddleware, (req, res) => {
  const { entityType, entityId } = req.query || {};
  const list = documents.filter((d) => (!entityType || d.entityType === entityType) && (!entityId || d.entityId === entityId));
  res.json({ documents: list });
});

app.post('/api/documents', authMiddleware, (req, res) => {
  const { entityType, entityId, title, url } = req.body || {};
  if (!entityType || !entityId || !url) return res.status(400).json({ message: 'entityType, entityId, url required' });
  if (!isSafeHttpUrl(url)) return res.status(400).json({ message: 'Invalid URL' });
  const doc = { id: `d${Date.now()}`, entityType, entityId, title: title||'Attachment', url, uploadedAt: new Date().toISOString() };
  documents.unshift(doc);
  saveData();
  res.json({ document: doc });
});

// Tasks
app.get('/api/tasks', authMiddleware, (req, res) => {
  const { projectId } = req.query || {};
  const list = projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  res.json({ tasks: list });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const { projectId, title, assignee = '', dueDate = '', status = 'open' } = req.body || {};
  if (!title) return res.status(400).json({ message: 'title required' });
  const task = { id: `t${Date.now()}`, projectId: projectId||null, title, assignee, dueDate, status };
  tasks.unshift(task);
  saveData();
  logAudit(req, 'task', 'create', task.id, { projectId: task.projectId });
  res.json({ task });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });
  tasks[idx] = { ...tasks[idx], ...req.body };
  saveData();
  logAudit(req, 'task', 'update', tasks[idx].id, req.body);
  res.json({ task: tasks[idx] });
});

// Attendance (HR)
app.get('/api/attendance', authMiddleware, (req, res) => {
  res.json({ attendance: attendanceRecord });
});

app.post('/api/attendance', authMiddleware, (req, res) => {
  const { date, present = 0, absent = 0 } = req.body || {};
  attendanceRecord = { date, present: Number(present)||0, absent: Number(absent)||0 };
  saveData();
  res.json({ attendance: attendanceRecord });
});

// Announcements
app.get('/api/announcements', authMiddleware, (req, res) => {
  const now = new Date().toISOString().slice(0,10)
  const list = announcements.filter((a)=> (!a.startsAt || a.startsAt<=now) && (!a.endsAt || a.endsAt>=now))
  res.json({ announcements: list })
})

app.post('/api/announcements', authMiddleware, requireRole('admin'), (req, res) => {
  const { title, body, audience = 'all', startsAt = null, endsAt = null, active = true } = req.body || {}
  if (!title || !body) return res.status(400).json({ message: 'title and body required' })
  const a = { id: `a${Date.now()}`, title, body, audience, startsAt, endsAt, active, createdBy: req.user?.email||'admin' }
  announcements.unshift(a)
  saveData();
  res.json({ announcement: a })
})

app.put('/api/announcements/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = announcements.findIndex((x)=> x.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Announcement not found' })
  announcements[idx] = { ...announcements[idx], ...req.body }
  saveData();
  res.json({ announcement: announcements[idx] })
})

// Service tickets
app.get('/api/service-tickets', authMiddleware, (req, res) => {
  const { projectId, leadId } = req.query || {};
  const list = serviceTickets.filter((t) => (!projectId || t.projectId === projectId) && (!leadId || t.leadId === leadId));
  res.json({ tickets: list });
});

app.post('/api/service-tickets', authMiddleware, (req, res) => {
  const { projectId = null, leadId = null, title, priority = 'low', assignedTo = '' } = req.body || {};
  if (!title) return res.status(400).json({ message: 'title required' });
  const ticket = { id: `svc${Date.now()}`, projectId, leadId, title, priority, status: 'open', assignedTo, createdAt: new Date().toISOString() };
  serviceTickets.unshift(ticket);
  saveData();
  res.json({ ticket });
});

app.put('/api/service-tickets/:id', authMiddleware, (req, res) => {
  const idx = serviceTickets.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Ticket not found' });
  serviceTickets[idx] = { ...serviceTickets[idx], ...req.body };
  saveData();
  res.json({ ticket: serviceTickets[idx] });
});

// Invoices
function calculateInvoiceTotals(inv) {
  const subtotal = (inv.items || []).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0)
  const tax = (inv.items || []).reduce((s, it) => {
    const base = (Number(it.qty)||0)*(Number(it.price)||0)
    return s + base*((Number(it.taxPercent)||0)/100)
  }, 0)
  const grandTotal = Math.round((subtotal + tax) * 100) / 100
  return { subtotal, tax, grandTotal }
}

app.get('/api/invoices', authMiddleware, (req, res) => {
  const enriched = invoices.map((inv) => ({ ...inv, totals: calculateInvoiceTotals(inv) }))
  res.json({ invoices: enriched });
});

app.post('/api/invoices', authMiddleware, (req, res) => {
  const { quoteId = null, customerName = 'Customer', amount = 0, status = 'draft', items = null } = req.body || {};
  let invItems = Array.isArray(items) ? items.map((it)=> ({
    description: it.description || it.name || 'Item',
    qty: toPosNumber(it.qty, 0),
    price: toPosNumber(it.price, 0),
    taxPercent: clampTax(it.taxPercent),
  })) : null

  // If items not provided but quoteId present, try deriving from quote
  if (!invItems && quoteId) {
    const q = quotes.find((qq)=> qq.id === quoteId)
    if (q) {
      invItems = (q.items||[]).map((ln)=> ({ description: ln.name || 'Item', qty: Number(ln.qty)||0, price: Number(ln.price)||0, taxPercent: 18 }))
    }
  }

  const inv = { id: `inv${Date.now()}`, quoteId, customerName, items: invItems || [], status, createdAt: new Date().toISOString() };
  const totals = calculateInvoiceTotals(inv)
  // keep a legacy amount mirror for older clients if needed
  inv.amount = totals.grandTotal
  invoices.unshift(inv);
  saveData();
  res.json({ invoice: { ...inv, totals } });
});

app.put('/api/invoices/:id', authMiddleware, (req, res) => {
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Invoice not found' });
  invoices[idx] = { ...invoices[idx], ...req.body };
  saveData();
  res.json({ invoice: invoices[idx] });
});

app.listen(PORT, () => {
  console.log(`Prefuel Energy API listening on http://localhost:${PORT}`);
});


