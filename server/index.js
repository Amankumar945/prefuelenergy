const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'prefuel_energy_dev_secret_please_change';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
  },
];

const items = [
  { id: 'i1', name: 'Solar Panel 500W', sku: 'SP-500', unit: 'pcs', stock: 40, minStock: 20 },
  { id: 'i2', name: 'String Inverter 5kW', sku: 'INV-5K', unit: 'unit', stock: 6, minStock: 4 },
  { id: 'i3', name: 'Mounting Structure', sku: 'MS-SET', unit: 'set', stock: 10, minStock: 5 },
];

const purchaseOrders = [
  // { id, supplier, items:[{itemId, qty}], status: pending|ordered|received, createdAt }
];

const quotes = [
  // { id, leadId, projectId, amount, status: draft|sent|accepted|rejected, items:[{itemId, qty, price}], createdAt }
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
  // { id, quoteId, customerName, amount, status: 'draft'|'sent'|'paid', createdAt }
];

// Helpers
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
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

app.post('/api/auth/login', (req, res) => {
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
  const { steps, installerName, scheduledDate, installedItems, pendingItems, status } = req.body || {};
  if (steps) project.installation.steps = steps;
  if (installerName) project.installation.installerName = installerName;
  if (scheduledDate) project.installation.scheduledDate = scheduledDate;
  if (Array.isArray(installedItems)) project.installation.installedItems = installedItems;
  if (Array.isArray(pendingItems)) project.installation.pendingItems = pendingItems;
  if (status) project.status = status;
  project.installation.lastUpdated = new Date().toISOString().slice(0,10);
  res.json({ ok: true, project });
});

// Leads CRUD
app.get('/api/leads', authMiddleware, (req, res) => {
  res.json({ leads: leadsData });
});

app.post('/api/leads', authMiddleware, (req, res) => {
  const { name, phone, email, source = 'organic', status = 'new', projectSizeKw = 0 } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const lead = {
    id: `l${Date.now()}`,
    name, phone, email, source, status, projectSizeKw,
    createdAt: new Date().toISOString(),
  };
  leadsData.unshift(lead);
  res.json({ lead });
});

app.put('/api/leads/:id', authMiddleware, (req, res) => {
  const idx = leadsData.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
  leadsData[idx] = { ...leadsData[idx], ...req.body };
  res.json({ lead: leadsData[idx] });
});

app.delete('/api/leads/:id', authMiddleware, (req, res) => {
  const idx = leadsData.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
  const [removed] = leadsData.splice(idx, 1);
  res.json({ removed });
});

// Quotes simple create/list
app.get('/api/quotes', authMiddleware, (req, res) => {
  res.json({ quotes });
});

app.post('/api/quotes', authMiddleware, (req, res) => {
  const { leadId, projectId = null, items: quoteItems = [], status = 'draft' } = req.body || {};
  const amount = quoteItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const q = { id: `q${Date.now()}`, leadId, projectId, items: quoteItems, status, amount, createdAt: new Date().toISOString() };
  quotes.unshift(q);
  res.json({ quote: q });
});

app.put('/api/quotes/:id', authMiddleware, (req, res) => {
  const idx = quotes.findIndex((q) => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Quote not found' });
  quotes[idx] = { ...quotes[idx], ...req.body };
  res.json({ quote: quotes[idx] });
});

// Inventory and procurement
app.get('/api/items', authMiddleware, (req, res) => {
  res.json({ items });
});

app.post('/api/items', authMiddleware, (req, res) => {
  const { name, sku, unit = 'pcs', stock = 0, minStock = 0 } = req.body || {};
  if (!name || !sku) return res.status(400).json({ message: 'name and sku required' });
  const it = { id: `i${Date.now()}`, name, sku, unit, stock: Number(stock)||0, minStock: Number(minStock)||0 };
  items.push(it);
  res.json({ item: it });
});

app.get('/api/purchase-orders', authMiddleware, (req, res) => {
  res.json({ purchaseOrders });
});

app.post('/api/purchase-orders', authMiddleware, (req, res) => {
  const { supplier = 'Vendor', lines = [], status = 'ordered' } = req.body || {};
  const po = { id: `po${Date.now()}`, supplier, items: lines, status, createdAt: new Date().toISOString() };
  purchaseOrders.unshift(po);
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
  const doc = { id: `d${Date.now()}`, entityType, entityId, title: title||'Attachment', url, uploadedAt: new Date().toISOString() };
  documents.unshift(doc);
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
  res.json({ task });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });
  tasks[idx] = { ...tasks[idx], ...req.body };
  res.json({ task: tasks[idx] });
});

// Attendance (HR)
app.get('/api/attendance', authMiddleware, (req, res) => {
  res.json({ attendance: attendanceRecord });
});

app.post('/api/attendance', authMiddleware, (req, res) => {
  const { date, present = 0, absent = 0 } = req.body || {};
  attendanceRecord = { date, present: Number(present)||0, absent: Number(absent)||0 };
  res.json({ attendance: attendanceRecord });
});

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
  res.json({ ticket });
});

app.put('/api/service-tickets/:id', authMiddleware, (req, res) => {
  const idx = serviceTickets.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Ticket not found' });
  serviceTickets[idx] = { ...serviceTickets[idx], ...req.body };
  res.json({ ticket: serviceTickets[idx] });
});

// Invoices
app.get('/api/invoices', authMiddleware, (req, res) => {
  res.json({ invoices });
});

app.post('/api/invoices', authMiddleware, (req, res) => {
  const { quoteId = null, customerName = 'Customer', amount = 0, status = 'draft' } = req.body || {};
  const inv = { id: `inv${Date.now()}`, quoteId, customerName, amount: Number(amount)||0, status, createdAt: new Date().toISOString() };
  invoices.unshift(inv);
  res.json({ invoice: inv });
});

app.put('/api/invoices/:id', authMiddleware, (req, res) => {
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Invoice not found' });
  invoices[idx] = { ...invoices[idx], ...req.body };
  res.json({ invoice: invoices[idx] });
});

app.listen(PORT, () => {
  console.log(`Prefuel Energy API listening on http://localhost:${PORT}`);
});


