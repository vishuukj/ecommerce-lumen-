// ==========================================================================
// Lumen Store — single-page frontend (vanilla JS, no build step)
// ==========================================================================

// ---------- Utilities ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const money = (n) => inr.format(n);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pctOff = (p) => Math.round(((p.mrp - p.price) / p.mrp) * 100);
const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(d).toLocaleDateString('en-IN', opts);
const initials = (n) => String(n).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem('lumen:' + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem('lumen:' + k, JSON.stringify(v)),
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = 'Bearer ' + state.token;
  const res = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && state.token && path === '/auth/me') setAuth(null, null);
    throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
  }
  return data;
}

// ---------- State ----------
const state = {
  cart: store.get('cart', []),           // [{ key, id, qty, color, size, title, price, mrp, image, stock, category }]
  wishlist: store.get('wishlist', []),   // [id]
  recent: store.get('recent', []),       // [id]
  coupon: store.get('coupon', null),
  token: store.get('token', null),
  user: store.get('user', null),
  categories: [],
};
const productCache = new Map();
const cacheProducts = (list) => list.forEach((p) => productCache.set(p.id, p));
const catIcon = (id) => state.categories.find((c) => c.id === id)?.icon || '🛍️';

function setAuth(token, user) {
  state.token = token; state.user = user;
  store.set('token', token); store.set('user', user);
}

// ---------- Toasts ----------
function toast(msg, { type = 'success', image, action } = {}) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${image ? `<img src="${esc(image)}" alt="">` : `<span class="t-ico">${type === 'error' ? '!' : '✓'}</span>`}
    <span>${esc(msg)}${action ? ` <a href="${action.href}">${esc(action.label)}</a>` : ''}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

// ---------- Cart ----------
const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
const cartSubtotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0);
const FREE_SHIP = 999;

function saveCart() {
  store.set('cart', state.cart);
  updateBadges(true);
  renderDrawer();
  if (location.hash.startsWith('#/cart')) renderCartPage();
}

function addToCart(p, { qty = 1, color = null, size = null, silent = false } = {}) {
  if (p.stock <= 0) return toast('Sorry, this item is out of stock', { type: 'error' });
  const key = [p.id, color, size].join('|');
  const existing = state.cart.find((i) => i.key === key);
  const newQty = (existing?.qty || 0) + qty;
  if (newQty > Math.min(10, p.stock)) return toast(`You can add up to ${Math.min(10, p.stock)} of this item`, { type: 'error' });
  if (existing) existing.qty = newQty;
  else state.cart.push({ key, id: p.id, qty, color, size, title: p.title, price: p.price, mrp: p.mrp, image: p.images[0], stock: p.stock, category: p.category });
  saveCart();
  if (!silent) toast('Added to cart', { image: p.images[0], action: { href: '#/cart', label: 'View cart' } });
}

function setQty(key, qty) {
  const it = state.cart.find((i) => i.key === key);
  if (!it) return;
  if (qty <= 0) return removeFromCart(key);
  it.qty = Math.min(qty, Math.min(10, it.stock));
  saveCart();
}
function removeFromCart(key) {
  state.cart = state.cart.filter((i) => i.key !== key);
  saveCart();
}

function flyToCart(fromImg) {
  const target = $('#cartBtn');
  if (!fromImg || !target) return;
  const a = fromImg.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const clone = document.createElement('img');
  clone.src = fromImg.currentSrc || fromImg.src;
  clone.className = 'fly-img';
  const size = Math.min(a.width, 160);
  Object.assign(clone.style, { left: a.left + a.width / 2 - size / 2 + 'px', top: a.top + a.height / 2 - size / 2 + 'px', width: size + 'px', height: size + 'px' });
  clone.style.setProperty('--tx', b.left + b.width / 2 - (a.left + a.width / 2) + 'px');
  clone.style.setProperty('--ty', b.top + b.height / 2 - (a.top + a.height / 2) + 'px');
  document.body.appendChild(clone);
  clone.addEventListener('animationend', () => clone.remove());
}

// ---------- Wishlist ----------
function toggleWish(id) {
  const p = productCache.get(id);
  const i = state.wishlist.indexOf(id);
  if (i >= 0) { state.wishlist.splice(i, 1); toast('Removed from wishlist'); }
  else { state.wishlist.push(id); toast('Saved to wishlist ♥', { image: p?.images[0], action: { href: '#/wishlist', label: 'View' } }); }
  store.set('wishlist', state.wishlist);
  $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('wished', state.wishlist.includes(id)));
  updateBadges();
  if (location.hash.startsWith('#/wishlist')) router();
}

function updateBadges(bumpCart = false) {
  const c = cartCount();
  const cb = $('#cartCount');
  cb.textContent = c; cb.hidden = c === 0;
  if (bumpCart && c) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
  const w = $('#wishCount');
  w.textContent = state.wishlist.length; w.hidden = state.wishlist.length === 0;
}

// ---------- Shared components ----------
const ICON = {
  heart: '<svg class="icon" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  eye: '<svg class="icon" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  cart: '<svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>',
  arrow: '<svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  left: '<svg class="icon" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  grid: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  list: '<svg class="icon" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  filter: '<svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
  lock: '<svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  share: '<svg class="icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
};

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const ratingPill = (p) => `<span class="rating"><span class="pill">${p.rating} ★</span> (${p.reviews.toLocaleString('en-IN')})</span>`;

function productCard(p, i = 0) {
  const wished = state.wishlist.includes(p.id);
  const off = pctOff(p);
  const badges = [
    off >= 30 ? `<span class="tag sale">-${off}%</span>` : '',
    p.tags.includes('new') ? '<span class="tag new">New</span>' : '',
    p.tags.includes('bestseller') ? '<span class="tag best">Bestseller</span>' : '',
    p.stock > 0 && p.stock <= 10 ? `<span class="tag low">Only ${p.stock} left</span>` : '',
    p.stock <= 0 ? '<span class="tag">Sold out</span>' : '',
  ].join('');
  return `
  <article class="card" style="animation-delay:${Math.min(i, 12) * 40}ms">
    <a class="card-media" href="#/product/${p.id}" aria-label="${esc(p.title)}">
      <img src="${esc(p.images[0])}" alt="${esc(p.title)}" loading="lazy" data-cat="${p.category}">
      ${p.images[1] ? `<img class="alt" src="${esc(p.images[1])}" alt="" loading="lazy">` : ''}
    </a>
    <div class="card-badges">${badges}</div>
    <div class="card-actions">
      <button class="round-btn ${wished ? 'wished' : ''}" data-wish="${p.id}" aria-label="Add to wishlist" title="Wishlist">${ICON.heart}</button>
      <button class="round-btn quick" data-quick="${p.id}" aria-label="Quick view" title="Quick view">${ICON.eye}</button>
    </div>
    <div class="card-body">
      <span class="card-brand">${esc(p.brand)}</span>
      <a class="card-title" href="#/product/${p.id}">${esc(p.title)}</a>
      ${ratingPill(p)}
      <p class="card-desc">${esc(p.description)}</p>
      ${p.colors?.length ? `<div class="swatches">${p.colors.slice(0, 4).map((c) => `<span class="swatch-dot" style="background:${c}"></span>`).join('')}</div>` : ''}
      <div class="price-row"><span class="price">${money(p.price)}</span><span class="mrp">${money(p.mrp)}</span><span class="off">${off}% off</span></div>
    </div>
    <div class="card-add">
      <button class="btn btn-dark btn-sm btn-block" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${ICON.cart} ${p.stock <= 0 ? 'Sold out' : 'Add to cart'}</button>
    </div>
  </article>`;
}

const skeletonCards = (n = 8) => Array.from({ length: n }, () => `
  <div class="sk-card"><div class="skeleton img"></div><div class="lines">
    <div class="skeleton line" style="width:40%"></div><div class="skeleton line"></div><div class="skeleton line" style="width:60%"></div>
  </div></div>`).join('');

// Image fallback (if a CDN image fails, show a friendly placeholder)
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.failed) return;
  img.dataset.failed = '1';
  if (img.classList.contains('alt')) return img.remove();
  const ph = document.createElement('div');
  ph.className = 'img-fallback';
  ph.textContent = catIcon(img.dataset.cat);
  img.replaceWith(ph);
}, true);

// ---------- Modal ----------
function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').classList.add('open');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  $('#modal').classList.remove('open');
  $('#modal').setAttribute('aria-hidden', 'true');
  if (!$('#cartDrawer').classList.contains('open')) document.body.classList.remove('no-scroll');
}

function quickView(id) {
  const p = productCache.get(id);
  if (!p) return;
  openModal(`
    <div class="quickview">
      <div class="qv-img"><img src="${esc(p.images[0])}" alt="${esc(p.title)}" data-cat="${p.category}"></div>
      <div class="qv-info">
        <span class="card-brand">${esc(p.brand)}</span>
        <h2>${esc(p.title)}</h2>
        ${ratingPill(p)}
        <div class="pdp-price"><span class="price">${money(p.price)}</span><span class="mrp">${money(p.mrp)}</span><span class="off">${pctOff(p)}% off</span></div>
        <p class="muted">${esc(p.description)}</p>
        <ul class="feature-list">${p.features.slice(0, 3).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="buy-row" style="margin-top:auto">
          <button class="btn btn-primary" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${ICON.cart} Add to cart</button>
          <a class="btn" href="#/product/${p.id}" data-close-modal>View details</a>
        </div>
      </div>
    </div>`);
}

// ---------- Cart drawer ----------
function openDrawer() {
  $$('#toasts .toast').forEach((t) => t.remove()); // don't let toasts cover the drawer
  renderDrawer();
  $('#cartDrawer').classList.add('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeDrawers() {
  $('#cartDrawer').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  $('#mobileNav').classList.remove('open');
  $('.filters')?.classList.remove('open');
  $('#overlay').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

function shipProgressHtml(sub) {
  const left = Math.max(0, FREE_SHIP - sub);
  const pct = Math.min(100, (sub / FREE_SHIP) * 100);
  return `${left > 0 ? `Spend <b>${money(left)}</b> more to unlock <b>FREE shipping</b> (Free over ${money(FREE_SHIP)}) 🚚` : '🎉 You qualify for <b>FREE Standard Shipping!</b>'}
    <div class="bar"><i style="width:${pct}%"></i></div>`;
}

function estDeliveryRange(method = 'standard') {
  const minDays = method === 'express' ? 1 : 3;
  const maxDays = method === 'express' ? 2 : 5;
  const d1 = fmtDate(Date.now() + minDays * 86400000, { weekday: 'short', day: 'numeric', month: 'short' });
  const d2 = fmtDate(Date.now() + maxDays * 86400000, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${d1} – ${d2}`;
}

function cartItemHtml(it) {
  return `
  <div class="cart-item">
    <a class="thumb" href="#/product/${it.id}"><img src="${esc(it.image)}" alt="" data-cat="${it.category}"></a>
    <div>
      <a class="ci-title" href="#/product/${it.id}">${esc(it.title)}</a>
      <div class="ci-meta">
        ${it.color ? `<span class="swatch-dot" style="background:${it.color}"></span>` : ''}
        ${it.size ? `<span>Size ${esc(it.size)}</span>` : ''}
        <span>${money(it.price)} each</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="qty sm">
          <button type="button" data-qty="${esc(it.key)}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span>${it.qty}</span>
          <button type="button" data-qty="${esc(it.key)}" data-delta="1" aria-label="Increase quantity" ${it.qty >= Math.min(10, it.stock) ? 'disabled' : ''}>+</button>
        </div>
        <span class="muted" style="font-size:.75rem">🚚 Est. delivery: <b>${estDeliveryRange('standard')}</b></span>
      </div>
    </div>
    <div class="ci-right">
      <b>${money(it.price * it.qty)}</b>
      <button type="button" class="link-btn" data-remove="${esc(it.key)}">🗑 Remove</button>
    </div>
  </div>`;
}

function renderDrawer() {
  const sub = cartSubtotal();
  $('#drawerCount').textContent = state.cart.length ? `(${cartCount()})` : '';
  $('#shipProgress').innerHTML = state.cart.length ? shipProgressHtml(sub) : '';
  $('#shipProgress').hidden = !state.cart.length;
  if (!state.cart.length) {
    $('#drawerBody').innerHTML = `<div class="empty"><div class="big">🛒</div><h3>Your cart is empty</h3><p>Looks like you haven't added anything yet.</p><a class="btn btn-primary" href="#/shop" data-close-drawer>Start shopping</a></div>`;
    $('#drawerFoot').innerHTML = '';
    return;
  }
  $('#drawerBody').innerHTML = state.cart.map(cartItemHtml).join('');
  const savings = state.cart.reduce((s, i) => s + (i.mrp - i.price) * i.qty, 0);
  const shipCharge = (sub >= FREE_SHIP || state.coupon === 'FREESHIP') ? 0 : 79;
  const finalTotal = sub + shipCharge;
  $('#drawerFoot').innerHTML = `
    <div class="est-delivery-box"><span>📅</span><div>Estimated delivery: <b>${estDeliveryRange('standard')}</b></div></div>
    <div class="sum-row"><span>Subtotal (${cartCount()} ${cartCount() === 1 ? 'item' : 'items'})</span><b>${money(sub)}</b></div>
    <div class="sum-row"><span>Shipping charges</span><b>${shipCharge === 0 ? '<span class="green">FREE</span>' : money(shipCharge)}</b></div>
    ${savings ? `<div class="sum-row"><span>Total savings</span><span class="green">− ${money(savings)}</span></div>` : ''}
    <div class="sum-row total"><span>Final Total</span><b>${money(finalTotal)}</b></div>
    <a class="btn btn-primary btn-block btn-checkout-cta" href="#/checkout" data-close-drawer style="margin-top:12px">${ICON.lock} Proceed to Checkout · ${money(finalTotal)} ${ICON.arrow}</a>
    <a class="btn btn-ghost btn-sm btn-block" href="#/cart" data-close-drawer style="margin-top:6px">View full cart &amp; apply coupons</a>`;
}

// ---------- Header behaviours ----------
function initHeader() {
  $('#year').textContent = new Date().getFullYear();

  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lumen:theme', next);
  });

  window.addEventListener('scroll', () => $('#header').classList.toggle('scrolled', scrollY > 10), { passive: true });

  $('#cartBtn').addEventListener('click', openDrawer);
  $('#overlay').addEventListener('click', closeDrawers);
  $('#menuBtn').addEventListener('click', () => { $('#mobileNav').classList.add('open'); $('#overlay').classList.add('show'); });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  // Search with live suggestions + keyboard navigation
  const input = $('#searchInput');
  const box = $('#suggest');
  let active = -1;
  const highlight = (text, term) => esc(text).replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>');
  const fetchSuggest = debounce(async () => {
    const term = input.value.trim();
    if (!term) { box.classList.remove('open'); return; }
    const hits = await api('/search/suggest?q=' + encodeURIComponent(term)).catch(() => []);
    active = -1;
    box.innerHTML = hits.length
      ? hits.map((h) => `<a href="#/product/${h.id}"><img src="${esc(h.image)}" alt="" data-cat="${h.category}"><div><div class="s-title">${highlight(h.title, term)}</div><div class="s-meta">${h.category} · ${money(h.price)}</div></div></a>`).join('')
        + `<a class="s-all" href="#/shop?q=${encodeURIComponent(term)}">See all results for "${esc(term)}" →</a>`
      : `<div style="padding:14px;text-align:center" class="muted">No matches for "${esc(term)}"</div>`;
    box.classList.add('open');
  }, 180);
  input.addEventListener('input', fetchSuggest);
  input.addEventListener('focus', () => input.value.trim() && fetchSuggest());
  input.addEventListener('keydown', (e) => {
    const links = $$('a', box);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('active', i === active));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && links[active]) location.hash = links[active].getAttribute('href');
      else if (input.value.trim()) location.hash = '#/shop?q=' + encodeURIComponent(input.value.trim());
      box.classList.remove('open'); input.blur();
    } else if (e.key === 'Escape') { box.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#search')) box.classList.remove('open'); });
  box.addEventListener('click', () => { box.classList.remove('open'); });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape') { closeModal(); closeDrawers(); }
  });

  $('#footerNewsletter')?.addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('You\'re subscribed! Check your inbox 💌'); });
}

// Global delegated clicks
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-add],[data-wish],[data-quick],[data-qty],[data-remove],[data-close-drawer],[data-close-modal]');
  if (!t) return;
  if (t.dataset.add) {
    e.preventDefault();
    const p = productCache.get(t.dataset.add);
    if (!p) return;
    if (p.sizes?.length) { location.hash = '#/product/' + p.id; closeModal(); return toast('Please choose a size', { type: 'error' }); }
    const before = cartCount();
    addToCart(p, { color: p.colors?.[0] || null });
    if (cartCount() > before) flyToCart(t.closest('.card, .quickview')?.querySelector('img'));
  } else if (t.dataset.wish) { e.preventDefault(); toggleWish(t.dataset.wish); }
  else if (t.dataset.quick) { e.preventDefault(); quickView(t.dataset.quick); }
  else if (t.dataset.qty) { const it = state.cart.find((i) => i.key === t.dataset.qty); if (it) setQty(it.key, it.qty + Number(t.dataset.delta)); }
  else if (t.dataset.remove) {
    const it = state.cart.find((i) => i.key === t.dataset.remove);
    removeFromCart(t.dataset.remove);
    if (it) toast(`Removed "${it.title}"`);
  }
  if (t.hasAttribute('data-close-drawer')) closeDrawers();
  if (t.hasAttribute('data-close-modal')) closeModal();
});

