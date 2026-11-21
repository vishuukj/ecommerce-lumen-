// Lumen Store - zero-dependency Node.js server
// Serves the storefront SPA (/), the admin panel (/admin) and a JSON REST API (/api).
// All data (products, categories, users, orders, reviews, admin) is persisted to data/db.json.
// data/catalog.js is only used to seed the database the first time the server starts.

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const seed = require('./data/catalog');

const PORT = Number(process.env.PORT) || 3000;
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'lumen-uploads') : path.join(PUBLIC_DIR, 'uploads');
const DB_FILE = IS_SERVERLESS ? path.join(os.tmpdir(), 'lumen-db.json') : path.join(__dirname, 'data', 'db.json');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_TTL = 12 * 60 * 60 * 1000; // 12 hours

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function loadDb() {
  for (const f of [DB_FILE, path.join(__dirname, 'data', 'db.json')]) {
    try {
      return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch { /* next */ }
  }
  return {};
}
const db = loadDb();
db.users ??= [];
db.sessions ??= {};
db.orders ??= [];
db.reviews ??= {};
db.adminSessions ??= {};
if (!db.categories) db.categories = seed.categories.map((c) => ({ ...c }));
if (!db.products) {
  // First run (or upgrade from the old format): seed products, applying any old stock overrides.
  db.products = seed.products.map((p) => ({ ...p, stock: db.stock?.[p.id] ?? p.stock, createdAt: new Date().toISOString() }));
}
delete db.stock;
for (const o of db.orders) if (!o.statusHistory) o.statusHistory = [{ status: o.status, at: o.createdAt }];

let saveTimer = null;
function saveDb() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.warn('Could not persist db file:', err.message);
    }
  }, 50);
}

const findProduct = (id) => db.products.find((x) => x.id === id);
const activeProducts = () => db.products.filter((p) => !p.hidden);

// Seed a few reviews per product so product pages feel alive.
const REVIEW_SEED = [
  ['Aarav S.', 5, 'Absolutely love it! Quality is outstanding for the price.'],
  ['Priya M.', 4, 'Very good product, delivery was quick. Packaging could be better.'],
  ['Rohan K.', 5, 'Exceeded my expectations. Would definitely recommend to friends.'],
  ['Sneha T.', 4, 'Looks premium and works great. Minor issues but overall happy.'],
  ['Vikram P.', 3, 'Decent product. Does the job but nothing extraordinary.'],
  ['Ananya R.', 5, 'Perfect! Exactly as described and shown in the pictures.'],
];
function reviewsFor(id) {
  if (!db.reviews[id]) {
    const isSeed = seed.products.some((p) => p.id === id);
    const n = parseInt(id.replace(/\D/g, '').slice(-2), 10) || 0;
    db.reviews[id] = isSeed ? [0, 1, 2, 3].map((i) => {
      const [name, rating, text] = REVIEW_SEED[(n + i) % REVIEW_SEED.length];
      return {
        id: crypto.randomUUID(), name, rating, text, verified: true,
        date: new Date(Date.now() - (i + 1) * 86400000 * (3 + (n % 5))).toISOString(),
      };
    }) : [];
  }
  return db.reviews[id];
}

// ---------------------------------------------------------------------------
// Pricing (authoritative - the client never decides what it pays)
// ---------------------------------------------------------------------------
const COUPONS = {
  WELCOME10: { label: '10% off (max ₹1,000)', apply: (s) => Math.min(Math.round(s * 0.1), 1000) },
  FLAT500: { label: '₹500 off on orders above ₹4,999', min: 4999, apply: () => 500 },
  FREESHIP: { label: 'Free shipping', freeShipping: true, apply: () => 0 },
};
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_RATES = { standard: 79, express: 149 };

function priceCart(items, couponCode, shippingMethod = 'standard') {
  const lines = [];
  for (const it of items || []) {
    const p = findProduct(it.id);
    if (!p || p.hidden) throw httpError(400, 'An item in your cart is no longer available. Please remove it and try again.');
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (p.stock <= 0) throw httpError(409, `"${p.title}" is out of stock`);
    if (qty > p.stock) throw httpError(409, `Only ${p.stock} left of "${p.title}"`);
    lines.push({ id: p.id, title: p.title, image: p.images[0] || '', price: p.price, qty, color: it.color || null, size: it.size || null, lineTotal: p.price * qty });
  }
  if (!lines.length) throw httpError(400, 'Your cart is empty');
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const c = COUPONS[code];
    if (!c) throw httpError(400, 'Invalid coupon code');
    if (c.min && subtotal < c.min) throw httpError(400, `Add ₹${(c.min - subtotal).toLocaleString('en-IN')} more to use ${code}`);
    discount = c.apply(subtotal);
    coupon = { code, label: c.label, freeShipping: !!c.freeShipping };
  }

  const method = SHIPPING_RATES[shippingMethod] ? shippingMethod : 'standard';
  let shipping = 0;
  if (method === 'express') shipping = SHIPPING_RATES.express;
  else if (subtotal - discount < FREE_SHIPPING_THRESHOLD) shipping = SHIPPING_RATES.standard;
  if (coupon?.freeShipping) shipping = 0;

  return { lines, subtotal, discount, coupon, shippingMethod: method, shipping, total: subtotal - discount + shipping };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}
