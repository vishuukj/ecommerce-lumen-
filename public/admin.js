// ==========================================================================
// Lumen Admin panel (vanilla JS)
// ==========================================================================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const money = (n) => inr.format(n || 0);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(d).toLocaleDateString('en-IN', o);
const fmtTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const S = {
  token: localStorage.getItem('lumen:adminToken'),
  isDefaultPassword: false,
  categories: [],
  products: [],
  orders: [],
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (S.token) headers.Authorization = 'Bearer ' + S.token;
  const res = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/admin/login') { logout(true); }
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, fields: data.fields });
  return data;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ico">${type === 'error' ? '!' : '✓'}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3000);
}

function confirmDialog({ title, text, okLabel = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    $('#modalBody').innerHTML = `
      <div style="padding:28px">
        <h3 style="margin-bottom:8px">${esc(title)}</h3>
        <p class="muted" style="margin:0 0 22px">${text}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn" data-r="0">Cancel</button>
          <button class="btn ${danger ? '' : 'btn-primary'}" data-r="1" style="${danger ? 'background:var(--danger);color:#fff;border:0' : ''}">${esc(okLabel)}</button>
        </div>
      </div>`;
    const m = $('#modal');
    m.classList.add('open');
    const done = (v) => { m.classList.remove('open'); m.onclick = null; resolve(v); };
    m.onclick = (e) => { if (e.target === m) done(false); const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1'); };
    $('[data-r="1"]', m).focus();
  });
}

const ICON = {
  dash: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  box: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  bag: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  tag: '<svg class="icon" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  gear: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  ext: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 3h7v7M10 14 21 3M21 14v7H3V3h7"/></svg>',
  out: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  eye: '<svg class="icon" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  copy: '<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  sun: '<svg class="icon sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg class="icon moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
};
const catOf = (id) => S.categories.find((c) => c.id === id);
const thumb = (p, cls = '') => p.images?.[0]
  ? `<img src="${esc(p.images[0])}" alt="" loading="lazy" class="${cls}" onerror="this.outerHTML='<span class=&quot;ph&quot;>${catOf(p.category)?.icon || '🛍️'}</span>'">`
  : `<span class="ph">${catOf(p.category)?.icon || '🛍️'}</span>`;
const stockPill = (p) => p.stock <= 0 ? '<span class="pill-s red">Out of stock</span>' : p.stock <= 10 ? '<span class="pill-s orange">Low stock</span>' : '<span class="pill-s green">In stock</span>';
const STATUS_COLOR = { confirmed: 'blue', packed: 'orange', shipped: 'orange', delivered: 'green', cancelled: 'red' };

// ---------- Auth ----------
function renderLogin() {
  $('#root').innerHTML = `
  <div class="login-screen">
    <form class="login-card" id="loginForm">
      <div class="logo-mark">L</div>
      <h1>Lumen Admin</h1>
      <p>Sign in to manage products, stock and orders.</p>
      <div class="field">
        <label for="pw">Admin password</label>
        <div class="pw-wrap"><input class="input" id="pw" type="password" autocomplete="current-password" required autofocus><button type="button" id="pwShow">Show</button></div>
        <span class="err" id="pwErr"></span>
      </div>
      <button class="btn btn-primary btn-block" id="loginBtn" style="margin-top:14px">Sign in</button>
      <a href="/" class="muted" style="display:block;text-align:center;margin-top:18px;font-size:.85rem">← Back to store</a>
    </form>
  </div>`;
  $('#pwShow').onclick = () => { const i = $('#pw'); i.type = i.type === 'password' ? 'text' : 'password'; $('#pwShow').textContent = i.type === 'password' ? 'Show' : 'Hide'; };
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#loginBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try {
      const r = await api('/admin/login', { method: 'POST', body: { password: $('#pw').value } });
      S.token = r.token; S.isDefaultPassword = r.isDefaultPassword;
      localStorage.setItem('lumen:adminToken', r.token);
      boot();
    } catch (err) {
      $('#pwErr').textContent = err.message;
      $('#pw').closest('.field').classList.add('invalid');
      $('#loginCard')?.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  };
}

async function logout(expired = false) {
  if (!expired && S.token) await api('/admin/logout', { method: 'POST' }).catch(() => {});
  S.token = null;
  localStorage.removeItem('lumen:adminToken');
  closePanel();
  renderLogin();
  if (expired) toast('Your session has expired. Please sign in again.', 'error');
}

// ---------- Shell ----------
const PAGES = {
  dashboard: { title: 'Dashboard', icon: ICON.dash, render: renderDashboard },
  products: { title: 'Products', icon: ICON.box, render: renderProducts },
  orders: { title: 'Orders', icon: ICON.bag, render: renderOrders },
  categories: { title: 'Categories', icon: ICON.tag, render: renderCategories },
  settings: { title: 'Settings', icon: ICON.gear, render: renderSettings },
};