// ---------- Router ----------
let cleanups = [];
let renderId = 0;
const onCleanup = (fn) => cleanups.push(fn);

function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}

async function router() {
  cleanups.forEach((fn) => fn()); cleanups = [];
  closeModal();
  $('.filters')?.classList.remove('open');
  $('#mobileNav').classList.remove('open');
  if (!$('#cartDrawer').classList.contains('open')) { $('#overlay').classList.remove('show'); document.body.classList.remove('no-scroll'); }

  const { parts, query } = parseHash();
  const id = ++renderId;
  const app = $('#app');
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  window.scrollTo({ top: 0, behavior: 'instant' });

  // highlight nav
  const tag = query.get('tag');
  $$('.main-nav a').forEach((a) => a.classList.toggle('active',
    parts[0] === 'shop' && ((a.dataset.nav === 'shop' && !tag) || (a.dataset.nav === 'new' && tag === 'new') || (a.dataset.nav === 'deals' && tag === 'deal') || (a.dataset.nav === 'best' && tag === 'bestseller'))));

  const routes = {
    '': renderHome, shop: renderShop, product: renderProduct, cart: renderCartPage, checkout: renderCheckout,
    order: renderOrder, account: renderAccount, wishlist: renderWishlist, help: renderHelp,
    'mailing-list': renderInfoPage, 'gift-cards': renderInfoPage, about: renderInfoPage,
    shipping: renderInfoPage, returns: renderInfoPage, 'start-return': renderInfoPage,
    terms: renderInfoPage, privacy: renderInfoPage, contact: renderInfoPage, 'what-is-lumen': renderInfoPage,
  };
  const fn = routes[parts[0] || ''] || renderNotFound;
  try {
    await fn({ parts, query, isCurrent: () => id === renderId });
  } catch (err) {
    console.error(err);
    if (id === renderId) app.innerHTML = `<div class="container empty"><div class="big">😵</div><h2>Something went wrong</h2><p>${esc(err.message)}</p><a class="btn btn-primary" href="#/">Go home</a></div>`;
  }
  if (id === renderId) observeReveal();
}

function observeReveal() {
  const els = $$('.reveal:not(.in)');
  if (!els.length) return;
  const showAll = () => els.forEach((el) => el.classList.add('in'));
  if (!('IntersectionObserver' in window)) return showAll();
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => {
    // Anything already within the viewport is revealed right away.
    if (el.getBoundingClientRect().top < innerHeight) requestAnimationFrame(() => el.classList.add('in'));
    else io.observe(el);
  });
  // Safety net: never leave content hidden (e.g. headless browsers, programmatic scrolling).
  const t = setTimeout(showAll, 1200);
  onCleanup(() => { io.disconnect(); clearTimeout(t); });
}

const setTitle = (t) => { document.title = t ? `${t} — Lumen` : 'Lumen — Shop the things you love'; };

// ---------- Home ----------
const SLIDES = [
  { eyebrow: 'New season drop', title: 'Sound that moves<br>with you.', text: 'Studio-grade wireless audio with all-day comfort. Up to 40% off this week.', cta: '#/shop?category=electronics', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80&auto=format&fit=crop', bg: 'linear-gradient(120deg,#4338ca 0%,#7c3aed 55%,#db2777 100%)', card: ['Rated', '4.6 ★ by 2,300+'] },
  { eyebrow: 'Street ready', title: 'Step up your<br>everyday style.', text: 'Fresh sneakers, jackets and essentials designed to keep up with you.', cta: '#/shop?category=fashion', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop', bg: 'linear-gradient(120deg,#be123c 0%,#ea580c 60%,#f59e0b 100%)', card: ['Starting at', '₹699'] },
  { eyebrow: 'Make it home', title: 'Spaces that feel<br>like you.', text: 'Thoughtfully designed furniture and decor for calm, beautiful living.', cta: '#/shop?category=home', img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=80&auto=format&fit=crop', bg: 'linear-gradient(120deg,#065f46 0%,#0d9488 55%,#0ea5e9 100%)', card: ['Free delivery', 'on orders ₹999+'] },
];

async function renderHome(ctx) {
  setTitle('');
  state.categories = await api('/categories').catch(() => state.categories);
  if (!ctx.isCurrent()) return;
  const app = $('#app');
  app.innerHTML = `
  <section class="hero container">
    <div class="hero-slider" id="heroSlider">
      ${SLIDES.map((s, i) => `
        <div class="slide ${i === 0 ? 'active' : ''}">
          <div class="slide-bg" style="background:${s.bg}"></div>
          <div class="slide-content">
            <span class="eyebrow">${s.eyebrow}</span>
            <h1>${s.title}</h1>
            <p>${s.text}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="${s.cta}">Shop now ${ICON.arrow}</a><a class="btn btn-outline-light" href="#/shop?tag=deal">View deals</a></div>
          </div>
          <div class="slide-media"><img src="${s.img}" alt=""><div class="float-card"><span>${s.card[0]}</span><b>${s.card[1]}</b></div></div>
        </div>`).join('')}
      <div class="hero-dots">${SLIDES.map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>
      <div class="hero-arrows"><button data-dir="-1" aria-label="Previous">${ICON.left}</button><button data-dir="1" aria-label="Next">${ICON.right}</button></div>
    </div>
    <div class="perks">
      <div class="perk"><div class="ico">🚚</div><div><b>Free shipping</b><span>On orders over ₹999</span></div></div>
      <div class="perk"><div class="ico">↩️</div><div><b>Easy returns</b><span>10-day hassle-free returns</span></div></div>
      <div class="perk"><div class="ico">🔒</div><div><b>Secure payments</b><span>Cards, UPI & COD</span></div></div>
      <div class="perk"><div class="ico">💬</div><div><b>24/7 support</b><span>We're always here to help</span></div></div>
    </div>
  </section>

  <section class="section container reveal">
    <div class="section-head"><div><h2>Shop by category</h2><p>Find exactly what you're looking for</p></div><a class="link-arrow" href="#/shop">Browse all ${ICON.arrow}</a></div>
    <div class="cat-grid">${state.categories.map((c) => `
      <a class="cat-card" href="#/shop?category=${c.id}" style="--c:${c.color}"><div class="cat-ico">${c.icon}</div><b>${esc(c.name)}</b><span>${c.count} products</span></a>`).join('')}
    </div>
  </section>

  <section class="section container reveal">
    <div class="deal">
      <div><span class="tag sale" style="margin-bottom:12px">⚡ Flash sale</span><h2>Deals of the day — up to 50% off</h2><p>Hurry! Prices go back up when the timer hits zero.</p>
        <a class="btn btn-primary" style="margin-top:18px" href="#/shop?tag=deal&sort=discount">Grab the deals ${ICON.arrow}</a></div>
      <div class="countdown" id="countdown"></div>
    </div>
  </section>

  <section class="section container reveal">
    <div class="section-head"><div><h2>Trending now</h2><p>What everyone's adding to their carts</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="trendTabs">
        <button class="chip active" data-tag="bestseller">🔥 Bestsellers</button>
        <button class="chip" data-tag="new">✨ New</button>
        <button class="chip" data-tag="deal">💸 Deals</button>
      </div>
    </div>
    <div class="product-grid" id="trendGrid">${skeletonCards(8)}</div>
  </section>

  <section class="section container reveal" id="recentSection" hidden>
    <div class="section-head"><div><h2>Recently viewed</h2><p>Pick up where you left off</p></div></div>
    <div class="h-scroll" id="recentGrid"></div>
  </section>

  <section class="section container reveal">
    <div class="newsletter-band">
      <h2>Get ₹250 off your first order</h2>
      <p class="muted">Join 120,000+ shoppers getting early access to drops and members-only deals.</p>
      <form class="newsletter" id="homeNewsletter"><input type="email" placeholder="Enter your email" required aria-label="Email"><button class="btn btn-primary">Subscribe</button></form>
    </div>
  </section>`;

  observeReveal(); // reveal sections immediately, without waiting for product data

  // Hero slider
  let cur = 0;
  const slides = $$('.slide', app);
  const dots = $$('.hero-dots button', app);
  const go = (n) => {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === cur));
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  };
  let timer = setInterval(() => go(cur + 1), 5500);
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5500); };
  dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.slide)); restart(); }));
  $$('.hero-arrows button', app).forEach((b) => b.addEventListener('click', () => { go(cur + Number(b.dataset.dir)); restart(); }));
  let touchX = null;
  const slider = $('#heroSlider');
  slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); } touchX = null; });
  onCleanup(() => clearInterval(timer));

  // Countdown to midnight
  const cd = $('#countdown');
  const tick = () => {
    const end = new Date(); end.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    cd.innerHTML = [['Hours', h], ['Mins', m], ['Secs', s]].map(([l, v]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
  };
  tick();
  const cdTimer = setInterval(tick, 1000);
  onCleanup(() => clearInterval(cdTimer));

  // Trending tabs
  const loadTrend = async (tag) => {
    $('#trendGrid').innerHTML = skeletonCards(8);
    const { items } = await api(`/products?tag=${tag}&limit=8&sort=popular`);
    if (!ctx.isCurrent()) return;
    cacheProducts(items);
    $('#trendGrid').innerHTML = items.map(productCard).join('');
  };
  $('#trendTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]');
    if (!b) return;
    $$('#trendTabs .chip').forEach((c) => c.classList.toggle('active', c === b));
    loadTrend(b.dataset.tag);
  });
  $('#homeNewsletter').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('Welcome aboard! Use code WELCOME10 at checkout 🎉'); });

  await loadTrend('bestseller');

  if (state.recent.length) {
    const { items } = await api('/products?limit=12&ids=' + state.recent.join(','));
    if (!ctx.isCurrent() || !items.length) return;
    cacheProducts(items);
    const ordered = state.recent.map((id) => items.find((p) => p.id === id)).filter(Boolean);
    $('#recentGrid').innerHTML = ordered.map(productCard).join('');
    $('#recentSection').hidden = false;
  }
}

// ---------- Shop / listing ----------
const SORTS = [['popular', 'Popularity'], ['newest', 'Newest first'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['rating', 'Customer rating'], ['discount', 'Biggest discount']];

async function renderShop({ query, isCurrent }) {
  const f = {
    q: query.get('q') || '',
    category: (query.get('category') || '').split(',').filter(Boolean),
    brand: (query.get('brand') || '').split(',').filter(Boolean),
    min: Number(query.get('min')) || 0,
    max: Number(query.get('max')) || 0,
    rating: Number(query.get('rating')) || 0,
    inStock: query.get('inStock') === '1',
    sort: query.get('sort') || 'popular',
    tag: query.get('tag') || '',
    page: Number(query.get('page')) || 1,
  };
  let view = store.get('view', 'grid');

  const titleFor = () => f.q ? `Results for "${f.q}"`
    : f.tag === 'new' ? 'New arrivals' : f.tag === 'deal' ? 'Today\'s deals' : f.tag === 'bestseller' ? 'Bestsellers'
      : f.category.length === 1 ? state.categories.find((c) => c.id === f.category[0])?.name || 'Shop' : 'All products';
  setTitle(titleFor());

  // First fetch facets to build the price slider bounds
  const [first] = await Promise.all([api('/products?limit=1'), api('/categories').then((c) => { state.categories = c; }).catch(() => {})]);
  if (!isCurrent()) return;
  const { brands = [], minPrice = 0, maxPrice = 100000 } = first?.facets || {};
  const lo = Math.floor(minPrice / 100) * 100;
  const hi = Math.max(lo + 1000, Math.ceil(maxPrice / 1000) * 1000);
  if (!f.max) f.max = hi;
  if (!f.min) f.min = lo;

  $('#app').innerHTML = `
  <div class="container page-head">
    <div class="breadcrumbs"><a href="#/">Home</a> / <span>Shop</span></div>
    <h1 id="shopTitle">${esc(titleFor())}</h1>
  </div>
  <div class="container shop-layout">
    <aside class="filters" id="filters">
      <div class="filters-head"><b>Filters</b><button class="link-btn" id="clearFilters">Clear all</button></div>
      <h4>Category</h4>
      ${state.categories.map((c) => `<label class="check"><input type="checkbox" name="category" value="${c.id}" ${f.category.includes(c.id) ? 'checked' : ''}> ${c.icon} ${esc(c.name)} <span class="count">${c.count}</span></label>`).join('')}
      <h4>Price</h4>
      <div class="range-vals"><span id="minVal"></span><span id="maxVal"></span></div>
      <div class="range-wrap">
        <div class="range-track"><div class="range-fill" id="rangeFill"></div></div>
        <input type="range" id="minRange" min="${lo}" max="${hi}" step="100" value="${f.min}" aria-label="Minimum price">
        <input type="range" id="maxRange" min="${lo}" max="${hi}" step="100" value="${f.max}" aria-label="Maximum price">
      </div>
      <h4>Customer rating</h4>
      ${[4.5, 4, 3].map((r) => `<label class="check"><input type="radio" name="rating" value="${r}" ${f.rating === r ? 'checked' : ''}> <span class="stars">${stars(r)}</span> ${r}+ </label>`).join('')}
      <label class="check"><input type="radio" name="rating" value="0" ${!f.rating ? 'checked' : ''}> Any rating</label>
      <h4>Brand</h4>
      ${brands.map((b) => `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${f.brand.includes(b) ? 'checked' : ''}> ${esc(b)}</label>`).join('')}
      <h4>Availability</h4>
      <label class="check"><input type="checkbox" name="inStock" ${f.inStock ? 'checked' : ''}> In stock only</label>
    </aside>
    <section>
      <div class="toolbar">
        <button class="btn btn-sm filter-toggle" id="filterToggle">${ICON.filter} Filters</button>
        <span class="result-count" id="resultCount"></span>
        <span class="spacer"></span>
        <select id="sortSel" aria-label="Sort">${SORTS.map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="view-toggle">
          <button data-view="grid" class="${view === 'grid' ? 'active' : ''}" aria-label="Grid view">${ICON.grid}</button>
          <button data-view="list" class="${view === 'list' ? 'active' : ''}" aria-label="List view">${ICON.list}</button>
        </div>
      </div>
      <div class="active-filters" id="activeFilters"></div>
      <div class="product-grid ${view}" id="shopGrid">${skeletonCards(9)}</div>
      <div class="pagination" id="pagination"></div>
    </section>
  </div>`;

  const minR = $('#minRange'), maxR = $('#maxRange');
  const paintRange = () => {
    const a = Number(minR.value), b = Number(maxR.value);
    $('#minVal').textContent = money(a); $('#maxVal').textContent = money(b);
    const fill = $('#rangeFill');
    fill.style.left = ((a - lo) / (hi - lo)) * 100 + '%';
    fill.style.right = 100 - ((b - lo) / (hi - lo)) * 100 + '%';
  };
  paintRange();

  const syncUrl = () => {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q);
    if (f.tag) p.set('tag', f.tag);
    if (f.category.length) p.set('category', f.category.join(','));
    if (f.brand.length) p.set('brand', f.brand.join(','));
    if (f.min > lo) p.set('min', f.min);
    if (f.max < hi) p.set('max', f.max);
    if (f.rating) p.set('rating', f.rating);
    if (f.inStock) p.set('inStock', '1');
    if (f.sort !== 'popular') p.set('sort', f.sort);
    if (f.page > 1) p.set('page', f.page);
    const s = p.toString();
    history.replaceState(null, '', '#/shop' + (s ? '?' + s : ''));
  };

  const renderChips = () => {
    const chips = [];
    if (f.q) chips.push(['q', `"${f.q}"`]);
    if (f.tag) chips.push(['tag', { new: 'New', deal: 'Deals', bestseller: 'Bestsellers' }[f.tag] || f.tag]);
    f.category.forEach((c) => chips.push(['category:' + c, state.categories.find((x) => x.id === c)?.name || c]));
    f.brand.forEach((b) => chips.push(['brand:' + b, b]));
    if (f.min > lo || f.max < hi) chips.push(['price', `${money(f.min)} – ${money(f.max)}`]);
    if (f.rating) chips.push(['rating', `${f.rating}★ & up`]);
    if (f.inStock) chips.push(['inStock', 'In stock']);
    $('#activeFilters').innerHTML = chips.map(([k, l]) => `<span class="chip">${esc(l)}<button data-chip="${esc(k)}" aria-label="Remove filter">✕</button></span>`).join('');
  };

  let reqId = 0;
  const load = async () => {
    const my = ++reqId;
    syncUrl(); renderChips();
    $('#shopTitle').textContent = titleFor();
    $('#shopGrid').innerHTML = skeletonCards(6);
    const p = new URLSearchParams({ limit: 9, page: f.page, sort: f.sort });
    if (f.q) p.set('q', f.q);
    if (f.tag) p.set('tag', f.tag);
    if (f.category.length) p.set('category', f.category.join(','));
    if (f.brand.length) p.set('brand', f.brand.join(','));
    if (f.min > lo) p.set('min', f.min);
    if (f.max < hi) p.set('max', f.max);
    if (f.rating) p.set('rating', f.rating);
    if (f.inStock) p.set('inStock', '1');
    const data = await api('/products?' + p);
    if (my !== reqId || !isCurrent()) return;
    cacheProducts(data.items);
    $('#resultCount').textContent = `${data.total} product${data.total === 1 ? '' : 's'}`;
    $('#shopGrid').innerHTML = data.items.length ? data.items.map(productCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div><h3>No products found</h3><p>Try removing some filters or searching for something else.</p><button class="btn btn-primary" id="emptyClear">Clear filters</button></div>`;
    $('#emptyClear')?.addEventListener('click', clearAll);
    $('#pagination').innerHTML = data.pages > 1 ? `
      <button data-page="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>
      ${Array.from({ length: data.pages }, (_, i) => `<button data-page="${i + 1}" class="${i + 1 === f.page ? 'active' : ''}">${i + 1}</button>`).join('')}
      <button data-page="${f.page + 1}" ${f.page >= data.pages ? 'disabled' : ''} aria-label="Next page">›</button>` : '';
  };

  const clearAll = () => {
    Object.assign(f, { q: '', category: [], brand: [], min: lo, max: hi, rating: 0, inStock: false, tag: '', page: 1 });
    $$('#filters input[type=checkbox]').forEach((i) => { i.checked = false; });
    $('#filters input[name=rating][value="0"]').checked = true;
    minR.value = lo; maxR.value = hi; paintRange();
    $('#searchInput').value = '';
    load();
  };

  $('#filters').addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'category') f.category = $$('#filters input[name=category]:checked').map((i) => i.value);
    if (el.name === 'brand') f.brand = $$('#filters input[name=brand]:checked').map((i) => i.value);
    if (el.name === 'rating') f.rating = Number(el.value);
    if (el.name === 'inStock') f.inStock = el.checked;
    if (el.type === 'range') { f.min = Number(minR.value); f.max = Number(maxR.value); }
    f.page = 1;
    load();
  });
  const onRange = (e) => {
    if (Number(minR.value) > Number(maxR.value) - 500) {
      if (e.target === minR) minR.value = Number(maxR.value) - 500; else maxR.value = Number(minR.value) + 500;
    }
    paintRange();
  };
  minR.addEventListener('input', onRange); maxR.addEventListener('input', onRange);
  $('#clearFilters').addEventListener('click', clearAll);
  $('#sortSel').addEventListener('change', (e) => { f.sort = e.target.value; f.page = 1; load(); });
  $('#filterToggle').addEventListener('click', () => { $('#filters').classList.add('open'); $('#overlay').classList.add('show'); });
  $$('.view-toggle button').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view; store.set('view', view);
    $$('.view-toggle button').forEach((x) => x.classList.toggle('active', x === b));
    $('#shopGrid').className = 'product-grid ' + view;
  }));
  $('#pagination').addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    f.page = Number(b.dataset.page); load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#activeFilters').addEventListener('click', (e) => {
    const k = e.target.closest('[data-chip]')?.dataset.chip;
    if (!k) return;
    if (k === 'q') { f.q = ''; $('#searchInput').value = ''; }
    else if (k === 'tag') f.tag = '';
    else if (k.startsWith('category:')) { f.category = f.category.filter((c) => c !== k.slice(9)); $(`#filters input[name=category][value="${k.slice(9)}"]`).checked = false; }
    else if (k.startsWith('brand:')) { f.brand = f.brand.filter((b) => b !== k.slice(6)); $$('#filters input[name=brand]').forEach((i) => { if (i.value === k.slice(6)) i.checked = false; }); }
    else if (k === 'price') { f.min = lo; f.max = hi; minR.value = lo; maxR.value = hi; paintRange(); }
    else if (k === 'rating') { f.rating = 0; $('#filters input[name=rating][value="0"]').checked = true; }
    else if (k === 'inStock') { f.inStock = false; $('#filters input[name=inStock]').checked = false; }
    f.page = 1; load();
  });

  if (f.q) $('#searchInput').value = f.q;
  await load();
}