if (!db.admin) {
  db.admin = { password: hashPassword(DEFAULT_ADMIN_PASSWORD), isDefault: !process.env.ADMIN_PASSWORD };
  saveDb();
}

const USER_SESSION_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

function createSession(userId, req) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.sessions[token] = {
    userId,
    created: now,
    expires: now + USER_SESSION_TTL,
    ua: String(req?.headers['user-agent'] || '').slice(0, 120),
    ip: req?.socket?.remoteAddress || '',
  };
  saveDb();
  return token;
}
const bearer = (req) => /^Bearer (\w+)$/.exec(req.headers.authorization || '')?.[1] || null;
function currentUser(req) {
  const token = bearer(req);
  const s = token && db.sessions[token];
  if (!s) return null;
  if (s.expires && s.expires < Date.now()) {
    delete db.sessions[token];
    saveDb();
    return null;
  }
  return db.users.find((u) => u.id === s.userId) || null;
}
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', addresses: u.addresses || [], created: u.created });

function requireAdmin(req) {
  const token = bearer(req);
  const s = token && db.adminSessions[token];
  if (!s || s.expires < Date.now()) {
    if (s) { delete db.adminSessions[token]; saveDb(); }
    throw httpError(401, 'Admin session expired. Please sign in again.');
  }
}

// Simple brute-force protection for the admin login.
const loginAttempts = new Map(); // ip -> { count, until }
function checkRateLimit(ip) {
  const a = loginAttempts.get(ip);
  if (a?.until > Date.now()) throw httpError(429, `Too many attempts. Try again in ${Math.ceil((a.until - Date.now()) / 60000)} min.`);
}
function recordFailure(ip) {
  const a = loginAttempts.get(ip) || { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= 5) { a.until = Date.now() + 15 * 60 * 1000; a.count = 0; }
  loginAttempts.set(ip, a);
}

// ---------------------------------------------------------------------------
// Product validation (admin)
// ---------------------------------------------------------------------------
const TAGS = ['new', 'deal', 'bestseller'];
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
function validateProduct(b, existing = {}) {
  const errors = {};
  const p = {
    title: str(b.title, 120),
    brand: str(b.brand, 60),
    category: str(b.category, 40),
    price: Math.round(Number(b.price)),
    mrp: Math.round(Number(b.mrp)),
    stock: Math.floor(Number(b.stock)),
    rating: b.rating === '' || b.rating == null ? (existing.rating ?? 0) : Math.round(Number(b.rating) * 10) / 10,
    reviews: b.reviews === '' || b.reviews == null ? (existing.reviews ?? 0) : Math.floor(Number(b.reviews)),
    tags: (Array.isArray(b.tags) ? b.tags : []).filter((t) => TAGS.includes(t)),
    images: (Array.isArray(b.images) ? b.images : []).map((u) => str(u, 500)).filter(Boolean).slice(0, 8),
    colors: (Array.isArray(b.colors) ? b.colors : []).map((c) => str(c, 9)).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 8),
    sizes: (Array.isArray(b.sizes) ? b.sizes : []).map((s) => str(s, 10)).filter(Boolean).slice(0, 15),
    description: str(b.description, 2000),
    features: (Array.isArray(b.features) ? b.features : []).map((f) => str(f, 200)).filter(Boolean).slice(0, 12),
    specs: {},
    hidden: !!b.hidden,
  };
  if (b.specs && typeof b.specs === 'object') {
    for (const [k, v] of Object.entries(b.specs).slice(0, 20)) if (str(k) && str(v)) p.specs[str(k, 60)] = str(v, 200);
  }
  if (p.title.length < 3) errors.title = 'Title must be at least 3 characters';
  if (!p.brand) errors.brand = 'Brand is required';
  if (!db.categories.some((c) => c.id === p.category)) errors.category = 'Choose a valid category';
  if (!(p.price > 0)) errors.price = 'Price must be greater than 0';
  if (!(p.mrp > 0)) errors.mrp = 'MRP must be greater than 0';
  else if (p.mrp < p.price) errors.mrp = 'MRP cannot be lower than the selling price';
  if (!(p.stock >= 0) || p.stock > 100000) errors.stock = 'Stock must be between 0 and 100,000';
  if (!(p.rating >= 0 && p.rating <= 5)) errors.rating = 'Rating must be between 0 and 5';
  if (!(p.reviews >= 0)) errors.reviews = 'Review count cannot be negative';
  if (!p.images.length) errors.images = 'Add at least one image';
  if (p.images.some((u) => !/^(https?:\/\/|\/uploads\/)/.test(u))) errors.images = 'Images must be http(s) URLs or uploaded files';
  if (p.description.length < 10) errors.description = 'Description must be at least 10 characters';
  if (Object.keys(errors).length) throw Object.assign(httpError(400, 'Please fix the highlighted fields'), { fields: errors });
  if (!p.sizes.length) delete p.sizes;
  return p;
}
function nextProductId() {
  const max = db.products.reduce((m, p) => Math.max(m, parseInt(p.id.replace(/\D/g, ''), 10) || 0), 1000);
  return 'p' + (max + 1);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function readBody(req, limit = 1e6) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try { return Promise.resolve(req.body ? JSON.parse(req.body) : {}); } catch { return Promise.reject(httpError(400, 'Invalid JSON')); }
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(httpError(413, 'Payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(httpError(400, 'Invalid JSON')); }
    });
  });
}
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));
const ORDER_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

