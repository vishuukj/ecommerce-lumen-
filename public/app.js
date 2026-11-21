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
  const left = FREE_SHIP - sub;
  const pct = Math.min(100, (sub / FREE_SHIP) * 100);
  return `${left > 0 ? `Add <b>${money(left)}</b> more for <b>FREE shipping</b> 🚚` : '🎉 You\'ve unlocked <b>FREE shipping!</b>'}
    <div class="bar"><i style="width:${pct}%"></i></div>`;
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
      <div class="qty sm">
        <button data-qty="${esc(it.key)}" data-delta="-1" aria-label="Decrease">−</button>
        <span>${it.qty}</span>
        <button data-qty="${esc(it.key)}" data-delta="1" aria-label="Increase" ${it.qty >= Math.min(10, it.stock) ? 'disabled' : ''}>+</button>
      </div>
    </div>
    <div class="ci-right">
      <b>${money(it.price * it.qty)}</b>
      <button class="link-btn" data-remove="${esc(it.key)}">Remove</button>
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
  $('#drawerFoot').innerHTML = `
    <div class="sum-row"><span>Subtotal</span><b>${money(sub)}</b></div>
    ${savings ? `<div class="sum-row"><span>You save</span><span class="green">${money(savings)}</span></div>` : ''}
    <p class="muted" style="font-size:.8rem;margin:4px 0 14px">Taxes included. Shipping & coupons calculated at checkout.</p>
    <div class="grid-2">
      <a class="btn" href="#/cart" data-close-drawer>View cart</a>
      <a class="btn btn-primary" href="#/checkout" data-close-drawer>Checkout</a>
    </div>`;
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

  $('#footerNewsletter').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('You\'re subscribed! Check your inbox 💌'); });
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
  el.innerHTML = `
    <h3>Order summary</h3>
    ${items ? `<div class="mini-items">${state.cart.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt="" data-cat="${i.category}"><i>${i.qty}</i></div><span class="mi-title">${esc(i.title)}${i.size ? ` · ${esc(i.size)}` : ''}</span><b>${money(i.price * i.qty)}</b></div>`).join('')}</div>` : ''}
    ${quote.coupon
      ? `<div class="applied"><span>🏷️ ${esc(quote.coupon.code)} — ${esc(quote.coupon.label)}</span><button class="link-btn" id="rmCoupon">Remove</button></div>`
      : `<form class="coupon-row" id="couponForm"><input class="input" name="code" placeholder="Coupon code" aria-label="Coupon code"><button class="btn btn-sm" style="height:42px">Apply</button></form>
         <div class="coupon-hints"><span class="muted" style="font-size:.75rem">Try:</span>${['WELCOME10', 'FLAT500', 'FREESHIP'].map((c) => `<button type="button" data-coupon="${c}">${c}</button>`).join('')}</div>`}
    <div style="margin-top:16px">
      <div class="sum-row"><span>Subtotal</span><span>${money(quote.subtotal)}</span></div>
      ${quote.discount ? `<div class="sum-row"><span>Discount</span><span class="green">− ${money(quote.discount)}</span></div>` : ''}
      <div class="sum-row"><span>Shipping ${quote.shippingMethod === 'express' ? '(Express)' : ''}</span><span>${quote.shipping ? money(quote.shipping) : '<span class="green">FREE</span>'}</span></div>
      <div class="sum-row total"><span>Total</span><span>${money(quote.total)}</span></div>
    </div>
    ${cta ? `<a class="btn btn-primary btn-block" href="#/checkout" style="margin-top:16px;height:52px">Proceed to checkout ${ICON.arrow}</a>` : ''}
    <div class="secure-note">${ICON.lock} Secure checkout · 100% purchase protection</div>`;

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

async function renderCheckout() {
  setTitle('Checkout');
  const app = $('#app');
  if (!state.cart.length) { location.hash = '#/cart'; return; }

  const saved = store.get('address', {});
  const co = { step: 1, address: { email: state.user?.email || '', ...saved }, shipping: 'standard', payment: 'card' };

  app.innerHTML = `
  <div class="container page-head"><div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/cart">Cart</a> / <span>Checkout</span></div><h1>Checkout</h1></div>
  <div class="container two-col">
    <div>
      <div class="steps" id="steps">${['Address', 'Delivery', 'Payment'].map((s, i) => `<div class="step" data-step="${i + 1}"><span class="num">${i + 1}</span><span class="label">${s}</span></div>`).join('')}</div>
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
    f.querySelector('.err').textContent = msg || '';
  };

  const field = (name, label, attrs = '', cls = '') => `
    <div class="field ${cls}"><label for="f_${name}">${label}</label><input class="input" id="f_${name}" name="${name}" value="${esc(co.address[name] || '')}" ${attrs}><span class="err"></span></div>`;

  const steps = {
    1: () => `
      <form class="panel" id="addrForm" novalidate>
        <h3>📍 Shipping address</h3>
        <div class="grid-2">
          ${field('name', 'Full name', 'autocomplete="name" required')}
          ${field('phone', 'Phone number', 'inputmode="tel" autocomplete="tel" maxlength="10" placeholder="10-digit mobile" required')}
          ${state.user ? '' : field('email', 'Email (for order updates)', 'type="email" autocomplete="email" required', 'span-2')}
          ${field('line1', 'Address (house no, building, street)', 'autocomplete="address-line1" required', 'span-2')}
          ${field('line2', 'Landmark / area (optional)', 'autocomplete="address-line2"', 'span-2')}
          ${field('city', 'City', 'autocomplete="address-level2" required')}
          <div class="field"><label for="f_state">State</label><select class="input" id="f_state" name="state" required><option value="">Select state</option>${STATES.map((s) => `<option ${co.address.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select><span class="err"></span></div>
          ${field('pincode', 'PIN code', 'inputmode="numeric" maxlength="6" autocomplete="postal-code" required')}
        </div>
        <label class="check" style="margin-top:10px"><input type="checkbox" name="save" checked> Save this address for next time</label>
        <button class="btn btn-primary" style="margin-top:16px;min-width:220px">Continue to delivery ${ICON.arrow}</button>
      </form>`,
    2: () => {
      const d = (n) => fmtDate(Date.now() + n * 86400000, { weekday: 'short', day: 'numeric', month: 'short' });
      const freeStd = cartSubtotal() >= FREE_SHIP || state.coupon === 'FREESHIP';
      return `
      <div class="panel">
        <h3>🚚 Delivery method</h3>
        <p class="muted" style="margin-top:-4px">Delivering to <b>${esc(co.address.name)}</b>, ${esc(co.address.line1)}, ${esc(co.address.city)} ${esc(co.address.pincode)} · <a href="#" id="editAddr" style="color:var(--primary)">Edit</a></p>
        <label class="option-card ${co.shipping === 'standard' ? 'active' : ''}"><input type="radio" name="ship" value="standard" ${co.shipping === 'standard' ? 'checked' : ''}><div class="oc-body"><b>Standard delivery</b><span>Arrives by ${d(5)}</span></div><b>${freeStd ? 'FREE' : money(79)}</b></label>
        <label class="option-card ${co.shipping === 'express' ? 'active' : ''}"><input type="radio" name="ship" value="express" ${co.shipping === 'express' ? 'checked' : ''}><div class="oc-body"><b>Express delivery ⚡</b><span>Arrives by ${d(2)}</span></div><b>${state.coupon === 'FREESHIP' ? 'FREE' : money(149)}</b></label>
        <button class="btn btn-primary" id="toPay" style="margin-top:8px;min-width:220px">Continue to payment ${ICON.arrow}</button>
      </div>`;
    },
    3: () => `
      <div class="panel">
        <h3>💳 Payment</h3>
        <label class="option-card ${co.payment === 'card' ? 'active' : ''}"><input type="radio" name="pay" value="card" ${co.payment === 'card' ? 'checked' : ''}><div class="oc-body"><b>Credit / Debit card</b><span>Visa, Mastercard, RuPay, Amex</span></div>💳</label>
        <label class="option-card ${co.payment === 'upi' ? 'active' : ''}"><input type="radio" name="pay" value="upi" ${co.payment === 'upi' ? 'checked' : ''}><div class="oc-body"><b>UPI</b><span>GPay, PhonePe, Paytm & more</span></div>📱</label>
        <label class="option-card ${co.payment === 'cod' ? 'active' : ''}"><input type="radio" name="pay" value="cod" ${co.payment === 'cod' ? 'checked' : ''}><div class="oc-body"><b>Cash on delivery</b><span>Pay when your order arrives</span></div>💵</label>
        <form id="payForm" novalidate style="margin-top:18px">${payFields()}</form>
      </div>`,
  };

  function payFields() {
    if (co.payment === 'card') return `
      <div class="card-preview"><span class="brand-ic" id="cpBrand"></span><div class="chip-ic"></div><div class="cp-num" id="cpNum">•••• •••• •••• ••••</div>
        <div class="cp-row"><div>Card holder<b id="cpName">YOUR NAME</b></div><div>Expires<b id="cpExp">MM/YY</b></div></div></div>
      <div class="grid-2">
        <div class="field span-2"><label>Card number</label><input class="input" name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23"><span class="err"></span></div>
        <div class="field span-2"><label>Name on card</label><input class="input" name="cardName" autocomplete="cc-name" placeholder="As printed on card"><span class="err"></span></div>
        <div class="field"><label>Expiry</label><input class="input" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"><span class="err"></span></div>
        <div class="field"><label>CVV</label><input class="input" name="cvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4"><span class="err"></span></div>
      </div>
      <p class="muted" style="font-size:.8rem">🧪 Demo mode — use test card <b>4242 4242 4242 4242</b>, any future expiry, any CVV. No real payment is made.</p>
      ${placeBtn()}`;
    if (co.payment === 'upi') return `
      <div class="field"><label>UPI ID</label><input class="input" name="upiId" placeholder="yourname@okbank"><span class="err"></span></div>
      <p class="muted" style="font-size:.8rem">A payment request will be sent to your UPI app (simulated in demo mode).</p>
      ${placeBtn()}`;
    return `<p class="muted">Pay with cash or UPI when your order is delivered. Available for orders up to ₹50,000.</p>${placeBtn()}`;
  }
  const placeBtn = () => `<button class="btn btn-primary btn-block" id="placeBtn" style="height:54px;margin-top:10px">${ICON.lock} Place order${quote ? ' · ' + money(quote.total) : ''}</button>`;

  function show() {
    paintSteps();
    $('#stepBody').innerHTML = steps[co.step]();
    $('#stepBody').firstElementChild.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    if (co.step === 1) bindAddress();
    if (co.step === 2) bindDelivery();
    if (co.step === 3) bindPayment();
  }

  function bindAddress() {
    const form = $('#addrForm');
    form.addEventListener('submit', (e) => {
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
      const { save, ...addr } = fd;
      co.address = { ...co.address, ...addr };
      if (save) store.set('address', { ...addr, email: undefined });
      co.step = 2; show();
    });
    form.addEventListener('input', (e) => fieldErr(form, e.target.name, ''));
  }

  function bindDelivery() {
    $('#editAddr').addEventListener('click', (e) => { e.preventDefault(); co.step = 1; show(); });
    $$('input[name=ship]').forEach((r) => r.addEventListener('change', () => {
      co.shipping = r.value;
      $$('.option-card').forEach((c) => c.classList.toggle('active', c.contains(r) && r.checked));
      refreshSummary();
    }));
    $('#toPay').addEventListener('click', () => { co.step = 3; show(); });
  }

  function bindPayment() {
    $$('input[name=pay]').forEach((r) => r.addEventListener('change', () => {
      co.payment = r.value;
      $$('.option-card').forEach((c) => c.classList.toggle('active', c.contains(r)));
      $('#payForm').innerHTML = payFields();
      bindPayForm();
    }));
    bindPayForm();
  }

  function bindPayForm() {
    const form = $('#payForm');
    const num = form.querySelector('[name=cardNumber]');
    if (num) {
      num.addEventListener('input', () => {
        const d = num.value.replace(/\D/g, '').slice(0, 19);
        num.value = d.replace(/(.{4})/g, '$1 ').trim();
        $('#cpNum').textContent = (d.padEnd(16, '•').match(/.{1,4}/g) || []).join(' ');
        $('#cpBrand').textContent = cardBrand(d);
      });
      form.querySelector('[name=cardName]').addEventListener('input', (e) => { $('#cpName').textContent = e.target.value.toUpperCase() || 'YOUR NAME'; });
      const exp = form.querySelector('[name=exp]');
      exp.addEventListener('input', () => {
        let d = exp.value.replace(/\D/g, '').slice(0, 4);
        if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
        exp.value = d; $('#cpExp').textContent = d || 'MM/YY';
      });
    }
    form.addEventListener('input', (e) => fieldErr(form, e.target.name, ''));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const payment = { method: co.payment };
      const errs = {};
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
        if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(fd.upiId || '')) errs.upiId = 'Enter a valid UPI ID (e.g. name@okbank)';
        payment.upiId = fd.upiId;
      }
      Object.keys(fd).forEach((k) => fieldErr(form, k, errs[k]));
      if (Object.keys(errs).length) return;

      const btn = $('#placeBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing payment…';
      try {
        await new Promise((r) => setTimeout(r, 1200)); // simulate gateway latency
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
  if (co.step === 3 && $('#placeBtn') && quote) $('#placeBtn').innerHTML = `${ICON.lock} Place order · ${money(quote.total)}`;
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

async function renderOrder({ parts, query, isCurrent }) {
  setTitle('Order confirmed');
  const o = await api('/orders/' + parts[1]);
  if (!isCurrent()) return;
  const isNew = query.get('new') === '1';
  $('#app').innerHTML = `
  <div class="container success">
    <div class="success-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <h1>${isNew ? 'Thank you for your order! 🎉' : 'Order details'}</h1>
    <p class="muted">${isNew ? `We've sent a confirmation to <b>${esc(o.email)}</b>. We'll let you know when it ships.` : `Placed on ${fmtDate(o.createdAt)}`}</p>
    <div class="order-meta">
      <div><span>Order number</span><b>${esc(o.id)}</b></div>
      <div><span>Estimated delivery</span><b>${fmtDate(o.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short' })}</b></div>
      <div><span>Payment</span><b style="text-transform:uppercase">${esc(o.payment.method)}${o.payment.last4 ? ' •••• ' + esc(o.payment.last4) : ''}</b></div>
    </div>
    <div class="panel" style="text-align:left">
      <div class="mini-items" style="max-height:none">${o.items.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt=""><i>${i.qty}</i></div><span class="mi-title">${esc(i.title)}${i.size ? ` · Size ${esc(i.size)}` : ''}</span><b>${money(i.lineTotal)}</b></div>`).join('')}</div>
      <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      ${o.discount ? `<div class="sum-row"><span>Discount (${esc(o.coupon)})</span><span class="green">− ${money(o.discount)}</span></div>` : ''}
      <div class="sum-row"><span>Shipping</span><span>${o.shipping ? money(o.shipping) : 'FREE'}</span></div>
      <div class="sum-row total"><span>Total paid</span><span>${money(o.total)}</span></div>
      <p class="muted" style="font-size:.85rem;margin-bottom:0">Shipping to ${esc(o.address.name)}, ${esc(o.address.line1)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pincode)}</p>
    </div>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
      <a class="btn btn-primary" href="#/shop">Continue shopping</a>
      ${state.user ? '<a class="btn" href="#/account">View my orders</a>' : '<a class="btn" href="#/account">Create an account</a>'}
    </div>
  </div>`;
  if (isNew) { confetti(); history.replaceState(null, '', '#/order/' + o.id); }
}

// ---------- Account ----------
async function renderAccount({ isCurrent }) {
  const app = $('#app');
  if (state.token && !state.user) setAuth(null, null);
  if (state.token) {
    try { const { user } = await api('/auth/me'); setAuth(state.token, user); } catch { /* falls through to login */ }
  }
  if (!isCurrent()) return;

  if (!state.user) {
    setTitle('Sign in');
    let mode = 'login';
    const paint = () => {
      app.innerHTML = `
      <div class="container auth-wrap">
        <div style="text-align:center;margin-bottom:22px"><div class="logo-mark" style="margin:0 auto 14px;width:52px;height:52px;font-size:1.5rem">L</div>
          <h1>${mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p class="muted">${mode === 'login' ? 'Sign in to track orders and checkout faster.' : 'Join Lumen for faster checkout and exclusive offers.'}</p></div>
        <div class="panel">
          <div class="auth-tabs"><button class="${mode === 'login' ? 'active' : ''}" data-mode="login">Sign in</button><button class="${mode === 'register' ? 'active' : ''}" data-mode="register">Register</button></div>
          <form class="form-stack" id="authForm" novalidate>
            ${mode === 'register' ? '<div class="field"><label>Full name</label><input class="input" name="name" autocomplete="name" required><span class="err"></span></div>' : ''}
            <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="email" required><span class="err"></span></div>
            <div class="field"><label>Password</label><input class="input" name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="6" required><span class="err"></span></div>
            <button class="btn btn-primary btn-block" id="authBtn">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
        </div>
      </div>`;
      $$('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; paint(); }));
      $('#authForm').addEventListener('submit', async (e) => {
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
  app.innerHTML = `
  <div class="container page-head">
    <div class="account-head"><span class="avatar">${esc(initials(u.name))}</span><div><h2 style="margin:0">Hi, ${esc(u.name)} 👋</h2><span style="opacity:.85">${esc(u.email)} · Member since ${fmtDate(u.created, { month: 'short', year: 'numeric' })}</span></div><span class="spacer"></span><button class="btn btn-sm" id="logoutBtn">Sign out</button></div>
    <h2>Your orders</h2>
    <div id="orders">${'<div class="skeleton" style="height:140px;margin-bottom:16px;border-radius:16px"></div>'.repeat(2)}</div>
  </div>`;
  $('#logoutBtn').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setAuth(null, null); toast('Signed out'); router();
  });

  const paintOrders = (orders) => {
    const stages = ['confirmed', 'packed', 'shipped', 'delivered'];
    $('#orders').innerHTML = orders.length ? orders.map((o) => {
      const stage = o.status === 'cancelled' ? -1 : Math.max(stages.indexOf(o.status), Math.min(3, Math.floor((Date.now() - new Date(o.createdAt)) / ((new Date(o.estimatedDelivery) - new Date(o.createdAt)) / 3))));
      return `
      <div class="order-card">
        <div class="order-card-head">
          <div><span>Order placed</span><b>${fmtDate(o.createdAt)}</b></div>
          <div><span>Total</span><b>${money(o.total)}</b></div>
          <div><span>Order #</span><b>${esc(o.id)}</b></div>
          <span class="spacer"></span>
          <span class="status ${o.status}">${o.status !== 'cancelled' ? '●' : '✕'} ${o.status}</span>
        </div>
        <div class="order-card-body">
          ${o.status !== 'cancelled' ? `<div class="tracker">${['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((s, i) => `<div class="${i <= stage ? 'on' : ''}">${s}</div>`).join('')}</div>` : ''}
          ${o.items.map((i) => `<div class="mini-item"><div class="thumb"><img src="${esc(i.image)}" alt=""><i>${i.qty}</i></div><a class="mi-title" href="#/product/${i.id}">${esc(i.title)}</a><b>${money(i.lineTotal)}</b></div>`).join('')}
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-sm" href="#/order/${o.id}">View details</a>
            ${['confirmed', 'packed'].includes(o.status) && stage < 2 ? `<button class="btn btn-sm btn-ghost" data-cancel="${o.id}" style="color:var(--danger)">Cancel order</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="empty"><div class="big">📦</div><h3>No orders yet</h3><p>When you place an order, it will show up here.</p><a class="btn btn-primary" href="#/shop">Start shopping</a></div>`;
  };
  const orders = await api('/orders');
  if (!isCurrent()) return;
  paintOrders(orders);
  $('#orders').addEventListener('click', async (e) => {
    const id = e.target.closest('[data-cancel]')?.dataset.cancel;
    if (!id || !confirm('Cancel this order?')) return;
    try {
      const updated = await api(`/orders/${id}/cancel`, { method: 'POST' });
      orders.splice(orders.findIndex((o) => o.id === id), 1, updated);
      paintOrders(orders);
      toast('Order cancelled. Refund will be processed in 3–5 days.');
    } catch (err) { toast(err.message, { type: 'error' }); }
  });
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
  setTitle('Help center');
  const faqs = [
    ['How long does delivery take?', 'Standard delivery takes 3–5 business days. Express delivery arrives within 1–2 business days in most cities.'],
    ['Is shipping free?', 'Yes! Standard shipping is free on all orders over ₹999. Below that, a flat ₹79 fee applies. Express delivery costs ₹149.'],
    ['What is your return policy?', 'You can return most items within 10 days of delivery for a full refund, as long as they are unused and in original packaging.'],
    ['Which payment methods do you accept?', 'We accept all major credit and debit cards (Visa, Mastercard, RuPay, Amex), UPI, and Cash on Delivery for orders up to ₹50,000.'],
    ['How do I track my order?', 'Sign in and go to My Account → Your orders to see live order status. You will also receive email updates.'],
    ['Can I cancel my order?', 'Yes — orders can be cancelled from your account any time before they are shipped. Refunds are processed within 3–5 business days.'],
  ];
  $('#app').innerHTML = `
  <div class="container page-head" style="max-width:820px"><div class="breadcrumbs"><a href="#/">Home</a> / <span>Help</span></div><h1>How can we help?</h1><p class="muted">Answers to the most common questions about orders, shipping and returns.</p></div>
  <div class="container faq" style="max-width:820px;padding-bottom:60px">
    ${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <div class="panel" style="margin-top:24px;text-align:center"><h3>Still need help?</h3><p class="muted">Our support team is available 24/7 at <b>support@lumen.store</b> or <b>1800-123-4567</b>.</p></div>
  </div>`;
}

function renderNotFound() {
  setTitle('Page not found');
  $('#app').innerHTML = `<div class="container empty"><div class="big">🧭</div><h1>Page not found</h1><p>The page you're looking for doesn't exist or has moved.</p><a class="btn btn-primary" href="#/">Back to home</a></div>`;
}

// ---------- Boot ----------
async function boot() {
  initHeader();
  updateBadges();
  renderDrawer();
  try { state.categories = await api('/categories'); } catch { state.categories = []; }
  window.addEventListener('hashchange', router);
  router();
}
boot();