// ---------- Product detail ----------
async function renderProduct({ parts, isCurrent }) {
  $('#app').innerHTML = `<div class="container pdp"><div class="skeleton" style="aspect-ratio:1;border-radius:24px"></div>
    <div style="display:grid;gap:14px;align-content:start"><div class="skeleton" style="height:16px;width:30%"></div><div class="skeleton" style="height:40px"></div><div class="skeleton" style="height:20px;width:50%"></div><div class="skeleton" style="height:120px"></div></div></div>`;
  const { product: p, related, reviews } = await api('/products/' + parts[1]);
  if (!isCurrent()) return;
  cacheProducts([p, ...related]);
  setTitle(p.title);
  state.recent = [p.id, ...state.recent.filter((x) => x !== p.id)].slice(0, 10);
  store.set('recent', state.recent);

  const cat = state.categories.find((c) => c.id === p.category);
  const sel = { color: p.colors?.[0] || null, size: null, qty: 1, img: 0 };
  const stockCls = p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : '';
  const stockTxt = p.stock <= 0 ? 'Out of stock' : p.stock <= 10 ? `Hurry, only ${p.stock} left in stock!` : 'In stock — ready to ship';
  const dist = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : p.rating;

  $('#app').innerHTML = `
  <div class="container page-head" style="padding-bottom:0">
    <div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/shop?category=${p.category}">${esc(cat?.name || p.category)}</a> / <span>${esc(p.title)}</span></div>
  </div>
  <div class="container pdp">
    <div class="gallery">
      <div class="thumbs">${p.images.map((src, i) => `<button class="${i === 0 ? 'active' : ''}" data-img="${i}" aria-label="Image ${i + 1}"><img src="${esc(src)}" alt="" data-cat="${p.category}"></button>`).join('')}</div>
      <div class="main-img" id="mainImg"><img src="${esc(p.images[0])}" alt="${esc(p.title)}" data-cat="${p.category}"></div>
    </div>
    <div class="pdp-info">
      <span class="brand">${esc(p.brand)}</span>
      <h1>${esc(p.title)}</h1>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${ratingPill(p)}
        <a href="#reviews" class="muted" style="font-size:.85rem;text-decoration:underline" id="toReviews">Read reviews</a>
        ${p.tags.includes('bestseller') ? '<span class="tag best">Bestseller</span>' : ''}
      </div>
      <div class="pdp-price"><span class="price">${money(p.price)}</span><span class="mrp">${money(p.mrp)}</span><span class="off">${pctOff(p)}% off</span></div>
      <div class="tax-note">Inclusive of all taxes · You save ${money(p.mrp - p.price)}</div>

      ${p.colors?.length ? `<div class="opt-group"><b>Colour</b><div class="color-opts">${p.colors.map((c, i) => `<button class="color-opt ${i === 0 ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>` : ''}
      ${p.sizes?.length ? `<div class="opt-group"><b>Size <span class="muted" style="font-weight:500" id="sizeHint">— please select</span></b><div class="size-opts">${p.sizes.map((s) => `<button class="size-opt" data-size="${s}">${s}</button>`).join('')}</div></div>` : ''}

      <div class="stock-line ${stockCls}"><span class="dot"></span>${stockTxt}</div>

      <div class="buy-row">
        <div class="qty"><button id="qMinus" aria-label="Decrease" disabled>−</button><span id="qVal">1</span><button id="qPlus" aria-label="Increase" ${p.stock <= 1 ? 'disabled' : ''}>+</button></div>
        <button class="btn btn-dark" id="addBtn" ${p.stock <= 0 ? 'disabled' : ''}>${ICON.cart} Add to cart</button>
        <button class="btn btn-primary" id="buyBtn" ${p.stock <= 0 ? 'disabled' : ''}>Buy now</button>
        <button class="round-btn ${state.wishlist.includes(p.id) ? 'wished' : ''}" data-wish="${p.id}" aria-label="Wishlist" style="width:52px;height:52px">${ICON.heart}</button>
        <button class="round-btn" id="shareBtn" aria-label="Share" style="width:52px;height:52px">${ICON.share}</button>
      </div>

      <div class="opt-group" style="margin-bottom:0">
        <b>Check delivery</b>
        <form class="pincode" id="pinForm"><input class="input" id="pinInput" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit PIN code" value="${esc(store.get('pincode', ''))}"><button class="btn">Check</button></form>
        <div class="pincode-result" id="pinResult"></div>
      </div>

      <div class="assure"><div><span>🚚</span>Free delivery over ₹999</div><div><span>↩️</span>10-day easy returns</div><div><span>🛡️</span>Genuine & warranty</div></div>

      <div class="tabs" id="tabs" role="tablist">
        <button class="active" data-tab="desc">Description</button>
        <button data-tab="specs">Specifications</button>
        <button data-tab="reviews" id="reviewsTab">Reviews (${reviews.length})</button>
      </div>
      <div id="tabPanel" class="tab-panel"></div>
    </div>
  </div>
  ${related.length ? `<section class="section container reveal"><div class="section-head"><div><h2>You may also like</h2><p>More from ${esc(cat?.name || '')}</p></div></div><div class="h-scroll">${related.map(productCard).join('')}</div></section>` : ''}`;

  // Gallery + zoom
  const main = $('#mainImg');
  $$('.thumbs button').forEach((b) => b.addEventListener('click', () => {
    $$('.thumbs button').forEach((x) => x.classList.toggle('active', x === b));
    const im = $('img', main); if (im) im.src = p.images[Number(b.dataset.img)];
  }));
  main.addEventListener('mousemove', (e) => {
    const r = main.getBoundingClientRect();
    const im = $('img', main); if (!im) return;
    im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  main.addEventListener('mouseenter', () => main.classList.add('zoom'));
  main.addEventListener('mouseleave', () => main.classList.remove('zoom'));

  // Options
  $$('.color-opt').forEach((b) => b.addEventListener('click', () => { sel.color = b.dataset.color; $$('.color-opt').forEach((x) => x.classList.toggle('active', x === b)); }));
  $$('.size-opt').forEach((b) => b.addEventListener('click', () => { sel.size = b.dataset.size; $$('.size-opt').forEach((x) => x.classList.toggle('active', x === b)); $('#sizeHint').textContent = ''; }));
  const maxQ = Math.min(10, p.stock);
  const paintQty = () => { $('#qVal').textContent = sel.qty; $('#qMinus').disabled = sel.qty <= 1; $('#qPlus').disabled = sel.qty >= maxQ; };
  $('#qMinus').addEventListener('click', () => { sel.qty = Math.max(1, sel.qty - 1); paintQty(); });
  $('#qPlus').addEventListener('click', () => { sel.qty = Math.min(maxQ, sel.qty + 1); paintQty(); });

  const doAdd = (silent) => {
    if (p.sizes?.length && !sel.size) {
      $('#sizeHint').textContent = '— please select a size';
      $('#sizeHint').style.color = 'var(--danger)';
      $('.size-opts').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      return false;
    }
    const before = cartCount();
    addToCart(p, { qty: sel.qty, color: sel.color, size: sel.size, silent });
    return cartCount() > before;
  };
  $('#addBtn').addEventListener('click', () => { if (doAdd(false)) flyToCart($('img', main)); });
  $('#buyBtn').addEventListener('click', () => { if (doAdd(true)) location.hash = '#/checkout'; });
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); }
    } catch { /* user cancelled */ }
  });

  // Pincode check (simulated serviceability)
  const checkPin = () => {
    const v = $('#pinInput').value.trim();
    const out = $('#pinResult');
    if (!/^[1-9]\d{5}$/.test(v)) { out.innerHTML = '<span style="color:var(--danger)">Please enter a valid 6-digit PIN code</span>'; return; }
    store.set('pincode', v);
    const days = 2 + (Number(v[0]) % 4);
    const d = new Date(Date.now() + days * 86400000);
    out.innerHTML = `✅ Delivery by <b>${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}</b> · ${p.price >= FREE_SHIP ? 'Free delivery' : '₹79 delivery'} · COD available`;
  };
  $('#pinForm').addEventListener('submit', (e) => { e.preventDefault(); checkPin(); });
  if ($('#pinInput').value) checkPin();

  // Tabs
  const panels = {
    desc: () => `<p>${esc(p.description)}</p><ul class="feature-list">${p.features.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`,
    specs: () => `<table class="spec-table">${Object.entries({ Brand: p.brand, Category: cat?.name, ...p.specs }).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`,
    reviews: () => `
      <div class="review-summary">
        <div class="score"><b>${avg.toFixed(1)}</b><div class="stars">${stars(avg)}</div><span class="muted" style="font-size:.8rem">${reviews.length} reviews</span></div>
        <div style="display:grid;gap:6px">${dist.map((n, i) => `<div class="bar-row"><span>${5 - i}★</span><div class="bar"><i style="width:${reviews.length ? (n / reviews.length) * 100 : 0}%"></i></div><span class="muted">${n}</span></div>`).join('')}</div>
      </div>
      ${state.user ? `
        <form class="panel" id="reviewForm" style="margin-bottom:10px">
          <h3>Write a review</h3>
          <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="star${n}" value="${n}"><label for="star${n}" title="${n} stars">★</label>`).join('')}</div>
          <textarea class="input" name="text" rows="3" placeholder="What did you like or dislike?" style="margin:10px 0"></textarea>
          <button class="btn btn-primary btn-sm">Submit review</button>
        </form>` : `<p class="muted"><a href="#/account" style="color:var(--primary);font-weight:700">Sign in</a> to write a review.</p>`}
      <div id="reviewList">${reviews.map(reviewHtml).join('')}</div>`,
  };
  const showTab = (name) => {
    $$('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $('#tabPanel').innerHTML = panels[name]();
    if (name === 'reviews') bindReviewForm();
  };
  const bindReviewForm = () => {
    $('#reviewForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const r = await api(`/products/${p.id}/reviews`, { method: 'POST', body: { rating: fd.get('rating'), text: fd.get('text') } });
        reviews.unshift(r);
        dist[5 - r.rating]++;
        $('#reviewsTab').textContent = `Reviews (${reviews.length})`;
        showTab('reviews');
        toast('Thanks for your review!');
      } catch (err) { toast(err.message, { type: 'error' }); }
    });
  };
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#toReviews').addEventListener('click', (e) => { e.preventDefault(); showTab('reviews'); $('#tabs').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  showTab('desc');
}

const reviewHtml = (r) => `
  <div class="review">
    <div class="review-head"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b><span class="stars">${stars(r.rating)}</span>
      ${r.verified ? '<span class="verified">✔ Verified purchase</span>' : ''}<span class="muted" style="font-size:.8rem;margin-left:auto">${fmtDate(r.date)}</span></div>
    <p style="margin:0">${esc(r.text)}</p>
  </div>`;

// ---------- Cart page ----------
async function renderCartPage() {
  setTitle('Cart');
  const app = $('#app');
  if (!state.cart.length) {
    app.innerHTML = `<div class="container empty"><div class="big">🛒</div><h2>Your cart is empty</h2><p>Discover something you'll love.</p><a class="btn btn-primary" href="#/shop">Continue shopping</a></div>`;
    return;
  }
  app.innerHTML = `
  <div class="container page-head"><div class="breadcrumbs"><a href="#/">Home</a> / <span>Cart</span></div><h1>Shopping cart <span class="muted" style="font-size:1rem">(${cartCount()} items)</span></h1></div>
  <div class="container two-col">
    <div>
      <div class="panel"><div class="ship-progress" style="padding:0 0 14px;border:0">${shipProgressHtml(cartSubtotal())}</div>${state.cart.map(cartItemHtml).join('')}</div>
      <a class="link-arrow" href="#/shop" style="margin-top:18px;display:inline-flex">← Continue shopping</a>
    </div>
    <aside class="panel sticky" id="summary">${summarySkeleton()}</aside>
  </div>`;
  await renderSummary($('#summary'), { cta: true });
}

const summarySkeleton = () => '<div class="skeleton" style="height:18px;width:50%;margin-bottom:16px"></div><div class="skeleton" style="height:120px"></div>';