function renderShell() {
  $('#root').innerHTML = `
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <a class="logo" href="#/dashboard"><span class="logo-mark">L</span><span class="logo-text">lumen</span><small>ADMIN</small></a>
      ${Object.entries(PAGES).map(([k, p]) => `<a class="side-link" href="#/${k}" data-page="${k}">${p.icon}<span>${p.title}</span>${k === 'orders' ? '<span class="count" id="pendingCount" hidden></span>' : ''}</a>`).join('')}
      <span class="spacer"></span>
      <a class="side-link" href="/" target="_blank" rel="noopener">${ICON.ext}<span>View store</span></a>
      <button class="side-link" id="logoutBtn" style="border:0;background:none;width:100%;text-align:left">${ICON.out}<span>Sign out</span></button>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">${ICON.menu}</button>
        <h1 id="pageTitle"></h1>
        <span class="spacer"></span>
        <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">${ICON.sun}${ICON.moon}</button>
      </header>
      <div class="content" id="content"></div>
    </div>
  </div>`;
  $('#logoutBtn').onclick = () => logout();
  $('#menuBtn').onclick = () => { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); };
  $('#themeToggle').onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lumen:theme', next);
  };
}

async function route() {
  if (!S.token) return;
  const key = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]) || 'dashboard';
  const page = PAGES[key] || PAGES.dashboard;
  $$('.side-link[data-page]').forEach((a) => a.classList.toggle('active', a.dataset.page === key));
  $('#pageTitle').textContent = page.title;
  document.title = `${page.title} — Lumen Admin`;
  $('#sidebar').classList.remove('open');
  if (!$('#panelDrawer').classList.contains('open')) $('#overlay').classList.remove('show');
  const content = $('#content');
  content.style.animation = 'none'; void content.offsetWidth; content.style.animation = '';
  content.innerHTML = '<div class="skeleton" style="height:120px;border-radius:16px;margin-bottom:16px"></div><div class="skeleton" style="height:300px;border-radius:16px"></div>';
  try { await page.render(content); } catch (err) { if (err.status !== 401) content.innerHTML = `<div class="empty"><div class="big">😵</div><h3>Couldn't load this page</h3><p>${esc(err.message)}</p></div>`; }
}

const defaultBanner = () => S.isDefaultPassword
  ? `<div class="warn-banner">⚠️ You're using the default admin password. Anyone who knows it can access this panel.<a href="#/settings">Change password →</a></div>` : '';

async function refreshPending() {
  try {
    const st = await api('/admin/stats');
    const el = $('#pendingCount');
    if (el) { el.textContent = st.pendingOrders; el.hidden = !st.pendingOrders; }
    return st;
  } catch { return null; }
}

// ---------- Dashboard ----------
async function renderDashboard(el) {
  const st = await refreshPending();
  if (!st) throw new Error('Could not load stats');
  const maxRev = Math.max(1, ...st.days.map((d) => d.revenue));
  el.innerHTML = `
    ${defaultBanner()}
    <div class="stats">
      <div class="stat hl"><div class="ico">💰</div><span>Total revenue</span><b>${money(st.revenue)}</b></div>
      <div class="stat"><div class="ico">🧾</div><span>Orders</span><b>${st.orders}</b></div>
      <div class="stat"><div class="ico">⏳</div><span>To fulfil</span><b>${st.pendingOrders}</b></div>
      <div class="stat"><div class="ico">👥</div><span>Customers</span><b>${st.customers}</b></div>
      <div class="stat"><div class="ico">📦</div><span>Products</span><b>${st.products}</b></div>
      <div class="stat"><div class="ico">🚫</div><span>Out of stock</span><b>${st.outOfStock}</b></div>
    </div>
    <div class="dash-grid">
      <div class="box">
        <h3>Revenue — last 7 days <span class="muted" style="font-weight:600;font-size:.85rem">${money(st.days.reduce((s, d) => s + d.revenue, 0))}</span></h3>
        <div class="chart">${st.days.map((d) => `
          <div class="col"><div class="bar-v" style="height:${Math.max(2, (d.revenue / maxRev) * 100)}%" data-tip="${money(d.revenue)} · ${d.orders} order${d.orders === 1 ? '' : 's'}"></div>
          <span>${fmtDate(d.date, { weekday: 'short' })}</span></div>`).join('')}</div>
      </div>
      <div class="box">
        <h3>Low stock <a href="#/products?stock=low">View all</a></h3>
        ${st.lowStock.length ? st.lowStock.slice(0, 6).map((p) => `
          <div class="list-row">${thumb(p)}<div class="grow"><b>${esc(p.title)}</b><span>${p.stock} left</span></div>
            <button class="btn btn-sm" data-restock="${p.id}">+10</button></div>`).join('') : '<p class="muted">🎉 Everything is well stocked.</p>'}
      </div>
      <div class="box">
        <h3>Recent orders <a href="#/orders">View all</a></h3>
        ${st.recentOrders.length ? st.recentOrders.map((o) => `
          <div class="list-row"><div class="grow"><b>${esc(o.id)}</b><span>${esc(o.address.name)} · ${fmtTime(o.createdAt)}</span></div>
            <span class="pill-s ${STATUS_COLOR[o.status]}" style="text-transform:capitalize">${o.status}</span><b>${money(o.total)}</b></div>`).join('') : '<p class="muted">No orders yet.</p>'}
      </div>
      <div class="box">
        <h3>Top sellers</h3>
        ${st.top.length ? st.top.map((t, i) => `
          <div class="list-row"><b style="width:18px;color:var(--muted)">${i + 1}</b>${t.image ? `<img src="${esc(t.image)}" alt="">` : '<span class="ph">📦</span>'}<div class="grow"><b>${esc(t.title)}</b><span>${t.qty} sold</span></div></div>`).join('') : '<p class="muted">Sales will appear here.</p>'}
      </div>
    </div>`;
  $$('[data-restock]', el).forEach((b) => b.onclick = async () => {
    b.disabled = true;
    try { await api(`/admin/products/${b.dataset.restock}/stock`, { method: 'PATCH', body: { delta: 10 } }); toast('Stock increased by 10'); renderDashboard(el); }
    catch (err) { toast(err.message, 'error'); b.disabled = false; }
  });
}