function setOrderStatus(order, status) {
  if (order.status === status) return;
  const restock = status === 'cancelled' && order.status !== 'cancelled';
  const unRestock = order.status === 'cancelled' && status !== 'cancelled';
  for (const l of order.items) {
    const prod = findProduct(l.id);
    if (!prod) continue;
    if (restock) prod.stock += l.qty;
    if (unRestock) prod.stock = Math.max(0, prod.stock - l.qty);
  }
  order.status = status;
  order.statusHistory.push({ status, at: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Admin API routes
// ---------------------------------------------------------------------------
async function handleAdmin(req, res, p, method) {
  const ip = req.socket.remoteAddress;

  if (method === 'POST' && p === '/api/admin/login') {
    checkRateLimit(ip);
    const { password } = await readBody(req);
    if (!password || !verifyPassword(String(password), db.admin.password)) {
      recordFailure(ip);
      throw httpError(401, 'Incorrect password');
    }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    db.adminSessions[token] = { created: Date.now(), expires: Date.now() + ADMIN_SESSION_TTL };
    saveDb();
    return send(res, 200, { token, isDefaultPassword: !!db.admin.isDefault });
  }

  requireAdmin(req);

  if (method === 'GET' && p === '/api/admin/me') return send(res, 200, { ok: true, isDefaultPassword: !!db.admin.isDefault });

  if (method === 'POST' && p === '/api/admin/logout') {
    delete db.adminSessions[bearer(req)];
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/admin/password') {
    const { current, next } = await readBody(req);
    if (!verifyPassword(String(current || ''), db.admin.password)) throw httpError(400, 'Current password is incorrect');
    if (!next || String(next).length < 8) throw httpError(400, 'New password must be at least 8 characters');
    db.admin = { password: hashPassword(String(next)), isDefault: false };
    const keep = bearer(req);
    db.adminSessions = { [keep]: db.adminSessions[keep] }; // sign out other admin sessions
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (method === 'GET' && p === '/api/admin/stats') {
    const live = db.orders.filter((o) => o.status !== 'cancelled');
    const revenue = live.reduce((s, o) => s + o.total, 0);
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const dayOrders = live.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
      return { date: d.toISOString(), revenue: dayOrders.reduce((s, o) => s + o.total, 0), orders: dayOrders.length };
    });
    const sold = {};
    live.forEach((o) => o.items.forEach((l) => { sold[l.id] = (sold[l.id] || 0) + l.qty; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, qty]) => { const pr = findProduct(id); return { id, qty, title: pr?.title || '(deleted product)', image: pr?.images[0] || '' }; });
    return send(res, 200, {
      revenue,
      orders: db.orders.length,
      pendingOrders: db.orders.filter((o) => ['confirmed', 'packed'].includes(o.status)).length,
      customers: db.users.length,
      products: db.products.length,
      lowStock: db.products.filter((x) => x.stock > 0 && x.stock <= 10).map((x) => ({ id: x.id, title: x.title, stock: x.stock, image: x.images[0] })),
      outOfStock: db.products.filter((x) => x.stock <= 0).length,
      days, top,
      recentOrders: db.orders.slice(-6).reverse(),
    });
  }

  if (method === 'GET' && p === '/api/admin/products') {
    return send(res, 200, db.products.slice().reverse());
  }

  if (method === 'POST' && p === '/api/admin/products') {
    const data = validateProduct(await readBody(req));
    const product = { id: nextProductId(), ...data, createdAt: new Date().toISOString() };
    db.products.push(product);
    saveDb();
    return send(res, 201, product);
  }

  let m = /^\/api\/admin\/products\/(\w+)$/.exec(p);
  if (m && method === 'PUT') {
    const prod = findProduct(m[1]);
    if (!prod) throw httpError(404, 'Product not found');
    const data = validateProduct(await readBody(req), prod);
    if (!data.sizes) delete prod.sizes;
    Object.assign(prod, data, { updatedAt: new Date().toISOString() });
    saveDb();
    return send(res, 200, prod);
  }
  if (m && method === 'DELETE') {
    const idx = db.products.findIndex((x) => x.id === m[1]);
    if (idx < 0) throw httpError(404, 'Product not found');
    const [removed] = db.products.splice(idx, 1);
    delete db.reviews[removed.id];
    saveDb();
    return send(res, 200, { ok: true });
  }

  m = /^\/api\/admin\/products\/(\w+)\/stock$/.exec(p);
  if (m && method === 'PATCH') {
    const prod = findProduct(m[1]);
    if (!prod) throw httpError(404, 'Product not found');
    const { stock, delta } = await readBody(req);
    const next = delta != null ? prod.stock + Math.trunc(Number(delta)) : Math.trunc(Number(stock));
    if (!Number.isFinite(next) || next < 0 || next > 100000) throw httpError(400, 'Stock must be between 0 and 100,000');
    prod.stock = next;
    saveDb();
    return send(res, 200, { id: prod.id, stock: prod.stock });
  }

  if (method === 'POST' && p === '/api/admin/categories') {
    const { name, icon, color } = await readBody(req);
    const nm = str(name, 40);
    if (nm.length < 2) throw httpError(400, 'Category name is required');
    const id = nm.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || db.categories.some((c) => c.id === id)) throw httpError(409, 'That category already exists');
    const cat = { id, name: nm, icon: str(icon, 8) || '🛍️', color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#6366f1' };
    db.categories.push(cat);
    saveDb();
    return send(res, 201, cat);
  }

  m = /^\/api\/admin\/categories\/([\w-]+)$/.exec(p);
  if (m && method === 'DELETE') {
    if (db.products.some((x) => x.category === m[1])) throw httpError(400, 'Move or delete the products in this category first');
    db.categories = db.categories.filter((c) => c.id !== m[1]);
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/admin/upload') {
    const { data } = await readBody(req, 8 * 1024 * 1024);
    const match = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(String(data || ''));
    if (!match) throw httpError(400, 'Only PNG, JPG, WEBP or GIF images are allowed');
    const buf = Buffer.from(match[3], 'base64');
    if (buf.length > 5 * 1024 * 1024) throw httpError(413, 'Image must be smaller than 5 MB');
    const sig = buf.subarray(0, 12).toString('hex');
    const okSig = { png: sig.startsWith('89504e47'), jpeg: sig.startsWith('ffd8ff'), gif: sig.startsWith('47494638'), webp: sig.startsWith('52494646') && sig.slice(16, 24) === '57454250' };
    if (!okSig[match[2]]) throw httpError(400, 'File content does not match an image type');
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${match[2] === 'jpeg' ? 'jpg' : match[2]}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return send(res, 201, { url: '/uploads/' + name });
  }

  if (method === 'GET' && p === '/api/admin/orders') {
    return send(res, 200, db.orders.slice().reverse());
  }

  m = /^\/api\/admin\/orders\/(\w+)$/.exec(p);
  if (m && method === 'PATCH') {
    const order = db.orders.find((o) => o.id === m[1]);
    if (!order) throw httpError(404, 'Order not found');
    const { status } = await readBody(req);
    if (!ORDER_STATUSES.includes(status)) throw httpError(400, 'Invalid status');
    setOrderStatus(order, status);
    if (status === 'delivered' && order.payment.method === 'cod') order.payment.status = 'paid';
    saveDb();
    return send(res, 200, order);
  }

  throw httpError(404, 'Admin route not found');
}

// ---------------------------------------------------------------------------
// Storefront API routes
// ---------------------------------------------------------------------------
async function handleApi(req, res, url) {
  const p = url.pathname;
  const q = url.searchParams;
  const method = req.method;

  if (p.startsWith('/api/admin/')) return handleAdmin(req, res, p, method);

  if (method === 'GET' && p === '/api/categories') {
    const live = activeProducts();
    return send(res, 200, db.categories.map((c) => ({ ...c, count: live.filter((x) => x.category === c.id).length })));
  }

  if (method === 'GET' && p === '/api/products') {
    let list = activeProducts();
    const term = (q.get('q') || '').trim().toLowerCase();
    if (term) {
      list = list.filter((x) => [x.title, x.brand, x.category, x.description].join(' ').toLowerCase().includes(term));
    }
    const cats = q.getAll('category').flatMap((c) => c.split(',')).filter(Boolean);
    if (cats.length) list = list.filter((x) => cats.includes(x.category));
    const brands = q.getAll('brand').flatMap((c) => c.split(',')).filter(Boolean);
    if (brands.length) list = list.filter((x) => brands.includes(x.brand));
    if (q.get('tag')) list = list.filter((x) => x.tags.includes(q.get('tag')));
    if (q.get('min')) list = list.filter((x) => x.price >= Number(q.get('min')));
    if (q.get('max')) list = list.filter((x) => x.price <= Number(q.get('max')));
    if (q.get('rating')) list = list.filter((x) => x.rating >= Number(q.get('rating')));
    if (q.get('inStock') === '1') list = list.filter((x) => x.stock > 0);
    if (q.get('ids')) {
      const ids = q.get('ids').split(',');
      list = list.filter((x) => ids.includes(x.id));
    }

    const sorters = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp,
      popular: (a, b) => b.reviews - a.reviews,
      newest: (a, b) => (b.tags.includes('new') - a.tags.includes('new')) || String(b.createdAt).localeCompare(String(a.createdAt)) || b.id.localeCompare(a.id),
    };
    list = list.slice();
    if (sorters[q.get('sort')]) list.sort(sorters[q.get('sort')]);

    const total = list.length;
    const limit = Math.min(48, Math.max(1, Number(q.get('limit')) || 12));
    const page = Math.max(1, Number(q.get('page')) || 1);
    const items = list.slice((page - 1) * limit, page * limit);
    const all = activeProducts();
    const prices = all.map((x) => x.price);
    return send(res, 200, {
      items, total, page, pages: Math.max(1, Math.ceil(total / limit)),
      facets: { brands: [...new Set(all.map((x) => x.brand))].sort(), minPrice: prices.length ? Math.min(...prices) : 0, maxPrice: prices.length ? Math.max(...prices) : 1000 },
    });
  }

  if (method === 'GET' && p === '/api/search/suggest') {
    const term = (q.get('q') || '').trim().toLowerCase();
    if (!term) return send(res, 200, []);
    const hits = activeProducts()
      .filter((x) => (x.title + ' ' + x.brand + ' ' + x.category).toLowerCase().includes(term))
      .slice(0, 6)
      .map((x) => ({ id: x.id, title: x.title, price: x.price, image: x.images[0], category: x.category }));
    return send(res, 200, hits);
  }

  let m = /^\/api\/products\/(\w+)$/.exec(p);
  if (method === 'GET' && m) {
    const prod = findProduct(m[1]);
    if (!prod || prod.hidden) throw httpError(404, 'Product not found');
    const related = activeProducts().filter((x) => x.category === prod.category && x.id !== prod.id).slice(0, 8);
    return send(res, 200, { product: prod, related, reviews: reviewsFor(prod.id) });
  }

  m = /^\/api\/products\/(\w+)\/reviews$/.exec(p);
  if (method === 'POST' && m) {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Please sign in to write a review');
    const prod = findProduct(m[1]);
    if (!prod) throw httpError(404, 'Product not found');
    const { rating, text } = await readBody(req);
    const r = Number(rating);
    if (!(r >= 1 && r <= 5)) throw httpError(400, 'Rating must be between 1 and 5');
    if (!text || String(text).trim().length < 5) throw httpError(400, 'Review must be at least 5 characters');
    const verified = db.orders.some((o) => o.userId === user.id && o.items.some((l) => l.id === prod.id));
    const review = { id: crypto.randomUUID(), name: user.name, rating: r, text: String(text).trim().slice(0, 1000), verified, date: new Date().toISOString() };
    reviewsFor(prod.id).unshift(review);
    saveDb();
    return send(res, 201, review);
  }

  if (method === 'POST' && p === '/api/cart/quote') {
    const { items, coupon, shippingMethod } = await readBody(req);
    return send(res, 200, priceCart(items, coupon, shippingMethod));
  }

  if (method === 'POST' && p === '/api/auth/register') {
    const ip = 'u:' + req.socket.remoteAddress;
    checkRateLimit(ip);
    const { name, email, password, phone } = await readBody(req);
    if (!name || String(name).trim().length < 2) throw httpError(400, 'Please enter your full name');
    if (!isEmail(email)) throw httpError(400, 'Please enter a valid email address');
    if (!password || String(password).length < 6) throw httpError(400, 'Password must be at least 6 characters');
    const ph = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    if (ph && !/^[6-9]\d{9}$/.test(ph)) throw httpError(400, 'Enter a valid 10-digit mobile number');
    const em = String(email).toLowerCase().trim();
    if (db.users.some((u) => u.email === em)) throw httpError(409, 'An account with this email already exists');
    const user = { id: crypto.randomUUID(), name: String(name).trim(), email: em, phone: ph, addresses: [], password: hashPassword(String(password)), created: new Date().toISOString() };
    db.users.push(user);
    const token = createSession(user.id, req);
    return send(res, 201, { token, user: publicUser(user) });
  }

  if (method === 'POST' && p === '/api/auth/login') {
    const ip = 'u:' + req.socket.remoteAddress;
    checkRateLimit(ip);
    const { email, password } = await readBody(req);
    const user = db.users.find((u) => u.email === String(email || '').toLowerCase().trim());
    if (!user || !verifyPassword(String(password || ''), user.password)) {
      recordFailure(ip);
      throw httpError(401, 'Incorrect email or password');
    }
    loginAttempts.delete(ip);
    return send(res, 200, { token: createSession(user.id, req), user: publicUser(user) });
  }

  if (method === 'POST' && p === '/api/auth/otp/send') {
    const { email } = await readBody(req);
    if (!isEmail(email)) throw httpError(400, 'Enter a valid email address');
    const em = String(email).toLowerCase().trim();
    const code = String(crypto.randomInt(100000, 999999));
    db.otps ??= {};
    db.otps[em] = { code, expires: Date.now() + 5 * 60 * 1000, attempts: 0 };
    saveDb();
    return send(res, 200, { ok: true, demoOtp: code, expiresIn: 300 });
  }

  if (method === 'POST' && p === '/api/auth/otp/verify') {
    const { email, otp, name } = await readBody(req);
    const em = String(email || '').toLowerCase().trim();
    const entry = db.otps?.[em];
    if (!entry || entry.expires < Date.now()) throw httpError(400, 'OTP expired. Please request a new code.');
    entry.attempts += 1;
    if (entry.attempts > 5) { delete db.otps[em]; throw httpError(429, 'Too many failed OTP attempts. Request a new code.'); }
    if (String(otp || '').trim() !== entry.code) throw httpError(401, 'Invalid 6-digit OTP code');
    delete db.otps[em];
    let user = db.users.find((u) => u.email === em);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: String(name || em.split('@')[0]).trim(),
        email: em,
        phone: '',
        addresses: [],
        password: hashPassword(crypto.randomBytes(16).toString('hex')),
        created: new Date().toISOString(),
      };
      db.users.push(user);
    }
    return send(res, 200, { token: createSession(user.id, req), user: publicUser(user) });
  }

  if (method === 'POST' && p === '/api/auth/logout') {
    const t = bearer(req);
    if (t) { delete db.sessions[t]; saveDb(); }
    return send(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/auth/logout-all') {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Not signed in');
    const keep = bearer(req);
    for (const [tok, sess] of Object.entries(db.sessions)) {
      if (sess.userId === user.id && tok !== keep) delete db.sessions[tok];
    }
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (method === 'GET' && p === '/api/auth/me') {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Not signed in');
    const activeSessions = Object.values(db.sessions).filter((s) => s.userId === user.id && (!s.expires || s.expires > Date.now())).length;
    return send(res, 200, { user: publicUser(user), activeSessions });
  }

  if (method === 'PATCH' && p === '/api/auth/profile') {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Not signed in');
    const { name, phone, addresses } = await readBody(req);
    if (name !== undefined) {
      if (String(name).trim().length < 2) throw httpError(400, 'Name must be at least 2 characters');
      user.name = String(name).trim().slice(0, 80);
    }
    if (phone !== undefined) {
      const ph = String(phone).replace(/\D/g, '').slice(-10);
      if (ph && !/^[6-9]\d{9}$/.test(ph)) throw httpError(400, 'Enter a valid 10-digit mobile number');
      user.phone = ph;
    }
    if (Array.isArray(addresses)) {
      user.addresses = addresses.slice(0, 5).map((a) => ({
        id: a.id || crypto.randomUUID(),
        label: str(a.label || 'Home', 30),
        name: str(a.name, 80),
        phone: str(a.phone, 15),
        line1: str(a.line1, 160),
        line2: str(a.line2, 160),
        city: str(a.city, 60),
        state: str(a.state, 60),
        pincode: str(a.pincode, 10),
      }));
    }
    saveDb();
    return send(res, 200, { user: publicUser(user) });
  }

  if (method === 'POST' && p === '/api/auth/password') {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Not signed in');
    const { current, next } = await readBody(req);
    if (!verifyPassword(String(current || ''), user.password)) throw httpError(400, 'Current password is incorrect');
    if (!next || String(next).length < 6) throw httpError(400, 'New password must be at least 6 characters');
    user.password = hashPassword(String(next));
    const keep = bearer(req);
    for (const [tok, sess] of Object.entries(db.sessions)) {
      if (sess.userId === user.id && tok !== keep) delete db.sessions[tok];
    }
    saveDb();
    return send(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/payments/upi-verify') {
    const { upiId } = await readBody(req);
    const vpa = String(upiId || '').trim().toLowerCase();
    const m2 = /^([\w.\-]{2,})@([a-zA-Z]{2,})$/.exec(vpa);
    if (!m2) throw httpError(400, 'Enter a valid UPI ID (e.g. yourname@okicici)');
    const PSP_BANKS = {
      okaxis: 'Axis Bank (Google Pay)', okhdfcbank: 'HDFC Bank (Google Pay)', okicici: 'ICICI Bank (Google Pay)', oksbi: 'State Bank of India (Google Pay)',
      ybl: 'Yes Bank (PhonePe)', ibl: 'ICICI Bank (PhonePe)', axl: 'Axis Bank (PhonePe)',
      paytm: 'Paytm Payments Bank', ptyes: 'Yes Bank (Paytm)', ptaxis: 'Axis Bank (Paytm)',
      apl: 'Amazon Pay', upi: 'NPCI BHIM UPI', icici: 'ICICI Bank', sbi: 'State Bank of India', hdfcbank: 'HDFC Bank',
    };
    const rawName = m2[1].replace(/[._\-]+/g, ' ').replace(/\d+/g, '').trim() || 'Verified Customer';
    const holder = rawName.toUpperCase();
    const bank = PSP_BANKS[m2[2]] || `${m2[2].toUpperCase()} PSP Bank`;
    return send(res, 200, { verified: true, vpa, holder, bank });
  }

  if (method === 'POST' && p === '/api/orders') {
    const user = currentUser(req);
    const { items, coupon, shippingMethod, address, payment } = await readBody(req);
    const a = address || {};
    for (const f of ['name', 'phone', 'line1', 'city', 'state', 'pincode']) {
      if (!a[f] || !String(a[f]).trim()) throw httpError(400, `Address field "${f}" is required`);
    }
    if (!/^\d{10}$/.test(String(a.phone).replace(/\D/g, '').slice(-10))) throw httpError(400, 'Enter a valid 10-digit phone number');
    if (!/^\d{6}$/.test(String(a.pincode))) throw httpError(400, 'Enter a valid 6-digit PIN code');
    const email = user ? user.email : String(a.email || '').toLowerCase();
    if (!isEmail(email)) throw httpError(400, 'A valid email is required');
    const methodName = payment?.method;
    if (!['card', 'upi', 'netbanking', 'emi', 'cod'].includes(methodName)) throw httpError(400, 'Choose a valid payment method');

    const quote = priceCart(items, coupon, shippingMethod);
    if (methodName === 'cod' && quote.total > 50000) throw httpError(400, 'Cash on Delivery is available for orders up to ₹50,000');
    if (methodName === 'emi' && quote.total < 3000) throw httpError(400, 'Bank EMI is available on orders of ₹3,000 and above');

    // Simulated payment gateway processing - never store raw card numbers or PINs.
    const txnId = 'TXN' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const paymentInfo = { method: methodName, status: methodName === 'cod' ? 'pending' : 'paid', txnId, gateway: 'LumenPay 3DS2' };

    if (methodName === 'card') {
      const num = String(payment.cardNumber || '').replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(num)) throw httpError(400, 'Invalid card number');
      paymentInfo.last4 = num.slice(-4);
      paymentInfo.network = /^4/.test(num) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(num) ? 'Mastercard' : /^(60|65|81|82|508)/.test(num) ? 'RuPay' : /^3[47]/.test(num) ? 'AMEX' : 'CARD';
      paymentInfo.authMode = '3D Secure 2.0 OTP Verified';
    }
    if (methodName === 'upi') {
      const mode = payment.upiMode || 'vpa';
      if (mode === 'qr' || mode === 'intent') {
        paymentInfo.upiMode = mode;
        paymentInfo.upiApp = str(payment.upiApp || 'UPI QR Scan', 40);
        paymentInfo.upiId = str(payment.upiId || 'qr-verified@upi', 60);
      } else {
        if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(payment.upiId || ''))) throw httpError(400, 'Invalid UPI ID');
        paymentInfo.upiMode = 'vpa';
        paymentInfo.upiId = String(payment.upiId).toLowerCase();
      }
      paymentInfo.utr = String(Date.now()).slice(-12);
    }
    if (methodName === 'netbanking') {
      const BANKS = {
        HDFC: 'HDFC Bank', ICICI: 'ICICI Bank', SBI: 'State Bank of India', AXIS: 'Axis Bank',
        KOTAK: 'Kotak Mahindra Bank', PNB: 'Punjab National Bank', BOB: 'Bank of Baroda',
        INDUS: 'IndusInd Bank', YES: 'Yes Bank', IDFC: 'IDFC FIRST Bank',
      };
      const code = String(payment.bankCode || '').toUpperCase();
      if (!BANKS[code]) throw httpError(400, 'Please select a valid bank for NetBanking');
      paymentInfo.bankCode = code;
      paymentInfo.bankName = BANKS[code];
      paymentInfo.bankRef = code + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    if (methodName === 'emi') {
      const bank = str(payment.emiBank || 'HDFC Bank', 50);
      const months = Number(payment.emiMonths) || 3;
      if (![3, 6, 9, 12].includes(months)) throw httpError(400, 'Invalid EMI tenure');
      const num = String(payment.cardNumber || '').replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(num)) throw httpError(400, 'Enter a valid credit card number for EMI');
      const rate = months <= 6 ? 0 : 0.14;
      const monthly = rate === 0 ? Math.ceil(quote.total / months) : Math.ceil((quote.total * (1 + (rate * months) / 12)) / months);
      paymentInfo.emiBank = bank;
      paymentInfo.emiMonths = months;
      paymentInfo.emiMonthly = monthly;
      paymentInfo.noCost = rate === 0;
      paymentInfo.last4 = num.slice(-4);
    }

    for (const l of quote.lines) findProduct(l.id).stock -= l.qty;

    const days = quote.shippingMethod === 'express' ? 2 : 5;
    const now = new Date().toISOString();
    const order = {
      id: 'LMN' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(),
      userId: user?.id || null,
      email,
      items: quote.lines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      coupon: quote.coupon?.code || null,
      shipping: quote.shipping,
      shippingMethod: quote.shippingMethod,
      total: quote.total,
      address: { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode },
      payment: paymentInfo,
      status: 'confirmed',
      statusHistory: [{ status: 'confirmed', at: now }],
      createdAt: now,
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
    };
    db.orders.push(order);
    saveDb();
    return send(res, 201, order);
  }

  if (method === 'GET' && p === '/api/orders') {
    const user = currentUser(req);
    if (!user) throw httpError(401, 'Please sign in to view your orders');
    return send(res, 200, db.orders.filter((o) => o.userId === user.id).reverse());
  }

  m = /^\/api\/orders\/(\w+)$/.exec(p);
  if (method === 'GET' && m) {
    const order = db.orders.find((o) => o.id === m[1]);
    if (!order) throw httpError(404, 'Order not found');
    const user = currentUser(req);
    if (order.userId && (!user || user.id !== order.userId)) throw httpError(403, 'Not your order');
    return send(res, 200, order);
  }

  m = /^\/api\/orders\/(\w+)\/cancel$/.exec(p);
  if (method === 'POST' && m) {
    const user = currentUser(req);
    const order = db.orders.find((o) => o.id === m[1]);
    if (!order) throw httpError(404, 'Order not found');
    if (!user || order.userId !== user.id) throw httpError(403, 'Not your order');
    if (!['confirmed', 'packed'].includes(order.status)) throw httpError(400, 'This order can no longer be cancelled');
    setOrderStatus(order, 'cancelled');
    saveDb();
    return send(res, 200, order);
  }

  throw httpError(404, 'API route not found');
}

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
};
function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  const isUpload = pathname.startsWith('/uploads/');
  const baseDir = isUpload ? UPLOAD_DIR : PUBLIC_DIR;
  const relPath = isUpload ? pathname.slice('/uploads/'.length) : pathname;
  let filePath = path.normalize(path.join(baseDir, relPath));
  if (!filePath.startsWith(baseDir)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      if (isUpload) { res.writeHead(404); return res.end('Not found'); }
      filePath = path.join(PUBLIC_DIR, 'index.html'); // SPA fallback
    }
    fs.readFile(filePath, (err2, data) => {
      if (err2) { res.writeHead(404); return res.end('Not found'); }
      const headers = { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
      if (filePath.endsWith('admin.html')) headers['X-Frame-Options'] = 'DENY';
      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

// ---------------------------------------------------------------------------
async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  // Normalize Vercel rewrite paths if passed via __path query param
  const rewrittenPath = url.searchParams.get('__path');
  if (rewrittenPath) {
    url.pathname = rewrittenPath.startsWith('/') ? rewrittenPath : '/' + rewrittenPath;
    url.searchParams.delete('__path');
  }
  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url);
    } catch (e) {
      if (!e.status) console.error(e);
      send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong', ...(e.fields ? { fields: e.fields } : {}) });
    }
    return;
  }
  serveStatic(req, res, url);
}

const server = http.createServer(requestHandler);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n  🛍️  Lumen Store running at http://localhost:${PORT}`);
    console.log(`  🔐 Admin panel at        http://localhost:${PORT}/admin`);
    if (db.admin.isDefault) console.log(`     Default admin password: "${DEFAULT_ADMIN_PASSWORD}" — change it in Admin → Settings.\n`);
  });
}

// Export a request handler function for serverless platforms (Vercel) and attach helpers.
module.exports = Object.assign(requestHandler, { server, priceCart, requestHandler });