// Shared order summary w/ coupon, priced by the server
async function renderSummary(el, { cta = false, shippingMethod = 'standard', items = false } = {}) {
  const body = { items: state.cart.map(({ id, qty, color, size }) => ({ id, qty, color, size })), coupon: state.coupon, shippingMethod };
  let quote;
  try {
    quote = await api('/cart/quote', { method: 'POST', body });
  } catch (err) {
    if (state.coupon) { // drop an invalid coupon and retry
      toast(err.message, { type: 'error' });
      state.coupon = null; store.set('coupon', null);
      return renderSummary(el, { cta, shippingMethod, items });
    }
    el.innerHTML = `<p style="color:var(--danger)">${esc(err.message)}</p>`;
    return null;
  }
  const leftForFree = Math.max(0, FREE_SHIP - (quote.subtotal - quote.discount));
  el.innerHTML = `
    <h3>Order summary</h3>
    ${items ? `<div class="mini-items">${state.cart.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt="" data-cat="${i.category}"><i>${i.qty}</i></div><span class="mi-title">${esc(i.title)}${i.size ? ` · ${esc(i.size)}` : ''}</span><b>${money(i.price * i.qty)}</b></div>`).join('')}</div>` : ''}
    <div class="est-delivery-box">
      <span>🚚</span>
      <div>
        <div>Estimated delivery: <b>${estDeliveryRange(quote.shippingMethod)}</b></div>
        <div class="muted" style="font-size:.76rem">${quote.shipping === 0 ? '🎉 Eligible for FREE delivery' : `Spend ${money(leftForFree)} more to qualify for FREE delivery`}</div>
      </div>
    </div>
    ${quote.coupon
      ? `<div class="applied"><span>🏷️ ${esc(quote.coupon.code)} — ${esc(quote.coupon.label)}</span><button class="link-btn" id="rmCoupon">Remove</button></div>`
      : `<form class="coupon-row" id="couponForm"><input class="input" name="code" placeholder="Coupon code" aria-label="Coupon code"><button class="btn btn-sm" style="height:42px">Apply</button></form>
         <div class="coupon-hints"><span class="muted" style="font-size:.75rem">Try:</span>${['WELCOME10', 'FLAT500', 'FREESHIP'].map((c) => `<button type="button" data-coupon="${c}">${c}</button>`).join('')}</div>`}
    <div style="margin-top:16px">
      <div class="sum-row"><span>Subtotal (${cartCount()} ${cartCount() === 1 ? 'item' : 'items'})</span><b>${money(quote.subtotal)}</b></div>
      ${quote.discount ? `<div class="sum-row"><span>Coupon discount (${esc(quote.coupon.code)})</span><span class="green">− ${money(quote.discount)}</span></div>` : ''}
      <div class="sum-row"><span>Shipping charges ${quote.shippingMethod === 'express' ? '(Express)' : '(Standard)'}</span><b>${quote.shipping ? money(quote.shipping) : '<span class="green">FREE (₹0)</span>'}</b></div>
      <div class="sum-row total"><span>Final Total</span><span>${money(quote.total)}</span></div>
    </div>
    ${cta ? `<a class="btn btn-primary btn-block btn-checkout-cta" href="#/checkout" style="margin-top:16px">${ICON.lock} Proceed to Checkout · ${money(quote.total)} ${ICON.arrow}</a>` : ''}
    <div class="secure-note">${ICON.lock} Guest &amp; member checkout · UPI, Cards, NetBanking &amp; COD</div>`;

  const apply = async (code) => {
    state.coupon = code.trim().toUpperCase();
    try {
      await api('/cart/quote', { method: 'POST', body: { ...body, coupon: state.coupon } });
      store.set('coupon', state.coupon);
      toast(`Coupon ${state.coupon} applied! 🎉`);
    } catch (err) { state.coupon = null; toast(err.message, { type: 'error' }); }
    renderSummary(el, { cta, shippingMethod, items });
  };
  $('#couponForm', el)?.addEventListener('submit', (e) => { e.preventDefault(); const v = e.target.code.value; if (v.trim()) apply(v); });
  $$('[data-coupon]', el).forEach((b) => b.addEventListener('click', () => apply(b.dataset.coupon)));
  $('#rmCoupon', el)?.addEventListener('click', () => { state.coupon = null; store.set('coupon', null); renderSummary(el, { cta, shippingMethod, items }); });
  return quote;
}

// ---------- Checkout ----------
function luhn(num) {
  let sum = 0, dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}
const cardBrand = (n) => /^4/.test(n) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^(60|65|81|82|508)/.test(n) ? 'RuPay' : /^3[47]/.test(n) ? 'AMEX' : '';

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

const TOP_BANKS = [
  { code: 'HDFC', name: 'HDFC Bank', color: '#004c8f' },
  { code: 'ICICI', name: 'ICICI Bank', color: '#f37021' },
  { code: 'SBI', name: 'State Bank of India', color: '#1d4ed8' },
  { code: 'AXIS', name: 'Axis Bank', color: '#97144d' },
  { code: 'KOTAK', name: 'Kotak Mahindra', color: '#ed1c24' },
  { code: 'IDFC', name: 'IDFC FIRST Bank', color: '#9b1c1c' },
];
const ALL_BANKS = [
  ...TOP_BANKS,
  { code: 'PNB', name: 'Punjab National Bank', color: '#a20c3b' },
  { code: 'BOB', name: 'Bank of Baroda', color: '#f26522' },
  { code: 'INDUS', name: 'IndusInd Bank', color: '#832625' },
  { code: 'YES', name: 'Yes Bank', color: '#00518f' },
];
const UPI_APPS = [
  { id: 'Google Pay', short: 'GPay', handle: '@okicici', bg: 'linear-gradient(135deg,#4285f4,#34a853)' },
  { id: 'PhonePe', short: 'Pe', handle: '@ybl', bg: 'linear-gradient(135deg,#5f259f,#7c3aed)' },
  { id: 'Paytm', short: 'Pay', handle: '@paytm', bg: 'linear-gradient(135deg,#002970,#00baf2)' },
  { id: 'BHIM UPI', short: 'BHIM', handle: '@upi', bg: 'linear-gradient(135deg,#ea580c,#16a34a)' },
];

// Deterministic SVG QR Matrix generator for dynamic UPI intent URI
function upiQrSvg(text) {
  const N = 21;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const finderBit = (r, c) => r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  let rects = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let on = false;
      if (inFinder(r, c)) {
        const lr = r >= N - 7 ? r - (N - 7) : r;
        const lc = c >= N - 7 ? c - (N - 7) : c;
        on = finderBit(lr, lc);
      } else if (r === 6 || c === 6) {
        on = (r + c) % 2 === 0;
      } else {
        h ^= (r * 31 + c * 17) & 0xff;
        h = Math.imul(h, 16777619);
        on = (h & 3) !== 0;
      }
      if (on) rects += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" fill="#0f1222">${rects}</svg>`;
}

// Simulated 3DS 2.0 / NetBanking / UPI Collect gateway authorization modal
function authorizeGatewayModal({ title, subtitle, badge, amount, mode = 'otp' }) {
  return new Promise((resolve) => {
    const demoOtp = String(100000 + Math.floor(Math.random() * 900000));
    openModal(`
      <div class="gateway-box">
        <div class="gateway-head">
          <div><b style="font-size:1.05rem">${esc(title)}</b><div class="muted" style="font-size:.78rem">${esc(subtitle)}</div></div>
          <span class="pill-s blue" style="padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);font-weight:800;font-size:.75rem">${esc(badge)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 14px;border-radius:12px;background:var(--surface-2);margin-bottom:16px;font-size:.9rem">
          <span>Merchant: <b>Lumen Retail Pvt. Ltd.</b></span>
          <b>${money(amount)}</b>
        </div>
        ${mode === 'netbanking' ? `
          <form id="gwForm" class="form-stack">
            <div class="field"><label>Customer ID / NetBanking User ID</label><input class="input" name="uid" value="DEMOUSER882" required></div>
            <div class="field"><label>Transaction Password / MPIN</label><input class="input" type="password" name="mpin" value="123456" required></div>
            <p class="muted" style="font-size:.78rem;margin:0">🔒 256-bit TLS bank portal simulation. Pre-filled with demo credentials — click Authorize to complete.</p>
            <div class="grid-2" style="margin-top:6px">
              <button type="button" class="btn" id="gwCancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="gwSubmit">Authorize ${money(amount)}</button>
            </div>
          </form>
        ` : mode === 'upi' ? `
          <div style="text-align:center;padding:8px 0 14px">
            <div style="font-size:2.4rem;margin-bottom:6px">📲</div>
            <b>Approve collect request in your UPI app</b>
            <p class="muted" style="font-size:.85rem;margin:6px 0 14px">We sent a collect request for <b>${money(amount)}</b>. Approve it on your phone or click below to simulate instant NPCI callback.</p>
            <div class="grid-2">
              <button type="button" class="btn" id="gwCancel">Cancel</button>
              <button type="button" class="btn btn-primary" id="gwApprove">Simulate UPI Approval ✓</button>
            </div>
          </div>
        ` : `
          <form id="gwForm">
            <p style="font-size:.88rem;margin:0 0 8px;text-align:center">Enter the 6-digit 3D Secure OTP sent to your registered mobile/email</p>
            <div style="text-align:center;margin-bottom:8px"><span class="chip" style="font-size:.78rem;background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);border:0">Demo OTP: <b id="demoOtpCode">${demoOtp}</b> <button type="button" class="link-btn" id="fillOtp" style="margin-left:6px;color:var(--primary);font-weight:800">Auto-fill</button></span></div>
            <div class="otp-inputs" id="otpInputs">${[0, 1, 2, 3, 4, 5].map((i) => `<input type="text" inputmode="numeric" maxlength="1" data-idx="${i}" aria-label="OTP digit ${i + 1}">`).join('')}</div>
            <div class="err" id="gwErr" style="color:var(--danger);font-size:.8rem;text-align:center;min-height:1.2em;margin-bottom:8px"></div>
            <div class="grid-2">
              <button type="button" class="btn" id="gwCancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="gwSubmit">Verify & Pay ${money(amount)}</button>
            </div>
          </form>
        `}
      </div>`);

    const finish = (ok) => { closeModal(); resolve(ok); };
    $('#gwCancel')?.addEventListener('click', () => finish(false));
    $('#gwApprove')?.addEventListener('click', () => finish(true));

    const boxes = $$('#otpInputs input');
    if (boxes.length) {
      boxes[0].focus();
      boxes.forEach((inp, i) => {
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/\D/g, '').slice(-1);
          if (inp.value && boxes[i + 1]) boxes[i + 1].focus();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !inp.value && boxes[i - 1]) boxes[i - 1].focus();
        });
      });
      $('#fillOtp')?.addEventListener('click', () => {
        demoOtp.split('').forEach((ch, i) => { if (boxes[i]) boxes[i].value = ch; });
      });
    }

    $('#gwForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (boxes.length) {
        const entered = boxes.map((b) => b.value).join('');
        if (entered.length !== 6) { $('#gwErr').textContent = 'Please enter all 6 digits (or click Auto-fill)'; return; }
      }
      finish(true);
    });
  });
}

function loadRazorpaySdk() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// Launch Razorpay Checkout (Live SDK if RAZORPAY_KEY_ID is configured, or interactive Razorpay popup in demo mode)
async function launchRazorpayCheckout({ rzpOrder, address }) {
  if (rzpOrder.mode === 'live') {
    const sdkOk = await loadRazorpaySdk();
    if (sdkOk) {
      return new Promise((resolve) => {
        const rzp = new window.Razorpay({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'Lumen Retail Pvt. Ltd.',
          description: 'Order Checkout',
          order_id: rzpOrder.id,
          prefill: { name: address.name, email: address.email, contact: address.phone },
          theme: { color: '#1976d2' },
          handler: (resp) => resolve({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            subMethod: 'Razorpay Live',
          }),
          modal: { ondismiss: () => resolve(null) },
        });
        rzp.open();
      });
    }
  }

  // Self-contained Razorpay Standard Checkout popup (HMAC-SHA256 signed by server)
  return new Promise((resolve) => {
    let tab = 'UPI';
    let selMeta = 'Google Pay (UPI)';
    const amtInr = rzpOrder.totalInr || Math.round(rzpOrder.amount / 100);
    const upiUri = `upi://pay?pa=lumenrazorpay@icici&pn=Lumen%20Retail&am=${amtInr}&cu=INR`;

    const renderBody = () => {
      const box = $('#rzpTabBody');
      if (!box) return;
      if (tab === 'UPI') {
        box.innerHTML = `
          <div style="display:grid;grid-template-columns:116px 1fr;gap:14px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2)">
            <div style="width:116px;height:116px;background:#fff;padding:8px;border-radius:10px">${upiQrSvg(upiUri)}</div>
            <div>
              <b style="font-size:.88rem;display:block">Scan QR with any UPI App</b>
              <span class="muted" style="font-size:.76rem;display:block;margin:4px 0 8px">GPay · PhonePe · Paytm · BHIM</span>
              <input class="input" id="rzpVpa" placeholder="or enter VPA: name@okicici" style="height:36px;font-size:.82rem" value="customer@okicici">
            </div>
          </div>`;
        selMeta = 'UPI QR / VPA';
      } else if (tab === 'Card') {
        box.innerHTML = `
          <div class="form-stack" style="gap:10px">
            <input class="input" id="rzpCardNum" value="4242 4242 4242 4242" placeholder="Card Number" style="height:40px">
            <div class="grid-2">
              <input class="input" value="12/29" placeholder="MM/YY" style="height:40px">
              <input class="input" type="password" value="123" placeholder="CVV" style="height:40px">
            </div>
            <span class="muted" style="font-size:.75rem">Pre-filled with Razorpay test Visa card (4242 •••• 4242)</span>
          </div>`;
        selMeta = 'Visa •••• 4242';
      } else if (tab === 'NetBanking') {
        box.innerHTML = `
          <div class="bank-grid" style="margin-bottom:0">
            ${TOP_BANKS.map((b, i) => `
              <button type="button" class="bank-tile ${i === 0 ? 'active' : ''}" data-rzpbank="${esc(b.name)}" style="padding:9px">
                <span class="bank-logo" style="background:${b.color};width:26px;height:26px;font-size:.65rem">${b.code}</span>
                <span style="font-size:.78rem">${esc(b.name)}</span>
              </button>`).join('')}
          </div>`;
        selMeta = TOP_BANKS[0].name;
        $$('[data-rzpbank]', box).forEach((b) => b.addEventListener('click', () => {
          selMeta = b.dataset.rzpbank;
          $$('[data-rzpbank]', box).forEach((x) => x.classList.toggle('active', x === b));
        }));
      } else if (tab === 'Wallet') {
        box.innerHTML = `
          <div class="grid-2">
            ${['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet', 'Mobikwik'].map((w, i) => `
              <button type="button" class="bank-tile ${i === 0 ? 'active' : ''}" data-rzpwallet="${w}" style="padding:10px">
                <span>👛 ${w}</span>
              </button>`).join('')}
          </div>`;
        selMeta = 'Paytm Wallet';
        $$('[data-rzpwallet]', box).forEach((b) => b.addEventListener('click', () => {
          selMeta = b.dataset.rzpwallet;
          $$('[data-rzpwallet]', box).forEach((x) => x.classList.toggle('active', x === b));
        }));
      }
    };

    openModal(`
      <div class="rzp-modal">
        <div class="rzp-header">
          <div class="rzp-logo">R</div>
          <div>
            <b style="font-size:1.05rem;display:block">Lumen Retail Pvt. Ltd.</b>
            <span style="font-size:.75rem;opacity:.85">Razorpay Trusted Business · ${esc(rzpOrder.id)}</span>
          </div>
          <div class="rzp-amt">
            <span>Amount</span>
            <b>${money(amtInr)}</b>
          </div>
        </div>
        <div class="rzp-bar">
          <span>👤 +91 ${esc(address.phone || '9876543210')} · ${esc(address.email || '')}</span>
          <span>🔒 100% Secure</span>
        </div>
        <div class="rzp-body">
          <div class="rzp-methods" id="rzpMethods">
            ${[['UPI', '📱 UPI'], ['Card', '💳 Card'], ['NetBanking', '🏦 Bank'], ['Wallet', '👛 Wallet']].map(([k, l]) => `<button type="button" class="${k === tab ? 'active' : ''}" data-rzptab="${k}">${l}</button>`).join('')}
          </div>
          <div id="rzpTabBody"></div>
          <button type="button" class="rzp-pay-btn" id="rzpPayNow">Pay ${money(amtInr)} via Razorpay</button>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:.74rem;color:var(--muted)">
            <span>Secured by <b>Razorpay</b> · HMAC-SHA256</span>
            <button type="button" class="link-btn" id="rzpCancel">Cancel</button>
          </div>
        </div>
      </div>`);

    renderBody();
    $$('#rzpMethods button').forEach((b) => b.addEventListener('click', () => {
      tab = b.dataset.rzptab;
      $$('#rzpMethods button').forEach((x) => x.classList.toggle('active', x === b));
      renderBody();
    }));

    $('#rzpCancel')?.addEventListener('click', () => { closeModal(); resolve(null); });
    $('#rzpPayNow')?.addEventListener('click', async () => {
      const btn = $('#rzpPayNow');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Verifying Signature with Razorpay…';
      if (tab === 'UPI' && $('#rzpVpa')?.value) selMeta = $('#rzpVpa').value.trim();
      try {
        const signed = await api('/payments/razorpay/demo-sign', {
          method: 'POST',
          body: { razorpay_order_id: rzpOrder.id, subMethod: tab, meta: selMeta },
        });
        closeModal();
        resolve(signed);
      } catch (err) {
        toast(err.message, { type: 'error' });
        btn.disabled = false;
        btn.textContent = `Pay ${money(amtInr)} via Razorpay`;
      }
    });
  });
}