// ---------- Products ----------
async function loadCatalog() {
  [S.products, S.categories] = await Promise.all([api('/admin/products'), api('/categories')]);
}

async function renderProducts(el) {
  await loadCatalog();
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const f = { q: '', cat: '', stock: params.get('stock') || 'all' };

  el.innerHTML = `
    ${defaultBanner()}
    <div class="tbar">
      <input class="input search-in" id="pSearch" type="search" placeholder="Search by name, brand or ID…">
      <select class="input" id="pCat"><option value="">All categories</option>${S.categories.map((c) => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('')}</select>
      <div class="seg" id="pStock">${[['all', 'All'], ['low', 'Low stock'], ['out', 'Out of stock'], ['hidden', 'Hidden']].map(([v, l]) => `<button data-v="${v}" class="${f.stock === v ? 'active' : ''}">${l}</button>`).join('')}</div>
      <span class="spacer"></span>
      <button class="btn btn-primary" id="addProduct">+ Add product</button>
    </div>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody id="pBody"></tbody>
      </table>
    </div>
    <p class="muted" id="pCount" style="font-size:.85rem;margin-top:10px"></p>`;

  const paint = () => {
    const q = f.q.toLowerCase();
    const list = S.products.filter((p) =>
      (!q || [p.title, p.brand, p.id].join(' ').toLowerCase().includes(q)) &&
      (!f.cat || p.category === f.cat) &&
      (f.stock === 'all' || (f.stock === 'low' && p.stock > 0 && p.stock <= 10) || (f.stock === 'out' && p.stock <= 0) || (f.stock === 'hidden' && p.hidden)));
    $('#pCount').textContent = `Showing ${list.length} of ${S.products.length} products`;
    $('#pBody').innerHTML = list.length ? list.map((p) => `
      <tr class="${p.hidden ? 'dim' : ''}" data-id="${p.id}">
        <td><div class="p-cell">${thumb(p)}<div><b>${esc(p.title)}</b><span>${esc(p.brand)} · ${p.id}</span></div></div></td>
        <td>${catOf(p.category)?.icon || ''} ${esc(catOf(p.category)?.name || p.category)}</td>
        <td><b>${money(p.price)}</b><br><span class="muted" style="font-size:.78rem;text-decoration:line-through">${money(p.mrp)}</span></td>
        <td><div class="stock-ctl ${p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : ''}">
          <button data-delta="-1" aria-label="Decrease stock">−</button>
          <input type="number" min="0" value="${p.stock}" aria-label="Stock for ${esc(p.title)}">
          <button data-delta="1" aria-label="Increase stock">+</button></div></td>
        <td>${p.hidden ? '<span class="pill-s gray">Hidden</span>' : stockPill(p)}</td>
        <td><div class="row-actions">
          <a class="icon-btn" href="/#/product/${p.id}" target="_blank" rel="noopener" title="View in store">${ICON.eye}</a>
          <button class="icon-btn" data-act="dup" title="Duplicate">${ICON.copy}</button>
          <button class="icon-btn" data-act="edit" title="Edit">${ICON.edit}</button>
          <button class="icon-btn danger" data-act="del" title="Delete">${ICON.trash}</button>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="6" class="empty-row">No products match these filters.</td></tr>`;
  };
  paint();

  $('#pSearch').oninput = debounce((e) => { f.q = e.target.value.trim(); paint(); }, 150);
  $('#pCat').onchange = (e) => { f.cat = e.target.value; paint(); };
  $('#pStock').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; f.stock = b.dataset.v; $$('#pStock button').forEach((x) => x.classList.toggle('active', x === b)); paint(); };
  $('#addProduct').onclick = () => openProductForm(null, paint);

  const saveStock = async (row, body) => {
    const p = S.products.find((x) => x.id === row.dataset.id);
    const ctl = $('.stock-ctl', row);
    try {
      const r = await api(`/admin/products/${p.id}/stock`, { method: 'PATCH', body });
      p.stock = r.stock;
      $('input', ctl).value = r.stock;
      ctl.className = `stock-ctl ${r.stock <= 0 ? 'out' : r.stock <= 10 ? 'low' : ''} saved`;
      row.children[4].innerHTML = p.hidden ? '<span class="pill-s gray">Hidden</span>' : stockPill(p);
    } catch (err) { toast(err.message, 'error'); $('input', ctl).value = p.stock; }
  };

  const body = $('#pBody');
  body.addEventListener('click', async (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const p = S.products.find((x) => x.id === row.dataset.id);
    const d = e.target.closest('[data-delta]');
    if (d) return saveStock(row, { delta: Number(d.dataset.delta) });
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'edit') openProductForm(p, paint);
    if (act === 'dup') openProductForm({ ...structuredClone(p), id: null, title: p.title + ' (copy)' }, paint);
    if (act === 'del') {
      const ok = await confirmDialog({ title: 'Delete product?', text: `<b>${esc(p.title)}</b> will be permanently removed from the store. Past orders keep their copy of the item. Tip: hide it instead if you might sell it again.` });
      if (!ok) return;
      try {
        await api('/admin/products/' + p.id, { method: 'DELETE' });
        S.products = S.products.filter((x) => x.id !== p.id);
        paint(); toast('Product deleted');
      } catch (err) { toast(err.message, 'error'); }
    }
  });
  body.addEventListener('change', (e) => {
    if (e.target.matches('.stock-ctl input')) saveStock(e.target.closest('tr'), { stock: Number(e.target.value) });
  });
  body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.stock-ctl input')) e.target.blur(); });

  if (params.get('new') === '1') openProductForm(null, paint);
}