async function renderCheckout() {
  setTitle('Checkout');
  const app = $('#app');
  if (!state.cart.length) { location.hash = '#/cart'; return; }

  const saved = store.get('address', {});
  const userAddrs = state.user?.addresses || [];
  const defaultAddr = userAddrs[0] || saved;
  const co = {
    step: 1,
    address: { name: state.user?.name || '', phone: state.user?.phone || '', email: state.user?.email || '', ...defaultAddr },
    shipping: 'standard',
    payment: 'razorpay',
    upiMode: 'qr',
    upiApp: 'Google Pay',
    upiVerified: null,
    bankCode: 'HDFC',
    emiBank: 'HDFC Bank',
    emiMonths: 3,
  };

  app.innerHTML = `
  <div class="container page-head"><div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/cart">Cart</a> / <span>Checkout</span></div><h1>Express Checkout</h1></div>
  <div class="container two-col">
    <div>
      ${state.user
        ? `<div class="guest-banner"><span>👋 Signed in as <b>${esc(state.user.name)}</b> (${esc(state.user.email)})</span><span class="chip" style="font-size:.76rem">✔ Verified Member</span></div>`
        : `<div class="guest-banner"><span>⚡ <b>Guest Checkout enabled</b> — no account required to place your order.</span><a href="#/account" style="color:var(--primary);font-weight:700">Have an account? Sign in →</a></div>`}
      <div class="steps" id="steps">${['1. Address & Delivery', '2. Payment'].map((s, i) => `<div class="step" data-step="${i + 1}"><span class="num">${i + 1}</span><span class="label">${s}</span></div>`).join('')}</div>
      <div id="stepBody"></div>
    </div>
    <aside class="panel sticky" id="coSummary">${summarySkeleton()}</aside>
  </div>`;

  let quote = null;
  const refreshSummary = async () => { quote = await renderSummary($('#coSummary'), { shippingMethod: co.shipping, items: true }); };

  const paintSteps = () => $$('#steps .step').forEach((s) => {
    const n = Number(s.dataset.step);
    s.classList.toggle('active', n === co.step);
    s.classList.toggle('done', n < co.step);
    s.querySelector('.num').textContent = n < co.step ? '✓' : n;
    s.style.cursor = n < co.step ? 'pointer' : 'default';
  });
  $('#steps').addEventListener('click', (e) => { const s = e.target.closest('.step'); if (s && Number(s.dataset.step) < co.step) { co.step = Number(s.dataset.step); show(); } });

  const fieldErr = (form, name, msg) => {
    const f = form.querySelector(`[name="${name}"]`)?.closest('.field');
    if (!f) return;
    f.classList.toggle('invalid', !!msg);
    const er = f.querySelector('.err');
    if (er) er.textContent = msg || '';
  };

  const field = (name, label, attrs = '', cls = '') => `
    <div class="field ${cls}"><label for="f_${name}">${label}</label><input class="input" id="f_${name}" name="${name}" value="${esc(co.address[name] || '')}" ${attrs}><span class="err"></span></div>`;

  const PAY_TABS = [
    ['razorpay', '⚡', 'Razorpay', 'UPI, Cards, Wallets'],
    ['upi', '📱', 'UPI Direct', 'QR, GPay, PhonePe'],
    ['card', '💳', 'Card', 'Visa, Master, RuPay'],
    ['netbanking', '🏦', 'NetBanking', '40+ Indian Banks'],
    ['emi', '📅', 'Bank EMI', '0% No-Cost EMI'],
    ['cod', '💵', 'Cash / COD', 'Pay on delivery'],
  ];

  const steps = {
    1: () => {
      const d = (n) => fmtDate(Date.now() + n * 86400000, { weekday: 'short', day: 'numeric', month: 'short' });
      const freeStd = cartSubtotal() >= FREE_SHIP || state.coupon === 'FREESHIP';
      return `
      <form class="panel" id="addrForm" novalidate>
        <h3>📍 Shipping address &amp; delivery speed</h3>
        ${userAddrs.length ? `
          <div style="margin-bottom:14px">
            <span class="muted" style="font-size:.82rem;display:block;margin-bottom:8px">Saved addresses:</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${userAddrs.map((a, idx) => `<button type="button" class="chip" data-pickaddr="${idx}">🏠 ${esc(a.label || 'Address')}: ${esc(a.city)} ${esc(a.pincode)}</button>`).join('')}</div>
          </div>` : ''}
        <div class="grid-2">
          ${field('name', 'Full name', 'autocomplete="name" required')}
          ${field('phone', 'Phone number', 'inputmode="tel" autocomplete="tel" maxlength="10" placeholder="10-digit mobile" required')}
          ${state.user ? '' : field('email', 'Email (for guest receipt & tracking)', 'type="email" autocomplete="email" placeholder="you@example.com" required', 'span-2')}
          ${field('line1', 'Address (house no, building, street)', 'autocomplete="address-line1" required', 'span-2')}
          ${field('line2', 'Landmark / area (optional)', 'autocomplete="address-line2"', 'span-2')}
          ${field('city', 'City', 'autocomplete="address-level2" required')}
          <div class="field"><label for="f_state">State</label><select class="input" id="f_state" name="state" required><option value="">Select state</option>${STATES.map((s) => `<option ${co.address.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select><span class="err"></span></div>
          ${field('pincode', 'PIN code', 'inputmode="numeric" maxlength="6" autocomplete="postal-code" required')}
        </div>

        <h3 style="margin:20px 0 10px">🚚 Choose delivery speed</h3>
        <div class="grid-2">
          <label class="option-card ${co.shipping === 'standard' ? 'active' : ''}" style="margin:0"><input type="radio" name="ship" value="standard" ${co.shipping === 'standard' ? 'checked' : ''}><div class="oc-body"><b>Standard Delivery</b><span>Est. arrival: ${d(3)} – ${d(5)}</span></div><b>${freeStd ? '<span style="color:var(--success)">FREE</span>' : money(79)}</b></label>
          <label class="option-card ${co.shipping === 'express' ? 'active' : ''}" style="margin:0"><input type="radio" name="ship" value="express" ${co.shipping === 'express' ? 'checked' : ''}><div class="oc-body"><b>Express Delivery ⚡</b><span>Est. arrival: ${d(1)} – ${d(2)}</span></div><b>${state.coupon === 'FREESHIP' ? '<span style="color:var(--success)">FREE</span>' : money(149)}</b></label>
        </div>

        <label class="check" style="margin-top:12px"><input type="checkbox" name="save" checked> Save this address for faster checkout next time</label>
        <button class="btn btn-primary btn-block btn-checkout-cta" style="margin-top:16px">Continue to Payment (UPI, Cards, NetBanking, COD) ${ICON.arrow}</button>
      </form>`;
    },
    2: () => `
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 14px;border-radius:12px;background:var(--surface-2);margin-bottom:18px;font-size:.86rem">
          <span>📍 Delivering to <b>${esc(co.address.name)}</b>, ${esc(co.address.line1)}, ${esc(co.address.city)} ${esc(co.address.pincode)} · <b>${co.shipping === 'express' ? 'Express' : 'Standard'} (${estDeliveryRange(co.shipping)})</b></span>
          <a href="#" id="editAddr" style="color:var(--primary);font-weight:700">Change</a>
        </div>
        <h3>💳 Select a payment method</h3>
        <div class="pay-quick-tabs" id="payTabs">
          ${PAY_TABS.map(([id, ic, title, sub]) => `
            <button type="button" class="pay-tab ${co.payment === id ? 'active' : ''}" data-paytab="${id}">
              <span class="pt-ic">${ic}</span>
              <div><b>${title}</b><span>${sub}</span></div>
            </button>`).join('')}
        </div>
        <form id="payForm" novalidate style="margin-top:14px">${payFields()}</form>
      </div>`,
  };

  function payFields() {
    const totalAmt = quote ? quote.total : cartSubtotal();
    if (co.payment === 'razorpay') {
      return `
        <div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,#1976d2 12%,var(--surface)),var(--surface-2));border:1px solid color-mix(in srgb,#1976d2 30%,var(--border));margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="width:32px;height:32px;border-radius:8px;background:#0d47a1;color:#fff;display:grid;place-items:center;font-weight:900">R</span>
            <div><b style="display:block">Razorpay Secure Gateway</b><span class="muted" style="font-size:.78rem">Order creation + HMAC-SHA256 signature verification</span></div>
          </div>
          <p class="muted" style="font-size:.83rem;margin:0">Click below to open the Razorpay Checkout modal supporting UPI QR, Cards, NetBanking, and Wallets.</p>
        </div>
        ${placeBtn('Pay with Razorpay')}`;
    }
    if (co.payment === 'upi') {
      const upiUri = `upi://pay?pa=lumenstore@icici&pn=Lumen%20Retail&am=${totalAmt}&cu=INR`;
      return `
      <div class="upi-tabs">
        <button type="button" class="${co.upiMode === 'qr' ? 'active' : ''}" data-upimode="qr">📷 Scan UPI QR</button>
        <button type="button" class="${co.upiMode === 'intent' ? 'active' : ''}" data-upimode="intent">⚡ UPI App</button>
        <button type="button" class="${co.upiMode === 'vpa' ? 'active' : ''}" data-upimode="vpa">🆔 Enter UPI ID</button>
      </div>
      ${co.upiMode === 'qr' ? `
        <div class="qr-card">
          <div class="qr-box">${upiQrSvg(upiUri)}</div>
          <div>
            <span class="chip" style="font-size:.74rem;margin-bottom:8px">NPCI BHIM · Dynamic QR</span>
            <b style="display:block;font-size:1.02rem">Scan with any UPI app to pay ${money(totalAmt)}</b>
            <p class="muted" style="font-size:.82rem;margin:6px 0 10px">Works with Google Pay, PhonePe, Paytm, BHIM, Amazon Pay and all bank apps.</p>
            <div style="font-size:.78rem;color:var(--muted)">Merchant VPA: <b>lumenstore@icici</b></div>
          </div>
        </div>
      ` : co.upiMode === 'intent' ? `
        <p class="muted" style="font-size:.85rem;margin:0 0 6px">Select your preferred UPI app:</p>
        <div class="upi-apps">
          ${UPI_APPS.map((a) => `
            <button type="button" class="upi-app ${co.upiApp === a.id ? 'active' : ''}" data-upiapp="${esc(a.id)}">
              <span class="app-ic" style="background:${a.bg}">${a.short}</span>
              <span>${esc(a.id)}</span>
            </button>`).join('')}
        </div>
      ` : `
        <div class="vpa-row">
          <div class="field">
            <label>Virtual Payment Address (UPI ID)</label>
            <input class="input" name="upiId" id="upiIdInput" placeholder="username@okicici" value="${esc(co.upiVerified?.vpa || '')}">
            <span class="err"></span>
          </div>
          <button type="button" class="btn" id="verifyVpaBtn" style="margin-top:26px;height:46px">Verify VPA</button>
        </div>
        <div class="vpa-chips">
          ${['@okicici', '@okhdfcbank', '@oksbi', '@ybl', '@paytm', '@upi'].map((h) => `<button type="button" data-vpahandle="${h}">${h}</button>`).join('')}
        </div>
        <div id="vpaStatus">${co.upiVerified ? `<div class="vpa-verified">✔ Verified Account: <b>${esc(co.upiVerified.holder)}</b> · <span class="muted">${esc(co.upiVerified.bank)}</span></div>` : ''}</div>
      `}
      ${placeBtn(co.upiMode === 'qr' ? 'I Have Scanned & Paid' : `Pay via UPI`)}`;
    }

    if (co.payment === 'card') return `
      <div class="card-preview"><span class="brand-ic" id="cpBrand"></span><div class="chip-ic"></div><div class="cp-num" id="cpNum">•••• •••• •••• ••••</div>
        <div class="cp-row"><div>Card holder<b id="cpName">YOUR NAME</b></div><div>Expires<b id="cpExp">MM/YY</b></div></div></div>
      <div class="grid-2">
        <div class="field span-2"><label>Card number</label><input class="input" name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23"><span class="err"></span></div>
        <div class="field span-2"><label>Name on card</label><input class="input" name="cardName" autocomplete="cc-name" placeholder="As printed on card"><span class="err"></span></div>
        <div class="field"><label>Expiry</label><input class="input" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"><span class="err"></span></div>
        <div class="field"><label>CVV</label><input class="input" name="cvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4"><span class="err"></span></div>
      </div>
      <p class="muted" style="font-size:.8rem">🔒 Protected by 3D Secure 2.0 OTP verification. Test card: <b>4242 4242 4242 4242</b>, any future expiry, any CVV.</p>
      ${placeBtn('Proceed to 3D Secure OTP')}`;

    if (co.payment === 'netbanking') return `
      <p class="muted" style="font-size:.85rem;margin:0 0 8px">Popular banks:</p>
      <div class="bank-grid">
        ${TOP_BANKS.map((b) => `
          <button type="button" class="bank-tile ${co.bankCode === b.code ? 'active' : ''}" data-bank="${b.code}">
            <span class="bank-logo" style="background:${b.color}">${b.code}</span>
            <span>${esc(b.name)}</span>
          </button>`).join('')}
      </div>
      <div class="field">
        <label for="bankSelect">Or choose from all banks</label>
        <select class="input" id="bankSelect" name="bankCode">
          ${ALL_BANKS.map((b) => `<option value="${b.code}" ${co.bankCode === b.code ? 'selected' : ''}>${esc(b.name)} NetBanking</option>`).join('')}
        </select>
      </div>
      <p class="muted" style="font-size:.8rem;margin:10px 0 4px">You will authorize the payment in a secure simulated bank login window.</p>
      ${placeBtn(`Continue to ${ALL_BANKS.find((b) => b.code === co.bankCode)?.name || 'Bank'} Portal`)}`;

    if (co.payment === 'emi') {
      if (totalAmt < 3000) {
        return `<div class="panel" style="background:var(--surface-2);text-align:center"><p style="margin:0">Bank EMI is available on orders of <b>₹3,000</b> or above. Your current order total is <b>${money(totalAmt)}</b>.</p></div>`;
      }
      const plans = [3, 6, 9, 12].map((m) => {
        const rate = m <= 6 ? 0 : 0.14;
        const monthly = rate === 0 ? Math.ceil(totalAmt / m) : Math.ceil((totalAmt * (1 + (rate * m) / 12)) / m);
        return { m, rate, monthly, total: monthly * m };
      });
      return `
        <div class="field">
          <label>Issuing Bank</label>
          <select class="input" name="emiBank" id="emiBankSel">
            ${TOP_BANKS.map((b) => `<option ${co.emiBank === b.name ? 'selected' : ''}>${esc(b.name)} Credit Card EMI</option>`).join('')}
          </select>
        </div>
        <div class="emi-plans">
          ${plans.map((p) => `
            <div class="emi-plan ${co.emiMonths === p.m ? 'active' : ''}" data-emimonths="${p.m}">
              <b>${money(p.monthly)} / mo × ${p.m}m ${p.rate === 0 ? '<span class="nocost">NO COST</span>' : ''}</b>
              <span>${p.rate === 0 ? '0% interest p.a.' : '14% p.a.'} · Total ${money(p.total)}</span>
            </div>`).join('')}
        </div>
        <div class="grid-2">
          <div class="field span-2"><label>Credit card number</label><input class="input" name="cardNumber" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="23"><span class="err"></span></div>
          <div class="field"><label>Expiry (MM/YY)</label><input class="input" name="exp" inputmode="numeric" placeholder="08/29" maxlength="5"><span class="err"></span></div>
          <div class="field"><label>CVV</label><input class="input" name="cvv" type="password" inputmode="numeric" placeholder="•••" maxlength="4"><span class="err"></span></div>
        </div>
        ${placeBtn(`Pay ${money(plans.find((x) => x.m === co.emiMonths)?.monthly || 0)}/mo with EMI`)}`;
    }

    return `<p class="muted">Pay with cash or UPI QR at your doorstep when your order is delivered. Available for orders up to ₹50,000.</p>${placeBtn('Place COD Order')}`;
  }

  const placeBtn = (label = 'Place order') => `<button class="btn btn-primary btn-block" id="placeBtn" style="height:54px;margin-top:10px">${ICON.lock} ${esc(label)}${quote ? ' · ' + money(quote.total) : ''}</button>`;

  function show() {
    paintSteps();
    $('#stepBody').innerHTML = steps[co.step]();
    $('#stepBody').firstElementChild.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    if (co.step === 1) bindAddress();
    if (co.step === 2) bindPayment();
  }

  function bindAddress() {
    const form = $('#addrForm');
    $$('[data-pickaddr]', form).forEach((b) => b.addEventListener('click', () => {
      const a = userAddrs[Number(b.dataset.pickaddr)];
      if (!a) return;
      co.address = { ...co.address, ...a };
      show();
    }));
    $$('input[name=ship]', form).forEach((r) => r.addEventListener('change', () => {
      co.shipping = r.value;
      $$('.option-card', form).forEach((c) => c.classList.toggle('active', c.contains(r) && r.checked));
      refreshSummary();
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const errs = {};
      if (!fd.name || fd.name.trim().length < 2) errs.name = 'Please enter your full name';
      if (!/^[6-9]\d{9}$/.test(fd.phone || '')) errs.phone = 'Enter a valid 10-digit mobile number';
      if (!state.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email || '')) errs.email = 'Enter a valid email';
      if (!fd.line1 || fd.line1.trim().length < 5) errs.line1 = 'Please enter your street address';
      if (!fd.city?.trim()) errs.city = 'City is required';
      if (!fd.state) errs.state = 'Select your state';
      if (!/^[1-9]\d{5}$/.test(fd.pincode || '')) errs.pincode = 'Enter a valid 6-digit PIN code';
      ['name', 'phone', 'email', 'line1', 'city', 'state', 'pincode'].forEach((k) => fieldErr(form, k, errs[k]));
      if (Object.keys(errs).length) { form.querySelector('.invalid .input')?.focus(); return; }
      const { save, ship, ...addr } = fd;
      if (ship) co.shipping = ship;
      co.address = { ...co.address, ...addr };
      if (save) {
        store.set('address', { ...addr, email: undefined });
        if (state.user) {
          const exists = (state.user.addresses || []).some((x) => x.line1 === addr.line1 && x.pincode === addr.pincode);
          if (!exists) {
            const nextAddrs = [{ id: String(Date.now()), label: 'Saved', ...addr }, ...(state.user.addresses || [])].slice(0, 5);
            api('/auth/profile', { method: 'PATCH', body: { addresses: nextAddrs } }).then(({ user }) => setAuth(state.token, user)).catch(() => {});
          }
        }
      }
      co.step = 2; show();
    });
    form.addEventListener('input', (e) => fieldErr(form, e.target.name, ''));
  }

  function bindPayment() {
    $('#editAddr')?.addEventListener('click', (e) => { e.preventDefault(); co.step = 1; show(); });
    $$('[data-paytab]').forEach((b) => b.addEventListener('click', () => {
      co.payment = b.dataset.paytab;
      $$('[data-paytab]').forEach((x) => x.classList.toggle('active', x === b));
      $('#payForm').innerHTML = payFields();
      bindPayForm();
    }));
    bindPayForm();
  }

  function bindPayForm() {
    const form = $('#payForm');

    // UPI sub-tabs, apps & VPA verification
    $$('[data-upimode]', form).forEach((b) => b.addEventListener('click', () => {
      co.upiMode = b.dataset.upimode;
      form.innerHTML = payFields();
      bindPayForm();
    }));
    $$('[data-upiapp]', form).forEach((b) => b.addEventListener('click', () => {
      co.upiApp = b.dataset.upiapp;
      $$('[data-upiapp]', form).forEach((x) => x.classList.toggle('active', x === b));
    }));
    $$('[data-vpahandle]', form).forEach((b) => b.addEventListener('click', () => {
      const inp = $('#upiIdInput', form);
      if (!inp) return;
      const base = inp.value.split('@')[0] || (state.user?.email?.split('@')[0] || 'rahul');
      inp.value = base + b.dataset.vpahandle;
      $('#verifyVpaBtn', form)?.click();
    }));
    $('#verifyVpaBtn', form)?.addEventListener('click', async () => {
      const inp = $('#upiIdInput', form);
      const btn = $('#verifyVpaBtn', form);
      fieldErr(form, 'upiId', '');
      btn.disabled = true; btn.textContent = 'Verifying…';
      try {
        const res = await api('/payments/upi-verify', { method: 'POST', body: { upiId: inp.value } });
        co.upiVerified = res;
        $('#vpaStatus', form).innerHTML = `<div class="vpa-verified">✔ Verified Account: <b>${esc(res.holder)}</b> · <span class="muted">${esc(res.bank)}</span></div>`;
      } catch (err) {
        co.upiVerified = null;
        $('#vpaStatus', form).innerHTML = '';
        fieldErr(form, 'upiId', err.message);
      } finally {
        btn.disabled = false; btn.textContent = 'Verify VPA';
      }
    });

    // NetBanking tiles & select
    $$('[data-bank]', form).forEach((b) => b.addEventListener('click', () => {
      co.bankCode = b.dataset.bank;
      form.innerHTML = payFields();
      bindPayForm();
    }));
    $('#bankSelect', form)?.addEventListener('change', (e) => {
      co.bankCode = e.target.value;
      form.innerHTML = payFields();
      bindPayForm();
    });

    // EMI plan cards & bank select
    $$('[data-emimonths]', form).forEach((b) => b.addEventListener('click', () => {
      co.emiMonths = Number(b.dataset.emimonths);
      form.innerHTML = payFields();
      bindPayForm();
    }));
    $('#emiBankSel', form)?.addEventListener('change', (e) => { co.emiBank = e.target.value; });

    // Card input formatting
    const num = form.querySelector('[name=cardNumber]');
    if (num) {
      num.addEventListener('input', () => {
        const d = num.value.replace(/\D/g, '').slice(0, 19);
        num.value = d.replace(/(.{4})/g, '$1 ').trim();
        if ($('#cpNum')) $('#cpNum').textContent = (d.padEnd(16, '•').match(/.{1,4}/g) || []).join(' ');
        if ($('#cpBrand')) $('#cpBrand').textContent = cardBrand(d);
      });
      form.querySelector('[name=cardName]')?.addEventListener('input', (e) => { if ($('#cpName')) $('#cpName').textContent = e.target.value.toUpperCase() || 'YOUR NAME'; });
      const exp = form.querySelector('[name=exp]');
      exp?.addEventListener('input', () => {
        let d = exp.value.replace(/\D/g, '').slice(0, 4);
        if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
        exp.value = d;
        if ($('#cpExp')) $('#cpExp').textContent = d || 'MM/YY';
      });
    }

    form.addEventListener('input', (e) => fieldErr(form, e.target.name, ''));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const payment = { method: co.payment };
      const errs = {};
      const totalAmt = quote ? quote.total : cartSubtotal();

      if (co.payment === 'card') {
        const n = (fd.cardNumber || '').replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(n) || !luhn(n)) errs.cardNumber = 'Enter a valid card number';
        if (!fd.cardName?.trim()) errs.cardName = 'Enter the name on your card';
        const m = /^(\d{2})\/(\d{2})$/.exec(fd.exp || '');
        const expOk = m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && new Date(2000 + Number(m[2]), Number(m[1])) > new Date();
        if (!expOk) errs.exp = 'Invalid or expired';
        if (!/^\d{3,4}$/.test(fd.cvv || '')) errs.cvv = 'Invalid CVV';
        payment.cardNumber = n;
      } else if (co.payment === 'upi') {
        payment.upiMode = co.upiMode;
        if (co.upiMode === 'vpa') {
          const vpa = (fd.upiId || '').trim();
          if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(vpa)) errs.upiId = 'Enter a valid UPI ID (e.g. name@okicici)';
          payment.upiId = vpa;
        } else {
          payment.upiApp = co.upiMode === 'intent' ? co.upiApp : 'UPI QR Scan';
          payment.upiId = co.upiMode === 'intent' ? `intent@${co.upiApp.toLowerCase().replace(/\s+/g, '')}` : 'qr-scan@upi';
        }
      } else if (co.payment === 'netbanking') {
        payment.bankCode = co.bankCode;
      } else if (co.payment === 'emi') {
        const n = (fd.cardNumber || '').replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(n) || !luhn(n)) errs.cardNumber = 'Enter a valid credit card number';
        const m = /^(\d{2})\/(\d{2})$/.exec(fd.exp || '');
        const expOk = m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && new Date(2000 + Number(m[2]), Number(m[1])) > new Date();
        if (!expOk) errs.exp = 'Invalid or expired';
        if (!/^\d{3,4}$/.test(fd.cvv || '')) errs.cvv = 'Invalid CVV';
        payment.cardNumber = n;
        payment.emiBank = co.emiBank;
        payment.emiMonths = co.emiMonths;
      }

      Object.keys(fd).forEach((k) => fieldErr(form, k, errs[k]));
      if (Object.keys(errs).length) return;

      // Interactive gateway authorization step (Razorpay / 3DS2 OTP / Bank Login / UPI Collect)
      if (co.payment === 'razorpay') {
        const btn = $('#placeBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Creating Razorpay Order…';
        let rzpOrder;
        try {
          rzpOrder = await api('/payments/razorpay/order', {
            method: 'POST',
            body: { items: state.cart.map(({ id, qty, color, size }) => ({ id, qty, color, size })), coupon: state.coupon, shippingMethod: co.shipping },
          });
        } catch (err) {
          toast(err.message, { type: 'error' });
          btn.disabled = false;
          btn.innerHTML = `${ICON.lock} Pay with Razorpay`;
          return;
        }
        const rzpResult = await launchRazorpayCheckout({ rzpOrder, address: co.address });
        if (!rzpResult) {
          btn.disabled = false;
          btn.innerHTML = `${ICON.lock} Pay with Razorpay${quote ? ' · ' + money(quote.total) : ''}`;
          return toast('Razorpay checkout cancelled', { type: 'error' });
        }
        Object.assign(payment, rzpResult);
      } else if (co.payment === 'card' || co.payment === 'emi') {
        const net = cardBrand(payment.cardNumber) || 'CARD';
        const ok = await authorizeGatewayModal({ title: `${net} 3D Secure 2.0`, subtitle: `Card ending •••• ${payment.cardNumber.slice(-4)}`, badge: '3DS2 ACS', amount: totalAmt, mode: 'otp' });
        if (!ok) return toast('Payment authorization cancelled', { type: 'error' });
      } else if (co.payment === 'netbanking') {
        const bName = ALL_BANKS.find((b) => b.code === co.bankCode)?.name || co.bankCode;
        const ok = await authorizeGatewayModal({ title: `${bName} NetBanking`, subtitle: 'Retail Internet Banking Gateway', badge: co.bankCode, amount: totalAmt, mode: 'netbanking' });
        if (!ok) return toast('Bank authorization cancelled', { type: 'error' });
      } else if (co.payment === 'upi' && co.upiMode !== 'qr') {
        const ok = await authorizeGatewayModal({ title: 'NPCI UPI Collect Request', subtitle: co.upiMode === 'vpa' ? `VPA: ${payment.upiId}` : `App: ${co.upiApp}`, badge: 'UPI 2.0', amount: totalAmt, mode: 'upi' });
        if (!ok) return toast('UPI payment cancelled', { type: 'error' });
      }

      const btn = $('#placeBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Finalizing order…';
      try {
        const order = await api('/orders', {
          method: 'POST',
          body: { items: state.cart.map(({ id, qty, color, size }) => ({ id, qty, color, size })), coupon: state.coupon, shippingMethod: co.shipping, address: co.address, payment },
        });
        state.cart = []; state.coupon = null;
        store.set('coupon', null);
        saveCart();
        const guest = store.get('guestOrders', []);
        if (!state.user) store.set('guestOrders', [order.id, ...guest].slice(0, 20));
        location.hash = `#/order/${order.id}?new=1`;
      } catch (err) {
        toast(err.message, { type: 'error' });
        btn.disabled = false;
        btn.innerHTML = `${ICON.lock} Place order`;
      }
    });
  }

  show();
  await refreshSummary();
  if (co.step === 2) { $('#payForm').innerHTML = payFields(); bindPayForm(); }
}

// ---------- Order confirmation ----------
function confetti() {
  const colors = ['#5b5bf7', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    c.style.animationDelay = Math.random() * 0.6 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(c);
    c.addEventListener('animationend', () => c.remove());
  }
}

const fmtPayment = (p) => {
  if (!p) return '';
  if (p.method === 'razorpay') return `Razorpay (${p.subMethod || 'Verified'}${p.meta ? ' · ' + p.meta : ''})`;
  if (p.method === 'card') return `${p.network || 'CARD'} •••• ${p.last4 || ''}`;
  if (p.method === 'upi') return `UPI (${p.upiId || p.upiApp || 'UTR ' + (p.utr || '')})`;
  if (p.method === 'netbanking') return `NetBanking · ${p.bankName || p.bankCode || ''}`;
  if (p.method === 'emi') return `EMI · ${p.emiMonths}m × ${money(p.emiMonthly)} (${p.emiBank || ''})`;
  return 'Cash on Delivery';
};

async function renderOrder({ parts, query, isCurrent }) {
  setTitle('Order confirmed');
  const o = await api('/orders/' + parts[1]);
  if (!isCurrent()) return;
  const isNew = query.get('new') === '1';
  const stages = ['confirmed', 'packed', 'shipped', 'delivered'];
  const stage = o.status === 'cancelled' ? -1 : Math.max(stages.indexOf(o.status), 0);
  $('#app').innerHTML = `
  <div class="container success" style="max-width:720px">
    <div class="success-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <span class="chip" style="background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);border:0;margin-bottom:10px">✔ Order ${esc(o.status.toUpperCase())} · Payment ${esc(o.payment.status.toUpperCase())}</span>
    <h1>${isNew ? 'Order Confirmed! Thank you 🎉' : `Order #${esc(o.id)}`}</h1>
    <p class="muted">${isNew ? `A confirmation receipt has been sent to <b>${esc(o.email)}</b>. Keep your Order ID <b>${esc(o.id)}</b> for instant tracking.` : `Placed on ${fmtDate(o.createdAt)}`}</p>
    <div class="order-meta">
      <div><span>Order number</span><b style="display:flex;align-items:center;justify-content:space-between;gap:6px">${esc(o.id)} <button type="button" class="link-btn" id="copyOrderId" style="font-size:.75rem;color:var(--primary)">Copy</button></b></div>
      <div><span>Estimated delivery</span><b>${fmtDate(o.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short' })} (${o.shippingMethod === 'express' ? 'Express' : 'Standard'})</b></div>
      <div><span>Payment method</span><b>${esc(fmtPayment(o.payment))}</b></div>
    </div>
    <div class="panel" style="text-align:left">
      ${o.status !== 'cancelled' ? `
        <div style="margin-bottom:16px">
          <span class="muted" style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Live Delivery Status</span>
          <div class="tracker" style="margin-top:10px">${['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((s, i) => `<div class="${i <= stage ? 'on' : ''}">${s}</div>`).join('')}</div>
        </div>` : ''}
      <h3 style="margin-bottom:10px">Items Ordered (${o.items.reduce((s, i) => s + i.qty, 0)})</h3>
      <div class="mini-items" style="max-height:none">${o.items.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt=""><i>${i.qty}</i></div><span class="mi-title">${esc(i.title)}${i.size ? ` · Size ${esc(i.size)}` : ''}</span><b>${money(i.lineTotal)}</b></div>`).join('')}</div>
      <div class="sum-row"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>
      ${o.discount ? `<div class="sum-row"><span>Coupon discount (${esc(o.coupon)})</span><span class="green">− ${money(o.discount)}</span></div>` : ''}
      <div class="sum-row"><span>Shipping charges (${esc(o.shippingMethod)})</span><b>${o.shipping ? money(o.shipping) : '<span class="green">FREE (₹0)</span>'}</b></div>
      <div class="sum-row total"><span>Final Total</span><span>${money(o.total)}</span></div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.83rem">
        <div><span class="muted" style="display:block;font-size:.75rem">SHIPPING ADDRESS</span><b>${esc(o.address.name)}</b> (${esc(o.address.phone)})<br>${esc(o.address.line1)}${o.address.line2 ? ', ' + esc(o.address.line2) : ''}, ${esc(o.address.city)}, ${esc(o.address.state)} — ${esc(o.address.pincode)}</div>
        <div><span class="muted" style="display:block;font-size:.75rem">PAYMENT &amp; GATEWAY REFERENCE</span><b>${esc(fmtPayment(o.payment))}</b><br>Status: <b style="text-transform:uppercase">${esc(o.payment.status)}</b>${o.payment.txnId ? `<br>Txn ID: <code>${esc(o.payment.txnId)}</code>` : ''}</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
      <a class="btn btn-primary" href="#/shop">Continue shopping ${ICON.arrow}</a>
      <button type="button" class="btn" id="printReceiptBtn">🖨️ Print / Save Receipt</button>
      ${state.user ? '<a class="btn" href="#/account">View my orders</a>' : '<a class="btn" href="#/account">Create an account to save order</a>'}
    </div>
  </div>`;
  $('#copyOrderId')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(o.id);
    toast(`Order ID ${o.id} copied`);
  });
  $('#printReceiptBtn')?.addEventListener('click', () => window.print());
  if (isNew) { confetti(); history.replaceState(null, '', '#/order/' + o.id); }
}

// ---------- Account ----------
function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

async function renderAccount({ isCurrent }) {
  const app = $('#app');
  if (state.token && !state.user) setAuth(null, null);
  let activeSessions = 1;
  if (state.token) {
    try {
      const me = await api('/auth/me');
      setAuth(state.token, me.user);
      activeSessions = me.activeSessions || 1;
    } catch { /* falls through to login */ }
  }
  if (!isCurrent()) return;

  if (!state.user) {
    setTitle('Sign in');
    let mode = 'login'; // 'login' | 'register' | 'otp'
    let otpSentTo = '';
    let demoOtpVal = '';
    const paint = () => {
      app.innerHTML = `
      <div class="container auth-wrap">
        <div style="text-align:center;margin-bottom:22px"><div class="logo-mark" style="margin:0 auto 14px;width:52px;height:52px;font-size:1.5rem">L</div>
          <h1>${mode === 'register' ? 'Create your account' : mode === 'otp' ? 'Passwordless OTP Sign In' : 'Welcome back'}</h1>
          <p class="muted">${mode === 'register' ? 'Join Lumen for faster checkout, saved addresses and order tracking.' : mode === 'otp' ? 'Sign in instantly with a 6-digit verification code.' : 'Sign in to track orders, manage addresses and checkout faster.'}</p></div>
        <div class="panel">
          <div class="auth-tabs" style="grid-template-columns:1fr 1fr 1fr">
            <button class="${mode === 'login' ? 'active' : ''}" data-mode="login">Password</button>
            <button class="${mode === 'otp' ? 'active' : ''}" data-mode="otp">Email OTP</button>
            <button class="${mode === 'register' ? 'active' : ''}" data-mode="register">Register</button>
          </div>
          ${mode === 'otp' ? `
            <form class="form-stack" id="otpForm" novalidate>
              <div class="field"><label>Email address</label><input class="input" name="email" type="email" value="${esc(otpSentTo)}" placeholder="you@example.com" required ${otpSentTo ? 'readonly' : ''}><span class="err"></span></div>
              ${otpSentTo ? `
                ${demoOtpVal ? `<div class="vpa-verified" style="margin:0">🔑 Demo OTP Code: <b>${esc(demoOtpVal)}</b> <button type="button" class="link-btn" id="autoOtpBtn" style="margin-left:auto;color:var(--primary);font-weight:800">Auto-fill</button></div>` : ''}
                <div class="field"><label>6-digit verification code</label><input class="input" name="otp" id="otpCodeIn" inputmode="numeric" maxlength="6" placeholder="123456" required><span class="err"></span></div>
                <button class="btn btn-primary btn-block" id="otpBtn">Verify & Sign in</button>
                <button type="button" class="btn btn-ghost btn-sm" id="resetOtpEmail">Change email / Resend code</button>
              ` : `
                <button class="btn btn-primary btn-block" id="otpBtn">Send 6-digit OTP</button>
              `}
            </form>
          ` : `
            <form class="form-stack" id="authForm" novalidate>
              ${mode === 'register' ? `
                <div class="field"><label>Full name</label><input class="input" name="name" autocomplete="name" placeholder="Aarav Sharma" required><span class="err"></span></div>
                <div class="field"><label>Mobile number (optional)</label><input class="input" name="phone" inputmode="tel" maxlength="10" placeholder="10-digit mobile"><span class="err"></span></div>
              ` : ''}
              <div class="field"><label>Email address</label><input class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com" required><span class="err"></span></div>
              <div class="field">
                <label>Password</label>
                <div style="position:relative">
                  <input class="input" id="authPw" name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="6" required style="padding-right:64px">
                  <button type="button" id="togglePw" class="link-btn" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);text-decoration:none;font-weight:700">Show</button>
                </div>
                ${mode === 'register' ? `<div class="pw-meter" id="pwMeter"><i></i><i></i><i></i><i></i></div><span class="muted" id="pwHint" style="font-size:.75rem">At least 6 characters</span>` : ''}
                <span class="err"></span>
              </div>
              <button class="btn btn-primary btn-block" id="authBtn">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
            </form>
          `}
        </div>
      </div>`;

      $$('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; otpSentTo = ''; demoOtpVal = ''; paint(); }));
      $('#togglePw')?.addEventListener('click', () => {
        const inp = $('#authPw');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        $('#togglePw').textContent = inp.type === 'password' ? 'Show' : 'Hide';
      });
      if (mode === 'register') {
        $('#authPw')?.addEventListener('input', (e) => {
          const s = pwStrength(e.target.value);
          $('#pwMeter').className = 'pw-meter' + (s ? ' s' + s : '');
          $('#pwHint').textContent = ['At least 6 characters', 'Weak password', 'Fair password', 'Good password', 'Strong password'][s];
        });
      }

      $('#otpForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        const btn = $('#otpBtn');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
          if (!otpSentTo) {
            const r = await api('/auth/otp/send', { method: 'POST', body: { email: fd.email } });
            otpSentTo = fd.email.trim();
            demoOtpVal = r.demoOtp || '';
            toast('6-digit OTP generated!');
            paint();
          } else {
            const { token, user } = await api('/auth/otp/verify', { method: 'POST', body: { email: otpSentTo, otp: fd.otp } });
            setAuth(token, user);
            toast(`Signed in as ${user.name}! 🎉`);
            router();
          }
        } catch (err) {
          toast(err.message, { type: 'error' });
          btn.disabled = false; btn.textContent = otpSentTo ? 'Verify & Sign in' : 'Send 6-digit OTP';
        }
      });
      $('#autoOtpBtn')?.addEventListener('click', () => { if ($('#otpCodeIn')) $('#otpCodeIn').value = demoOtpVal; });
      $('#resetOtpEmail')?.addEventListener('click', () => { otpSentTo = ''; demoOtpVal = ''; paint(); });

      $('#authForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.target));
        const btn = $('#authBtn');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
        try {
          const { token, user } = await api('/auth/' + mode, { method: 'POST', body });
          setAuth(token, user);
          toast(mode === 'login' ? `Welcome back, ${user.name.split(' ')[0]}!` : `Welcome to Lumen, ${user.name.split(' ')[0]}! 🎉`);
          router();
        } catch (err) {
          toast(err.message, { type: 'error' });
          btn.disabled = false; btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
        }
      });
    };
    paint();
    return;
  }

  setTitle('My account');
  const u = state.user;
  let tab = 'orders'; // 'orders' | 'addresses' | 'security'
  let orders = [];

  app.innerHTML = `
  <div class="container page-head">
    <div class="account-head"><span class="avatar">${esc(initials(u.name))}</span><div><h2 style="margin:0">Hi, ${esc(u.name)} 👋</h2><span style="opacity:.85">${esc(u.email)}${u.phone ? ' · 📞 ' + esc(u.phone) : ''} · Member since ${fmtDate(u.created, { month: 'short', year: 'numeric' })}</span></div><span class="spacer"></span><button class="btn btn-sm" id="logoutBtn">Sign out</button></div>
    <div class="acct-nav" id="acctNav">
      <button class="active" data-atab="orders">📦 Orders</button>
      <button data-atab="addresses">📍 Saved Addresses (${(u.addresses || []).length})</button>
      <button data-atab="security">🔐 Profile & Security</button>
    </div>
    <div id="acctBody">${'<div class="skeleton" style="height:140px;margin-bottom:16px;border-radius:16px"></div>'.repeat(2)}</div>
  </div>`;

  $('#logoutBtn').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setAuth(null, null); toast('Signed out'); router();
  });

  const paintTab = () => {
    $$('#acctNav button').forEach((b) => b.classList.toggle('active', b.dataset.atab === tab));
    const body = $('#acctBody');

    if (tab === 'orders') {
      const stages = ['confirmed', 'packed', 'shipped', 'delivered'];
      body.innerHTML = orders.length ? orders.map((o) => {
        const stage = o.status === 'cancelled' ? -1 : Math.max(stages.indexOf(o.status), Math.min(3, Math.floor((Date.now() - new Date(o.createdAt)) / ((new Date(o.estimatedDelivery) - new Date(o.createdAt)) / 3))));
        return `
        <div class="order-card">
          <div class="order-card-head">
            <div><span>Order placed</span><b>${fmtDate(o.createdAt)}</b></div>
            <div><span>Total</span><b>${money(o.total)}</b></div>
            <div><span>Payment</span><b>${esc(fmtPayment(o.payment))}</b></div>
            <div><span>Order #</span><b>${esc(o.id)}</b></div>
            <span class="spacer"></span>
            <span class="status ${o.status}">${o.status !== 'cancelled' ? '●' : '✕'} ${o.status}</span>
          </div>
          <div class="order-card-body">
            ${o.status !== 'cancelled' ? `<div class="tracker">${['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((s, i) => `<div class="${i <= stage ? 'on' : ''}">${s}</div>`).join('')}</div>` : ''}
            ${o.items.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt=""><i>${i.qty}</i></div><a class="mi-title" href="#/product/${i.id}">${esc(i.title)}</a><b>${money(i.lineTotal)}</b></div>`).join('')}
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a class="btn btn-sm" href="#/order/${o.id}">View receipt</a>
              ${['confirmed', 'packed'].includes(o.status) && stage < 2 ? `<button class="btn btn-sm btn-ghost" data-cancel="${o.id}" style="color:var(--danger)">Cancel order</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('') : `<div class="empty"><div class="big">📦</div><h3>No orders yet</h3><p>When you place an order, it will show up here.</p><a class="btn btn-primary" href="#/shop">Start shopping</a></div>`;

      body.onclick = async (e) => {
        const id = e.target.closest('[data-cancel]')?.dataset.cancel;
        if (!id || !confirm('Cancel this order?')) return;
        try {
          const updated = await api(`/orders/${id}/cancel`, { method: 'POST' });
          orders.splice(orders.findIndex((o) => o.id === id), 1, updated);
          paintTab();
          toast('Order cancelled. Refund will be processed in 3–5 days.');
        } catch (err) { toast(err.message, { type: 'error' }); }
      };
      return;
    }

    if (tab === 'addresses') {
      const addrs = state.user.addresses || [];
      body.innerHTML = `
        <div class="addr-grid" style="margin-bottom:20px">
          ${addrs.map((a, i) => `
            <div class="addr-card">
              <span class="tag new">${esc(a.label || 'Address')}</span>
              <b>${esc(a.name)}</b>
              <p class="muted" style="font-size:.85rem;margin:4px 0 12px">${esc(a.line1)}${a.line2 ? ', ' + esc(a.line2) : ''}<br>${esc(a.city)}, ${esc(a.state)} — ${esc(a.pincode)}<br>📞 ${esc(a.phone)}</p>
              <button class="btn btn-sm btn-ghost" data-rmaddr="${i}" style="color:var(--danger)">Remove</button>
            </div>`).join('')}
        </div>
        <form class="panel" id="newAddrForm" style="max-width:620px">
          <h3>+ Add new address</h3>
          <div class="grid-2">
            <div class="field"><label>Label (e.g. Home, Office)</label><input class="input" name="label" value="Home" required></div>
            <div class="field"><label>Recipient name</label><input class="input" name="name" value="${esc(state.user.name)}" required></div>
            <div class="field"><label>Mobile number</label><input class="input" name="phone" value="${esc(state.user.phone || '')}" maxlength="10" required></div>
            <div class="field"><label>PIN code</label><input class="input" name="pincode" maxlength="6" required></div>
            <div class="field span-2"><label>Street address</label><input class="input" name="line1" required></div>
            <div class="field"><label>City</label><input class="input" name="city" required></div>
            <div class="field"><label>State</label><select class="input" name="state" required>${STATES.map((s) => `<option>${s}</option>`).join('')}</select></div>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:14px">Save address</button>
        </form>`;

      $$('[data-rmaddr]', body).forEach((b) => b.addEventListener('click', async () => {
        const next = addrs.filter((_, idx) => idx !== Number(b.dataset.rmaddr));
        const { user } = await api('/auth/profile', { method: 'PATCH', body: { addresses: next } });
        setAuth(state.token, user);
        toast('Address removed');
        paintTab();
      }));
      $('#newAddrForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        const next = [{ id: String(Date.now()), ...fd }, ...addrs].slice(0, 5);
        try {
          const { user } = await api('/auth/profile', { method: 'PATCH', body: { addresses: next } });
          setAuth(state.token, user);
          toast('Address saved');
          paintTab();
        } catch (err) { toast(err.message, { type: 'error' }); }
      });
      return;
    }

    if (tab === 'security') {
      body.innerHTML = `
        <div class="grid-2" style="align-items:start">
          <form class="panel form-stack" id="profForm">
            <h3>👤 Profile details</h3>
            <div class="field"><label>Full name</label><input class="input" name="name" value="${esc(state.user.name)}" required></div>
            <div class="field"><label>Email address</label><input class="input" value="${esc(state.user.email)}" disabled></div>
            <div class="field"><label>Mobile number</label><input class="input" name="phone" value="${esc(state.user.phone || '')}" maxlength="10" placeholder="10-digit mobile"></div>
            <button class="btn btn-primary btn-sm" style="justify-self:start">Save profile</button>
          </form>
          <form class="panel form-stack" id="userPwForm">
            <h3>🔐 Change password</h3>
            <div class="field"><label>Current password</label><input class="input" name="current" type="password" required></div>
            <div class="field"><label>New password (min 6 chars)</label><input class="input" name="next" type="password" minlength="6" required></div>
            <button class="btn btn-primary btn-sm" style="justify-self:start">Update password</button>
            <hr style="border:0;border-top:1px solid var(--border);margin:8px 0">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
              <span class="muted" style="font-size:.84rem">Active sessions on this account: <b>${activeSessions}</b></span>
              <button type="button" class="btn btn-sm" id="logoutAllBtn">Sign out other devices</button>
            </div>
          </form>
        </div>`;

      $('#profForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          const { user } = await api('/auth/profile', { method: 'PATCH', body: fd });
          setAuth(state.token, user);
          toast('Profile updated');
          router();
        } catch (err) { toast(err.message, { type: 'error' }); }
      });
      $('#userPwForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          await api('/auth/password', { method: 'POST', body: fd });
          e.target.reset();
          toast('Password updated & other sessions signed out');
        } catch (err) { toast(err.message, { type: 'error' }); }
      });
      $('#logoutAllBtn')?.addEventListener('click', async () => {
        await api('/auth/logout-all', { method: 'POST' });
        activeSessions = 1;
        toast('Signed out of all other sessions');
        paintTab();
      });
    }
  };

  $('#acctNav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-atab]');
    if (!b) return;
    tab = b.dataset.atab;
    paintTab();
  });

  orders = await api('/orders');
  if (!isCurrent()) return;
  paintTab();
}