// ---------- Product form (side panel) ----------
function closePanel() {
  $('#panelDrawer').classList.remove('open');
  $('#panelDrawer').setAttribute('aria-hidden', 'true');
  $('#overlay').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

async function resizeImage(file) {
  if (file.type === 'image/gif') return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
}

function openProductForm(product, onSaved) {
  const isEdit = !!product?.id;
  const p = product || { title: '', brand: '', category: S.categories[0]?.id || '', price: '', mrp: '', stock: 10, rating: 4.5, reviews: 0, tags: ['new'], images: [], colors: [], sizes: [], description: '', features: [], specs: {}, hidden: false };
  const st = { images: [...(p.images || [])], colors: [...(p.colors || [])], dirty: false };
  const drawer = $('#panelDrawer');

  drawer.innerHTML = `
    <div class="pd-head"><h2>${isEdit ? 'Edit product' : 'Add a new product'}</h2>${isEdit ? `<span class="pill-s gray">${p.id}</span>` : ''}<button class="icon-btn" id="pdClose" aria-label="Close">${ICON.close}</button></div>
    <form class="pd-body" id="pForm" novalidate>
      <div class="mini-preview" id="mPreview"></div>

      <section class="fsec">
        <h3>📝 Basic information</h3>
        <div class="field"><label for="f_title">Product title *</label><input class="input" id="f_title" name="title" value="${esc(p.title)}" maxlength="120" placeholder="e.g. AeroSound Pro Wireless Headphones"><span class="err"></span></div>
        <div class="grid-2">
          <div class="field"><label for="f_brand">Brand *</label><input class="input" id="f_brand" name="brand" value="${esc(p.brand)}" list="brandList" maxlength="60"><datalist id="brandList">${[...new Set(S.products.map((x) => x.brand))].map((b) => `<option value="${esc(b)}">`).join('')}</datalist><span class="err"></span></div>
          <div class="field"><label for="f_category">Category *</label><select class="input" id="f_category" name="category">${S.categories.map((c) => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}</select><span class="err"></span></div>
        </div>
        <div class="field"><label for="f_description">Description *</label><textarea class="input" id="f_description" name="description" rows="4" maxlength="2000" placeholder="Describe the product in a few sentences">${esc(p.description)}</textarea><span class="err"></span></div>
      </section>

      <section class="fsec">
        <h3>💰 Pricing & stock</h3>
        <div class="grid-3">
          <div class="field"><label for="f_price">Selling price (₹) *</label><input class="input" id="f_price" name="price" type="number" min="1" value="${esc(p.price)}"><span class="err"></span></div>
          <div class="field"><label for="f_mrp">MRP (₹) *</label><input class="input" id="f_mrp" name="mrp" type="number" min="1" value="${esc(p.mrp)}"><span class="err"></span></div>
          <div class="field"><label for="f_stock">Stock quantity *</label><input class="input" id="f_stock" name="stock" type="number" min="0" value="${esc(p.stock)}"><span class="err"></span></div>
        </div>
        <span class="disc-preview" id="discPreview"></span>
      </section>

      <section class="fsec">
        <h3>🖼️ Images <small>First image is the main photo · drag to reorder</small></h3>
        <div class="img-list" id="imgList"></div>
        <div class="dropzone" id="dropzone" tabindex="0"><input type="file" id="fileIn" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden>
          📤 <b>Click to upload</b> or drag & drop images here<br><span style="font-size:.78rem">PNG, JPG, WEBP or GIF · up to 5 MB each</span></div>
        <div class="url-row"><input class="input" id="imgUrl" placeholder="…or paste an image URL (https://…)"><button type="button" class="btn" id="addUrl">Add</button></div>
        <span class="err" id="imgErr" style="color:var(--danger);font-size:.78rem"></span>
      </section>

      <section class="fsec">
        <h3>🎨 Variants <small>optional</small></h3>
        <div class="field"><label>Colours</label>
          <div class="color-list" id="colorList"></div>
        </div>
        <div class="field"><label for="f_sizes">Sizes</label><input class="input" id="f_sizes" name="sizes" value="${esc((p.sizes || []).join(', '))}" placeholder="e.g. S, M, L, XL  or  6, 7, 8, 9"><span class="hint">Comma-separated. If set, customers must choose a size.</span></div>
      </section>

      <section class="fsec">
        <h3>📋 Details <small>optional</small></h3>
        <div class="field"><label for="f_features">Key features</label><textarea class="input" id="f_features" name="features" rows="4" placeholder="One feature per line">${esc((p.features || []).join('\n'))}</textarea><span class="hint">One per line — shown as a checklist on the product page.</span></div>
        <div class="field"><label for="f_specs">Specifications</label><textarea class="input" id="f_specs" name="specs" rows="4" placeholder="Material: Cotton&#10;Weight: 250 g">${esc(Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'))}</textarea><span class="hint">One per line in the form <b>Name: Value</b>.</span></div>
      </section>

      <section class="fsec">
        <h3>🏷️ Labels & visibility</h3>
        <div class="tag-checks">${[['new', '✨ New'], ['deal', '💸 Deal'], ['bestseller', '🔥 Bestseller']].map(([v, l]) => `<label><input type="checkbox" name="tags" value="${v}" ${(p.tags || []).includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
        <div class="grid-2">
          <div class="field"><label for="f_rating">Rating (0–5)</label><input class="input" id="f_rating" name="rating" type="number" min="0" max="5" step="0.1" value="${esc(p.rating)}"><span class="err"></span></div>
          <div class="field"><label for="f_reviews">Number of ratings</label><input class="input" id="f_reviews" name="reviews" type="number" min="0" value="${esc(p.reviews)}"><span class="err"></span></div>
        </div>
        <label class="toggle"><input type="checkbox" name="visible" ${p.hidden ? '' : 'checked'}><span class="track"></span> Visible in store</label>
      </section>
    </form>
    <div class="pd-foot">
      ${isEdit ? `<a class="btn btn-ghost" href="/#/product/${p.id}" target="_blank" rel="noopener">${ICON.eye} Preview</a>` : ''}
      <span class="spacer"></span>
      <button class="btn" id="pdCancel">Cancel</button>
      <button class="btn btn-primary" id="pdSave">${isEdit ? 'Save changes' : 'Create product'}</button>
    </div>`;

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('show');
  document.body.classList.add('no-scroll');
  setTimeout(() => $('#f_title').focus(), 300);

  const form = $('#pForm');
  const close = async () => {
    if (st.dirty && !(await confirmDialog({ title: 'Discard changes?', text: 'You have unsaved changes to this product.', okLabel: 'Discard' }))) return;
    closePanel();
  };
  $('#pdClose').onclick = close;
  $('#pdCancel').onclick = close;
  $('#overlay').onclick = () => { if (drawer.classList.contains('open')) close(); else { $('#sidebar')?.classList.remove('open'); $('#overlay').classList.remove('show'); } };

  // Live preview + discount
  const preview = () => {
    const fd = new FormData(form);
    const price = Number(fd.get('price')), mrp = Number(fd.get('mrp'));
    const cat = catOf(fd.get('category'));
    $('#mPreview').innerHTML = `<div class="mp-img">${st.images[0] ? `<img src="${esc(st.images[0])}" alt="" onerror="this.remove()">` : cat?.icon || '🛍️'}</div>
      <div style="min-width:0"><span class="muted" style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(fd.get('brand') || 'Brand')}</span>
      <b>${esc(fd.get('title') || 'Product title')}</b>
      <span><b style="display:inline">${price ? money(price) : '₹—'}</b> ${mrp > price && price ? `<span class="mrp">${money(mrp)}</span> <span class="off">${Math.round(((mrp - price) / mrp) * 100)}% off</span>` : ''}</span></div>`;
    $('#discPreview').textContent = price && mrp ? (mrp < price ? '' : mrp === price ? 'No discount shown' : `Customers see ${Math.round(((mrp - price) / mrp) * 100)}% off · save ${money(mrp - price)}`) : '';
  };
  form.addEventListener('input', (e) => { st.dirty = true; const f = e.target.closest('.field'); if (f) { f.classList.remove('invalid'); const er = $('.err', f); if (er) er.textContent = ''; } preview(); });

  // Images
  const paintImages = () => {
    $('#imgList').innerHTML = st.images.map((u, i) => `
      <div class="img-item" draggable="true" data-i="${i}"><img src="${esc(u)}" alt="" onerror="this.parentNode.classList.add('broken');this.replaceWith(Object.assign(document.createElement('span'),{textContent:'⚠️ Image failed to load'}))">
      <button type="button" class="x" data-rm="${i}" aria-label="Remove image">✕</button></div>`).join('');
    preview();
  };
  $('#imgList').addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { st.images.splice(Number(b.dataset.rm), 1); st.dirty = true; paintImages(); } });
  let dragFrom = null;
  $('#imgList').addEventListener('dragstart', (e) => { const it = e.target.closest('.img-item'); dragFrom = Number(it.dataset.i); it.classList.add('dragging'); });
  $('#imgList').addEventListener('dragover', (e) => e.preventDefault());
  $('#imgList').addEventListener('drop', (e) => {
    e.preventDefault();
    const it = e.target.closest('.img-item');
    if (!it || dragFrom === null) return;
    const to = Number(it.dataset.i);
    const [m] = st.images.splice(dragFrom, 1);
    st.images.splice(to, 0, m);
    dragFrom = null; st.dirty = true; paintImages();
  });
  $('#imgList').addEventListener('dragend', () => { dragFrom = null; $$('.img-item').forEach((x) => x.classList.remove('dragging')); });

  const addUrl = () => {
    const v = $('#imgUrl').value.trim();
    if (!/^https?:\/\/\S+$/.test(v)) { $('#imgErr').textContent = 'Enter a valid http(s) image URL'; return; }
    if (st.images.length >= 8) { $('#imgErr').textContent = 'You can add up to 8 images'; return; }
    st.images.push(v); $('#imgUrl').value = ''; $('#imgErr').textContent = ''; st.dirty = true; paintImages();
  };
  $('#addUrl').onclick = addUrl;
  $('#imgUrl').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } };

  const upload = async (files) => {
    $('#imgErr').textContent = '';
    for (const file of files) {
      if (st.images.length >= 8) { $('#imgErr').textContent = 'You can add up to 8 images'; break; }
      if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { $('#imgErr').textContent = `${file.name}: unsupported file type`; continue; }
      if (file.size > 15 * 1024 * 1024) { $('#imgErr').textContent = `${file.name}: file is too large`; continue; }
      const dz = $('#dropzone');
      dz.innerHTML = `<span class="spinner" style="display:inline-block;border-color:var(--border);border-top-color:var(--primary);width:22px;height:22px;border-width:3px;border-style:solid;border-radius:50%;animation:spin .7s linear infinite"></span><br>Uploading ${esc(file.name)}…`;
      try {
        const data = await resizeImage(file);
        const { url } = await api('/admin/upload', { method: 'POST', body: { data } });
        st.images.push(url); st.dirty = true; paintImages();
      } catch (err) { $('#imgErr').textContent = `${file.name}: ${err.message}`; }
    }
    $('#dropzone').innerHTML = `<input type="file" id="fileIn" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden>📤 <b>Click to upload</b> or drag & drop images here<br><span style="font-size:.78rem">PNG, JPG, WEBP or GIF · up to 5 MB each</span>`;
    bindFileInput();
  };
  const bindFileInput = () => { $('#fileIn').onchange = (e) => upload([...e.target.files]); };
  bindFileInput();
  const dz = $('#dropzone');
  dz.onclick = () => $('#fileIn').click();
  dz.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#fileIn').click(); } };
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('over'); upload([...e.dataTransfer.files]); };

  // Colours
  const paintColors = () => {
    $('#colorList').innerHTML = st.colors.map((c, i) => `<span class="color-chip"><i style="background:${esc(c)}"></i>${esc(c)}<button type="button" data-rmc="${i}" aria-label="Remove colour">✕</button></span>`).join('')
      + `<span class="color-add"><input type="color" id="colorPick" value="#5b5bf7" aria-label="Pick colour"><button type="button" class="btn btn-sm" id="addColor">+ Add colour</button></span>`;
    $('#addColor').onclick = () => { const v = $('#colorPick').value; if (!st.colors.includes(v) && st.colors.length < 8) { st.colors.push(v); st.dirty = true; paintColors(); } };
  };
  $('#colorList').addEventListener('click', (e) => { const b = e.target.closest('[data-rmc]'); if (b) { st.colors.splice(Number(b.dataset.rmc), 1); st.dirty = true; paintColors(); } });

  paintImages(); paintColors(); preview();

  // Save
  $('#pdSave').onclick = async () => {
    const fd = new FormData(form);
    const specs = {};
    String(fd.get('specs') || '').split('\n').forEach((line) => { const i = line.indexOf(':'); if (i > 0) { const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim(); if (k && v) specs[k] = v; } });
    const body = {
      title: fd.get('title'), brand: fd.get('brand'), category: fd.get('category'), description: fd.get('description'),
      price: fd.get('price'), mrp: fd.get('mrp'), stock: fd.get('stock'), rating: fd.get('rating'), reviews: fd.get('reviews'),
      tags: fd.getAll('tags'), images: st.images, colors: st.colors,
      sizes: String(fd.get('sizes') || '').split(',').map((s) => s.trim()).filter(Boolean),
      features: String(fd.get('features') || '').split('\n').map((s) => s.trim()).filter(Boolean),
      specs, hidden: !fd.get('visible'),
    };
    const btn = $('#pdSave');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      const saved = await api(isEdit ? `/admin/products/${p.id}` : '/admin/products', { method: isEdit ? 'PUT' : 'POST', body });
      if (isEdit) S.products = S.products.map((x) => (x.id === saved.id ? saved : x));
      else S.products.unshift(saved);
      st.dirty = false;
      closePanel();
      toast(isEdit ? 'Product updated — live in the store' : `"${saved.title}" is now live in the store 🎉`);
      onSaved?.();
    } catch (err) {
      toast(err.message, 'error');
      if (err.fields) {
        for (const [k, msg] of Object.entries(err.fields)) {
          if (k === 'images') { $('#imgErr').textContent = msg; continue; }
          const input = form.querySelector(`[name="${k}"]`);
          const fieldEl = input?.closest('.field');
          if (fieldEl) { fieldEl.classList.add('invalid'); const er = $('.err', fieldEl); if (er) er.textContent = msg; }
        }
        const first = form.querySelector('.field.invalid .input') || (err.fields.images && $('#dropzone'));
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first?.focus?.();
      }
      btn.disabled = false; btn.textContent = isEdit ? 'Save changes' : 'Create product';
    }
  };
}

// ---------- Orders ----------
async function renderOrders(el) {
  S.orders = await api('/admin/orders');
  refreshPending();
  const f = { status: 'all', q: '' };
  const open = new Set();
  el.innerHTML = `
    <div class="tbar">
      <input class="input search-in" id="oSearch" type="search" placeholder="Search by order ID, name, email or phone…">
      <div class="seg" id="oStatus">${['all', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => `<button data-v="${s}" class="${s === 'all' ? 'active' : ''}" style="text-transform:capitalize">${s}</button>`).join('')}</div>
    </div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
      <tbody id="oBody"></tbody>
    </table></div>`;

  const paint = () => {
    const q = f.q.toLowerCase();
    const list = S.orders.filter((o) => (f.status === 'all' || o.status === f.status) &&
      (!q || [o.id, o.email, o.address.name, o.address.phone].join(' ').toLowerCase().includes(q)));
    $('#oBody').innerHTML = list.length ? list.map((o) => `
      <tr data-id="${o.id}" style="cursor:pointer">
        <td><b>${esc(o.id)}</b></td>
        <td style="white-space:nowrap">${fmtTime(o.createdAt)}</td>
        <td><b>${esc(o.address.name)}</b><br><span class="muted" style="font-size:.78rem">${esc(o.email)}</span></td>
        <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td>
        <td><b>${money(o.total)}</b></td>
        <td><span style="text-transform:uppercase;font-weight:700;font-size:.8rem">${esc(o.payment.method)}</span> <span class="pill-s ${o.payment.status === 'paid' ? 'green' : 'orange'}">${o.payment.status}</span></td>
        <td><select class="status-sel" data-status="${o.id}" aria-label="Order status">${['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      </tr>
      ${open.has(o.id) ? `<tr class="order-detail"><td colspan="7"><div class="od-grid">
        <div><h4>Items</h4>${o.items.map((i) => `<div class="list-row">${i.image ? `<img src="${esc(i.image)}" alt="">` : '<span class="ph">📦</span>'}<div class="grow"><b>${esc(i.title)}</b><span>${i.qty} × ${money(i.price)}${i.size ? ` · Size ${esc(i.size)}` : ''}${i.color ? ` · <i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${esc(i.color)}"></i>` : ''}</span></div><b>${money(i.lineTotal)}</b></div>`).join('')}
          <div class="sum-row" style="font-size:.85rem"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
          ${o.discount ? `<div class="sum-row" style="font-size:.85rem"><span>Discount (${esc(o.coupon)})</span><span class="green">− ${money(o.discount)}</span></div>` : ''}
          <div class="sum-row" style="font-size:.85rem"><span>Shipping (${esc(o.shippingMethod)})</span><span>${o.shipping ? money(o.shipping) : 'FREE'}</span></div>
          <div class="sum-row" style="font-weight:800"><span>Total</span><span>${money(o.total)}</span></div></div>
        <div><h4>Ship to</h4><p style="margin:0">${esc(o.address.name)}<br>${esc(o.address.line1)}${o.address.line2 ? '<br>' + esc(o.address.line2) : ''}<br>${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pincode)}<br>📞 ${esc(o.address.phone)}<br>✉️ ${esc(o.email)}</p>
          <h4 style="margin-top:14px">Payment</h4><p style="margin:0;text-transform:uppercase">${esc(o.payment.method)}${o.payment.last4 ? ' •••• ' + esc(o.payment.last4) : ''}${o.payment.upiId ? ' · ' + esc(o.payment.upiId) : ''}${o.payment.bankName ? ' · ' + esc(o.payment.bankName) : ''}${o.payment.emiMonths ? ` · ${o.payment.emiMonths}m EMI (${esc(o.payment.emiBank)})` : ''}${o.payment.txnId ? '<br><span class="muted" style="font-size:.76rem">Ref: ' + esc(o.payment.txnId) + '</span>' : ''}</p></div>
        <div><h4>Timeline</h4><ul class="timeline">${(o.statusHistory || []).map((h) => `<li>${esc(h.status)}<span>${fmtTime(h.at)}</span></li>`).join('')}</ul></div>
      </div></td></tr>` : ''}`).join('') : '<tr><td colspan="7" class="empty-row">No orders found.</td></tr>';
  };
  paint();

  $('#oSearch').oninput = debounce((e) => { f.q = e.target.value.trim(); paint(); }, 150);
  $('#oStatus').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; f.status = b.dataset.v; $$('#oStatus button').forEach((x) => x.classList.toggle('active', x === b)); paint(); };
  $('#oBody').addEventListener('click', (e) => {
    if (e.target.closest('select')) return;
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    open.has(row.dataset.id) ? open.delete(row.dataset.id) : open.add(row.dataset.id);
    paint();
  });
  $('#oBody').addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    const o = S.orders.find((x) => x.id === sel.dataset.status);
    if (sel.value === 'cancelled' && !(await confirmDialog({ title: 'Cancel this order?', text: `Order <b>${esc(o.id)}</b> will be cancelled and its items returned to stock.`, okLabel: 'Cancel order' }))) { sel.value = o.status; return; }
    try {
      const updated = await api('/admin/orders/' + o.id, { method: 'PATCH', body: { status: sel.value } });
      Object.assign(o, updated);
      paint(); refreshPending();
      toast(`Order ${o.id} marked as ${updated.status}`);
    } catch (err) { toast(err.message, 'error'); sel.value = o.status; }
  });
}

// ---------- Categories ----------
async function renderCategories(el) {
  await loadCatalog();
  const counts = {};
  S.products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  el.innerHTML = `
    <form class="box" id="catForm" style="margin-bottom:20px">
      <h3>Add a category</h3>
      <div style="display:grid;grid-template-columns:2fr 100px 120px auto;gap:12px;align-items:end">
        <div class="field"><label for="c_name">Name</label><input class="input" id="c_name" name="name" placeholder="e.g. Books" required maxlength="40"></div>
        <div class="field"><label for="c_icon">Emoji</label><input class="input" id="c_icon" name="icon" placeholder="📚" maxlength="4" style="text-align:center;font-size:1.2rem"></div>
        <div class="field"><label for="c_color">Colour</label><input class="input" id="c_color" name="color" type="color" value="#8b5cf6" style="padding:4px"></div>
        <button class="btn btn-primary">Add</button>
      </div>
    </form>
    <div class="cat-list">${S.categories.map((c) => `
      <div class="cat-item"><span class="ci" style="background:color-mix(in srgb, ${esc(c.color)} 16%, transparent)">${esc(c.icon)}</span>
        <div class="grow"><b>${esc(c.name)}</b><span>${counts[c.id] || 0} products</span></div>
        <a class="icon-btn" href="#/products" title="View products" data-catlink="${c.id}">${ICON.eye}</a>
        <button class="icon-btn danger" data-delcat="${c.id}" title="Delete">${ICON.trash}</button>
      </div>`).join('')}</div>`;
  $('#catForm').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try { const c = await api('/admin/categories', { method: 'POST', body }); toast(`Category "${c.name}" added`); renderCategories(el); }
    catch (err) { toast(err.message, 'error'); }
  };
  $$('[data-delcat]', el).forEach((b) => b.onclick = async () => {
    const c = catOf(b.dataset.delcat);
    if (counts[c.id]) return toast(`Move or delete the ${counts[c.id]} products in "${c.name}" first`, 'error');
    if (!(await confirmDialog({ title: 'Delete category?', text: `"${esc(c.name)}" will be removed from the store.` }))) return;
    try { await api('/admin/categories/' + c.id, { method: 'DELETE' }); toast('Category deleted'); renderCategories(el); }
    catch (err) { toast(err.message, 'error'); }
  });
}

// ---------- Settings ----------
async function renderSettings(el) {
  el.innerHTML = `
    ${defaultBanner()}
    <form class="box" id="pwForm" style="max-width:520px" novalidate>
      <h3>🔐 Change admin password</h3>
      <div class="form-stack">
        <div class="field"><label for="s_cur">Current password</label><input class="input" id="s_cur" name="current" type="password" autocomplete="current-password"><span class="err"></span></div>
        <div class="field"><label for="s_new">New password</label><input class="input" id="s_new" name="next" type="password" autocomplete="new-password" minlength="8"><span class="hint">At least 8 characters.</span><span class="err"></span></div>
        <div class="field"><label for="s_new2">Confirm new password</label><input class="input" id="s_new2" name="next2" type="password" autocomplete="new-password"><span class="err"></span></div>
        <button class="btn btn-primary" style="justify-self:start">Update password</button>
      </div>
      <p class="muted" style="font-size:.82rem;margin-bottom:0">Changing the password signs out all other admin sessions.</p>
    </form>`;
  const form = $('#pwForm');
  form.oninput = (e) => { const f = e.target.closest('.field'); f?.classList.remove('invalid'); const er = f && $('.err', f); if (er) er.textContent = ''; };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    const setErr = (name, msg) => { const f = form.querySelector(`[name=${name}]`).closest('.field'); f.classList.add('invalid'); $('.err', f).textContent = msg; };
    if (fd.next.length < 8) return setErr('next', 'Must be at least 8 characters');
    if (fd.next !== fd.next2) return setErr('next2', "Passwords don't match");
    try {
      await api('/admin/password', { method: 'POST', body: { current: fd.current, next: fd.next } });
      S.isDefaultPassword = false;
      toast('Password updated');
      renderSettings(el);
    } catch (err) { setErr('current', err.message); }
  };
}

// ---------- Boot ----------
async function boot() {
  if (!S.token) return renderLogin();
  try {
    const me = await api('/admin/me');
    S.isDefaultPassword = me.isDefaultPassword;
  } catch { return; } // 401 handler shows login
  renderShell();
  S.categories = await api('/categories').catch(() => []);
  refreshPending();
  if (!location.hash) history.replaceState(null, '', '#/dashboard');
  route();
}

window.addEventListener('hashchange', () => { if (S.token) { closePanelSilently(); route(); } });
function closePanelSilently() { if ($('#panelDrawer').classList.contains('open')) closePanel(); }
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('#modal').classList.contains('open')) return;
    if ($('#panelDrawer').classList.contains('open')) $('#pdClose')?.click();
    else { $('#sidebar')?.classList.remove('open'); $('#overlay').classList.remove('show'); }
  }
});
$('#overlay').addEventListener('click', () => { if (!$('#panelDrawer').classList.contains('open')) { $('#sidebar')?.classList.remove('open'); $('#overlay').classList.remove('show'); } });

boot();