// ---------- Wishlist ----------
async function renderWishlist({ isCurrent }) {
  setTitle('Wishlist');
  const app = $('#app');
  app.innerHTML = `<div class="container page-head"><div class="breadcrumbs"><a href="#/">Home</a> / <span>Wishlist</span></div><h1>My wishlist <span class="muted" style="font-size:1rem">(${state.wishlist.length})</span></h1></div>
    <div class="container" style="padding-bottom:60px"><div class="product-grid" id="wishGrid">${state.wishlist.length ? skeletonCards(Math.min(4, state.wishlist.length)) : ''}</div></div>`;
  if (!state.wishlist.length) {
    $('#wishGrid').outerHTML = `<div class="empty"><div class="big">💝</div><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it for later.</p><a class="btn btn-primary" href="#/shop">Explore products</a></div>`;
    return;
  }
  const { items } = await api('/products?limit=48&ids=' + state.wishlist.join(','));
  if (!isCurrent()) return;
  cacheProducts(items);
  $('#wishGrid').innerHTML = items.map(productCard).join('');
}

// ---------- Help ----------
function renderHelp() {
  setTitle('Help Centre');
  const faqs = [
    ['How long does delivery take?', 'Standard delivery takes 3–5 business days. Express delivery arrives within 1–2 business days in most cities.'],
    ['Is shipping free?', 'Yes! Standard shipping is free on all orders over ₹999. Below that, a flat ₹79 fee applies. Express delivery costs ₹149.'],
    ['What is your return policy?', 'You can return most items within 10 days of delivery for a full refund, as long as they are unused and in original packaging.'],
    ['Which payment methods do you accept?', 'We accept all major credit and debit cards (Visa, Mastercard, RuPay, Amex), UPI (QR, Intent, VPA), NetBanking across 40+ banks, No-Cost Bank EMI, and Cash on Delivery for orders up to ₹50,000.'],
    ['How do I track my order?', 'Sign in and go to My Account → Your orders to see live order status. You can also ask our 24/7 Lumen AI Chatbot in the bottom-right corner.'],
    ['Can I cancel my order?', 'Yes — orders can be cancelled from your account any time before they are shipped. Refunds are processed within 3–5 business days.'],
  ];
  $('#app').innerHTML = `
  <div class="container page-head" style="max-width:820px"><div class="breadcrumbs"><a href="#/">Home</a> / <span>Help Centre</span></div><h1>How can we help?</h1><p class="muted">Answers to the most common questions about orders, shipping and returns.</p></div>
  <div class="container faq" style="max-width:820px;padding-bottom:60px">
    ${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <div class="panel" style="margin-top:24px;text-align:center"><h3>Still need help?</h3><p class="muted">Our support team is available 24/7 at <b>support@lumen.store</b> or <b>1800-123-4567</b>.</p><a class="btn btn-primary btn-sm" href="#/contact">Contact Us</a></div>
  </div>`;
}

// ---------- Footer Info & Interactive Pages ----------
function renderInfoPage({ parts }) {
  const slug = parts[0];
  const pages = {
    'mailing-list': {
      title: 'Join Our Mailing List',
      sub: 'Be the first to hear about new product drops, private sales, and members-only perks.',
      html: `
        <div class="panel" style="max-width:540px;margin:0 auto;text-align:center;padding:36px 28px">
          <div style="font-size:2.6rem;margin-bottom:8px">💌</div>
          <h3>Unlock ₹250 off + 10% Welcome Bonus</h3>
          <p class="muted">Subscribe below and receive instant promo code <b>WELCOME10</b> in your inbox.</p>
          <form class="form-stack" id="mailingForm" style="text-align:left;margin-top:18px">
            <div class="field"><label>Full name</label><input class="input" name="name" placeholder="Aarav Sharma" required></div>
            <div class="field"><label>Email address</label><input class="input" type="email" name="email" placeholder="you@example.com" required></div>
            <button class="btn btn-primary btn-block">Join Mailing List</button>
          </form>
        </div>`,
      bind: () => {
        $('#mailingForm')?.addEventListener('submit', (e) => {
          e.preventDefault();
          e.target.reset();
          toast('Subscribed! Use code WELCOME10 at checkout 🎉');
        });
      },
    },
    'gift-cards': {
      title: 'Lumen Digital Gift Cards',
      sub: 'Give the gift of choice. Delivered instantly via email with no expiry date.',
      html: `
        <div class="panel" style="max-width:640px;margin:0 auto">
          <h3>🎁 Send a Digital Gift Card</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0" id="gcAmounts">
            ${[500, 1000, 2500, 5000].map((a, i) => `<button type="button" class="chip ${i === 1 ? 'active' : ''}" data-gcamt="${a}">${money(a)}</button>`).join('')}
          </div>
          <form class="form-stack" id="gcForm">
            <div class="grid-2">
              <div class="field"><label>Recipient's name</label><input class="input" name="rname" placeholder="Priya Mehta" required></div>
              <div class="field"><label>Recipient's email</label><input class="input" type="email" name="remail" placeholder="priya@example.com" required></div>
            </div>
            <div class="field"><label>Personal message (optional)</label><textarea class="input" name="msg" rows="3" placeholder="Wishing you the happiest birthday!"></textarea></div>
            <button class="btn btn-primary" id="gcBtn">Purchase Gift Card · ₹1,000</button>
          </form>
        </div>`,
      bind: () => {
        let amt = 1000;
        $$('[data-gcamt]').forEach((b) => b.addEventListener('click', () => {
          amt = Number(b.dataset.gcamt);
          $$('[data-gcamt]').forEach((x) => x.classList.toggle('active', x === b));
          $('#gcBtn').textContent = `Purchase Gift Card · ${money(amt)}`;
        }));
        $('#gcForm')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const code = 'GIFT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
          e.target.reset();
          toast(`Gift card (${money(amt)}) generated! Code: ${code} 🎁`);
        });
      },
    },
    about: {
      title: 'About Us',
      sub: 'Thoughtfully curated everyday essentials — built for modern living.',
      html: `
        <div class="panel" style="display:grid;gap:16px">
          <h3>Our Story</h3>
          <p>Founded with a single belief — great design and reliable quality shouldn't come with a luxury markup — <b>Lumen</b> partners directly with independent makers and top manufacturers across electronics, fashion, home, beauty, and fitness.</p>
          <div class="grid-3">
            <div class="panel" style="background:var(--surface-2)"><b>120,000+</b><span class="muted" style="display:block;font-size:.85rem">Happy customers across India</span></div>
            <div class="panel" style="background:var(--surface-2)"><b>4.6 ★</b><span class="muted" style="display:block;font-size:.85rem">Average verified product rating</span></div>
            <div class="panel" style="background:var(--surface-2)"><b>10-Day</b><span class="muted" style="display:block;font-size:.85rem">No-questions-asked returns</span></div>
          </div>
        </div>`,
    },
    'what-is-lumen': {
      title: 'What is Lumen?',
      sub: 'Your all-in-one destination for curated lifestyle, tech, and home essentials.',
      html: `
        <div class="panel" style="display:grid;gap:14px">
          <h3>Designed Around You</h3>
          <p><b>Lumen</b> brings together hand-tested products across six core categories — Electronics, Fashion, Home & Living, Beauty, Sports & Fitness, and Accessories — backed by transparent pricing, instant UPI/NetBanking/3DS2 checkout, and 24/7 AI + human support.</p>
          <ul class="feature-list">
            <li>Direct-to-consumer pricing with up to 50% off traditional retail MRP</li>
            <li>Same-day dispatch & free delivery on orders above ₹999</li>
            <li>100% genuine products with full manufacturer warranty</li>
            <li>Instant refunds on returns and cancellations</li>
          </ul>
          <div style="margin-top:8px"><a class="btn btn-primary" href="#/shop">Explore the Catalog ${ICON.arrow}</a></div>
        </div>`,
    },
    shipping: {
      title: 'Shipping & Delivery',
      sub: 'Fast, trackable delivery to 19,000+ PIN codes across India.',
      html: `
        <div class="panel" style="display:grid;gap:14px">
          <ul class="feature-list">
            <li><b>Free Standard Shipping:</b> Automatically applied on all orders of ₹999 or more (arrives in 3–5 business days). Orders below ₹999 carry a flat ₹79 fee.</li>
            <li><b>Express Delivery (₹149):</b> Priority air dispatch arriving within 1–2 business days in metro and Tier-1 cities.</li>
            <li><b>Same-Day Dispatch:</b> Orders placed before 2:00 PM IST ship out the same business day.</li>
            <li><b>Live Tracking:</b> Track every milestone (Confirmed → Packed → Shipped → Delivered) from <a href="#/account" style="color:var(--primary);font-weight:700">My Account</a> or via our AI Support Chatbot.</li>
          </ul>
        </div>`,
    },
    returns: {
      title: 'Returns & Refunds Policy',
      sub: 'Shop with confidence — 10-day hassle-free returns and rapid refunds.',
      html: `
        <div class="panel" style="display:grid;gap:14px">
          <ul class="feature-list">
            <li><b>10-Day Return Window:</b> Return or exchange any item within 10 days of delivery as long as it is unused, unwashed, and in its original packaging with tags intact.</li>
            <li><b>Free Reverse Pickup:</b> Our courier partner picks up the return directly from your doorstep at no extra cost.</li>
            <li><b>Fast Refunds:</b> Refunds are initiated within 24 hours of quality check and credited to your original UPI, Card, or Bank account in 3–5 business days.</li>
          </ul>
          <div style="margin-top:8px"><a class="btn btn-primary" href="#/start-return">Start a Return Request ${ICON.arrow}</a></div>
        </div>`,
    },
    'start-return': {
      title: 'Start a Return',
      sub: 'Submit a return or replacement request in under a minute.',
      html: `
        <form class="panel form-stack" id="returnForm" style="max-width:560px;margin:0 auto">
          <div class="field"><label>Order Number</label><input class="input" name="orderId" placeholder="e.g. LMNMWQ..." required></div>
          <div class="field"><label>Email or Mobile used for order</label><input class="input" name="contact" value="${esc(state.user?.email || '')}" placeholder="you@example.com" required></div>
          <div class="field"><label>Reason for return</label>
            <select class="input" name="reason" required>
              <option value="">Select a reason</option>
              <option>Size or fit issue</option>
              <option>Received damaged or defective item</option>
              <option>Changed my mind</option>
              <option>Wrong item delivered</option>
            </select>
          </div>
          <div class="field"><label>Resolution preferred</label>
            <select class="input" name="resolution" required>
              <option>Full refund to original payment method</option>
              <option>Instant Lumen Store Credit (+5% bonus)</option>
              <option>Replacement with same item</option>
            </select>
          </div>
          <button class="btn btn-primary">Submit Return Request</button>
        </form>`,
      bind: () => {
        $('#returnForm')?.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.target));
          e.target.reset();
          toast(`Return request logged for ${fd.orderId.toUpperCase()}! Pickup scheduled within 24h 📦`);
        });
      },
    },
    terms: {
      title: 'Terms & Conditions',
      sub: 'Last updated: November 2026',
      html: `
        <div class="panel" style="display:grid;gap:12px">
          <h3>1. Use of the Platform</h3>
          <p class="muted">By accessing and placing orders on Lumen Retail Pvt. Ltd., you agree to provide accurate billing, shipping, and contact information.</p>
          <h3>2. Pricing & Availability</h3>
          <p class="muted">All prices are listed in Indian Rupees (INR) and are inclusive of GST. Promotional codes (such as WELCOME10, FLAT500, FREESHIP) are validated server-side at checkout.</p>
          <h3>3. Warranty & Liability</h3>
          <p class="muted">Products carry their respective manufacturer warranties as stated on individual specification tabs. Lumen's maximum liability is limited to the purchase price of the order.</p>
        </div>`,
    },
    privacy: {
      title: 'Privacy Policy',
      sub: 'How we protect and handle your personal data.',
      html: `
        <div class="panel" style="display:grid;gap:12px">
          <h3>1. Data We Collect</h3>
          <p class="muted">We collect only the information needed to fulfil your orders and secure your account: name, email, phone number, shipping addresses, and order history.</p>
          <h3>2. Payment Security</h3>
          <p class="muted">We never store raw credit/debit card numbers, CVVs, or NetBanking passwords. All card and UPI payments are processed through 3D Secure 2.0 / NPCI gateways and only the last 4 digits or transaction references are retained on receipts.</p>
          <h3>3. Your Rights</h3>
          <p class="muted">You can update your profile, manage saved addresses, or sign out of all active devices at any time under <a href="#/account" style="color:var(--primary);font-weight:700">My Account → Profile & Security</a>.</p>
        </div>`,
    },
    contact: {
      title: 'Contact Us',
      sub: 'We are here 24/7 — reach out via message, email, phone, or our AI Support Assistant.',
      html: `
        <div class="grid-2" style="align-items:start">
          <form class="panel form-stack" id="contactForm">
            <h3>✉️ Send us a message</h3>
            <div class="field"><label>Your name</label><input class="input" name="name" value="${esc(state.user?.name || '')}" required></div>
            <div class="field"><label>Email address</label><input class="input" type="email" name="email" value="${esc(state.user?.email || '')}" required></div>
            <div class="field"><label>Order ID (optional)</label><input class="input" name="orderId" placeholder="LMN..."></div>
            <div class="field"><label>Message</label><textarea class="input" name="msg" rows="4" placeholder="How can we help you today?" required></textarea></div>
            <button class="btn btn-primary">Send Message</button>
          </form>
          <div class="panel" style="display:grid;gap:14px">
            <h3>📞 Direct Channels</h3>
            <div><b>Customer Support Email</b><div class="muted">support@lumen.store (replies within 2 hours)</div></div>
            <div><b>Toll-Free Helpline</b><div class="muted">1800-123-4567 (9:00 AM – 11:00 PM IST)</div></div>
            <div><b>Corporate Office</b><div class="muted">Lumen Retail Pvt. Ltd., Indiranagar, Bengaluru, Karnataka 560038</div></div>
          </div>
        </div>`,
      bind: () => {
        $('#contactForm')?.addEventListener('submit', (e) => {
          e.preventDefault();
          e.target.reset();
          toast('Message received! Our support team will reply shortly 💬');
        });
      },
    },
  };

  const page = pages[slug];
  if (!page) return renderNotFound();
  setTitle(page.title);
  $('#app').innerHTML = `
    <div class="container page-head" style="max-width:860px">
      <div class="breadcrumbs"><a href="#/">Home</a> / <span>${esc(page.title)}</span></div>
      <h1>${esc(page.title)}</h1>
      <p class="muted">${esc(page.sub)}</p>
    </div>
    <div class="container" style="max-width:860px;padding-bottom:64px">${page.html}</div>`;
  page.bind?.();
}

function renderNotFound() {
  setTitle('Page not found');
  $('#app').innerHTML = `<div class="container empty"><div class="big">🧭</div><h1>Page not found</h1><p>The page you're looking for doesn't exist or has moved.</p><a class="btn btn-primary" href="#/">Back to home</a></div>`;
}

// ---------- Lumen AI Support Chatbot ----------
function formatBotMarkdown(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function initChatbot() {
  const fab = $('#chatFab');
  const widget = $('#chatWidget');
  const msgsEl = $('#chatMessages');
  const chipsEl = $('#chatChips');
  const form = $('#chatForm');
  const input = $('#chatInput');
  if (!fab || !widget) return;

  const DEFAULT_CHIPS = ['Track my order', 'Active coupon codes', 'Gifts under ₹2,500', 'UPI & EMI options', 'Return policy'];
  let history = store.get('chatHistory', []);

  const welcomeMsg = () => ({
    role: 'bot',
    reply: `Hi${state.user ? ' ' + state.user.name.split(' ')[0] : ''}! 👋 I'm **Lumen AI**, your 24/7 shopping & support assistant.\nAsk me to **recommend products**, **track an order** (\`LMN...\`), **apply a coupon**, or help with **UPI, NetBanking, EMI & returns**.`,
    suggestions: DEFAULT_CHIPS,
  });

  if (!history.length) history = [welcomeMsg()];

  const setChips = (list = DEFAULT_CHIPS) => {
    chipsEl.innerHTML = list.map((c) => `<button type="button" data-chat-chip="${esc(c)}">${esc(c)}</button>`).join('');
  };

  const renderMessage = (m) => {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${m.role === 'user' ? 'user' : 'bot'}`;
    let html = `<div class="chat-bubble">${m.role === 'user' ? esc(m.text) : formatBotMarkdown(m.reply || '')}</div>`;

    if (m.coupons?.length) {
      html += `<div class="chat-coupons">${m.coupons.map((c) => `<button type="button" data-chat-coupon="${esc(c)}">🏷️ Apply ${esc(c)}</button>`).join('')}</div>`;
    }
    if (m.order) {
      html += `<div class="chat-cards"><a class="chat-prod" href="#/order/${esc(m.order.id)}" style="grid-template-columns:1fr auto"><div><b>Order #${esc(m.order.id)}</b><div class="cp-meta">Status: ${esc(m.order.status.toUpperCase())} · ${money(m.order.total)}</div></div><span class="btn btn-sm">Receipt →</span></a></div>`;
    }
    if (m.products?.length) {
      html += `<div class="chat-cards">${m.products.map((p) => `
        <div class="chat-prod">
          <a href="#/product/${esc(p.id)}"><img src="${esc(p.image)}" alt="" data-cat="${esc(p.category || '')}"></a>
          <div>
            <a href="#/product/${esc(p.id)}"><b>${esc(p.title)}</b></a>
            <div class="cp-meta">${money(p.price)} <span style="text-decoration:line-through">${money(p.mrp)}</span> · ${p.rating}★</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-chat-buy="${esc(p.id)}" style="height:32px;padding:0 11px;font-size:.76rem">View</button>
        </div>`).join('')}</div>`;
    }
    wrap.innerHTML = html;
    msgsEl.appendChild(wrap);
  };

  const paintAll = () => {
    msgsEl.innerHTML = '';
    history.forEach(renderMessage);
    const lastBot = [...history].reverse().find((x) => x.role === 'bot');
    setChips(lastBot?.suggestions || DEFAULT_CHIPS);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  };

  const toggleChat = (force) => {
    const open = force !== undefined ? force : !widget.classList.contains('open');
    widget.classList.toggle('open', open);
    fab.classList.toggle('open', open);
    widget.setAttribute('aria-hidden', String(!open));
    if (open) {
      paintAll();
      setTimeout(() => input.focus(), 120);
    }
  };

  fab.addEventListener('click', () => toggleChat());
  $('#chatClose')?.addEventListener('click', () => toggleChat(false));
  $('#chatReset')?.addEventListener('click', () => {
    history = [welcomeMsg()];
    store.set('chatHistory', history);
    paintAll();
    toast('Chat conversation reset');
  });

  const sendQuery = async (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;

    // Quick client-side navigation shortcuts
    if (/^view my orders$/i.test(clean)) { location.hash = '#/account'; }
    if (/^sign in to my account$/i.test(clean)) { location.hash = '#/account'; }
    if (/^go to checkout$/i.test(clean)) { location.hash = '#/checkout'; }

    const userMsg = { role: 'user', text: clean };
    history.push(userMsg);
    renderMessage(userMsg);
    input.value = '';
    msgsEl.scrollTop = msgsEl.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.innerHTML = '<div class="chat-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div>';
    msgsEl.appendChild(typing);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    const { parts } = parseHash();
    const context = {
      route: parts[0] || 'home',
      productId: parts[0] === 'product' ? parts[1] : null,
      cartSubtotal: cartSubtotal(),
      cartCount: cartCount(),
    };

    try {
      const res = await api('/support/chat', { method: 'POST', body: { message: clean, context } });
      typing.remove();
      const botMsg = { role: 'bot', ...res };
      history.push(botMsg);
      if (history.length > 30) history = history.slice(-30);
      store.set('chatHistory', history);
      renderMessage(botMsg);
      setChips(res.suggestions || DEFAULT_CHIPS);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch (err) {
      typing.remove();
      const errMsg = { role: 'bot', reply: `Sorry, I ran into an issue: ${err.message}. You can also reach us 24/7 at **support@lumen.store**.` };
      history.push(errMsg);
      renderMessage(errMsg);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendQuery(input.value);
  });

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chat-chip]');
    if (!b) return;
    const label = b.dataset.chatChip;
    if (/^apply freeship coupon$/i.test(label)) {
      state.coupon = 'FREESHIP';
      store.set('coupon', 'FREESHIP');
      toast('Coupon FREESHIP saved for your cart! 🎉');
      return;
    }
    sendQuery(label);
  });

  msgsEl.addEventListener('click', (e) => {
    const cBtn = e.target.closest('[data-chat-coupon]');
    if (cBtn) {
      const code = cBtn.dataset.chatCoupon;
      state.coupon = code;
      store.set('coupon', code);
      toast(`Coupon ${code} applied to your cart! 🎉`, { action: { href: '#/cart', label: 'View cart' } });
      if (location.hash.startsWith('#/cart') || location.hash.startsWith('#/checkout')) router();
      return;
    }
    const pBtn = e.target.closest('[data-chat-buy]');
    if (pBtn) {
      location.hash = '#/product/' + pBtn.dataset.chatBuy;
    }
  });
}

// ---------- Boot ----------
async function boot() {
  initHeader();
  initChatbot();
  updateBadges();
  renderDrawer();
  try { state.categories = await api('/categories'); } catch { state.categories = []; }
  window.addEventListener('hashchange', router);
  router();
}
boot();
