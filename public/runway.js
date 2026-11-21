// ==========================================================================
// Try the Look. — Runway (<runway-section> & Styling Bag)
// ==========================================================================
(function () {
  'use strict';

  const ASSET_BASE = 'https://reel-ref-try-the-look.vercel.app/assets/';

  // ---------- 6.3 Inlined Native Catalog JSON ----------
  const NATIVE_CATALOG = {
    source: 'https://nike-makknzjs.myshopify.com/pages/runway',
    looks: [
      {
        name: 'The City Edit',
        description: 'A charcoal knit and easy denim.',
        image: ASSET_BASE + 'model-1-640.webp',
        products: ['tatum-5-orbit-copy', 'tshirt', 'sweatshirt'],
      },
      {
        name: 'Gallery Opening',
        description: 'A clean white tee and relaxed denim.',
        image: ASSET_BASE + 'model-5-640.webp',
        products: ['tatum-5-orbit', 'hoodie-black', 'tshirt'],
      },
      {
        name: 'Gallery Opening',
        description: 'Olive knitwear. A grounded palette.',
        image: ASSET_BASE + 'model-4-640.webp',
        products: ['sweatshirt-plus', 'tatum-5-orbit', 'tshirt'],
      },
      {
        name: 'Studio Day',
        description: 'Black, white and laid-back denim.',
        image: ASSET_BASE + 'model-6-640.webp',
        products: ['hoodie-black', 'tatum-5-orbit-copy', 'tshirt'],
      },
      {
        name: 'Studio Day',
        description: 'Burgundy layers. A tailored perspective.',
        image: ASSET_BASE + 'model-3-640.webp',
        products: ['sweatshirt', 'tatum-5-orbit', 'tshirt'],
      },
      {
        name: 'Studio Day',
        description: 'A grey crew and your favourite denim.',
        image: ASSET_BASE + 'model-2-640.webp',
        products: ['hoodie', 'air-jordan-12-retro-copy', 'tshirt'],
      },
    ],
    items: [
      {
        id: 'tatum-5-orbit-copy',
        name: 'Air Jordan 12 Retro',
        type: 'From the original lookbook',
        price: 149,
        image: ASSET_BASE + 'source-tatum-5-orbit-copy.webp',
        sizes: ['40', '41', '42', '43', '44', '45', '46'],
        variants: [
          { id: 57015167025457, a: true, o: ['40'] },
          { id: 57015167058225, a: true, o: ['41'] },
          { id: 57015167090993, a: true, o: ['42'] },
          { id: 57015167123761, a: true, o: ['43'] },
          { id: 57015167156529, a: true, o: ['44'] },
          { id: 57015167189297, a: true, o: ['45'] },
          { id: 57015167222065, a: true, o: ['46'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy',
      },
      {
        id: 'tshirt',
        name: 'Tshirt',
        type: 'From the original lookbook',
        price: 199,
        image: ASSET_BASE + 'source-tshirt.webp',
        sizes: ['S', 'L', 'M', 'XL'],
        variants: [
          { id: 56835911582001, a: true, o: ['S'] },
          { id: 56835911614769, a: true, o: ['L'] },
          { id: 56835911647537, a: true, o: ['M'] },
          { id: 56835911680305, a: true, o: ['XL'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/tshirt',
      },
      {
        id: 'sweatshirt',
        name: 'Sweatshirt',
        type: 'From the original lookbook',
        price: 199,
        image: ASSET_BASE + 'source-sweatshirt.webp',
        sizes: ['S', 'L', 'M', 'XL'],
        variants: [
          { id: 56835806396721, a: true, o: ['S'] },
          { id: 56835806429489, a: true, o: ['L'] },
          { id: 56835806462257, a: true, o: ['M'] },
          { id: 56835806495025, a: true, o: ['XL'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt',
      },
      {
        id: 'tatum-5-orbit',
        name: 'Tatum 5 Orbit',
        type: 'From the original lookbook',
        price: 149,
        image: ASSET_BASE + 'source-tatum-5-orbit.webp',
        sizes: ['40', '41', '42', '43', '44', '45', '46'],
        variants: [
          { id: 57015166730545, a: true, o: ['40'] },
          { id: 57015166763313, a: true, o: ['41'] },
          { id: 57015166796081, a: true, o: ['42'] },
          { id: 57015166828849, a: true, o: ['43'] },
          { id: 57015166861617, a: true, o: ['44'] },
          { id: 57015166894385, a: true, o: ['45'] },
          { id: 57015166927153, a: true, o: ['46'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit',
      },
      {
        id: 'hoodie-black',
        name: 'Hoodie Black',
        type: 'From the original lookbook',
        price: 199,
        image: ASSET_BASE + 'source-hoodie-black.webp',
        sizes: ['S', 'L', 'M', 'XL'],
        variants: [
          { id: 56836251681073, a: true, o: ['S'] },
          { id: 56836251713841, a: true, o: ['L'] },
          { id: 56836251746609, a: true, o: ['M'] },
          { id: 56836251779377, a: true, o: ['XL'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black',
      },
      {
        id: 'sweatshirt-plus',
        name: 'Sweatshirt Plus',
        type: 'From the original lookbook',
        price: 199,
        image: ASSET_BASE + 'source-sweatshirt-plus.webp',
        sizes: ['S', 'L', 'M', 'XL'],
        variants: [
          { id: 56836143743281, a: true, o: ['S'] },
          { id: 56836143776049, a: true, o: ['L'] },
          { id: 56836143808817, a: true, o: ['M'] },
          { id: 56836143841585, a: true, o: ['XL'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus',
      },
      {
        id: 'hoodie',
        name: 'Hoodie',
        type: 'From the original lookbook',
        price: 199,
        image: ASSET_BASE + 'source-hoodie.webp',
        sizes: ['S', 'L', 'M', 'XL'],
        variants: [
          { id: 56836002185521, a: true, o: ['S'] },
          { id: 56836002218289, a: true, o: ['L'] },
          { id: 56836002251057, a: true, o: ['M'] },
          { id: 56836002283825, a: true, o: ['XL'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/hoodie',
      },
      {
        id: 'air-jordan-12-retro-copy',
        name: 'Luka 5',
        type: 'From the original lookbook',
        price: 149,
        image: ASSET_BASE + 'source-air-jordan-12-retro-copy.webp',
        sizes: ['40', '41', '42', '43', '44', '45', '46'],
        variants: [
          { id: 57015176364337, a: true, o: ['40'] },
          { id: 57015176397105, a: true, o: ['41'] },
          { id: 57015176429873, a: true, o: ['42'] },
          { id: 57015176462641, a: true, o: ['43'] },
          { id: 57015176495409, a: true, o: ['44'] },
          { id: 57015176528177, a: true, o: ['45'] },
          { id: 57015176560945, a: true, o: ['46'] },
        ],
        url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy',
      },
    ],
  };

  // ---------- 10.3 Styling Bag ----------
  const BAG_KEY = 'runway-styling-bag-v3';
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function validateCatalog(cat) {
    if (!cat || !Array.isArray(cat.items)) throw new Error('The product list is unavailable.');
    const variantMap = new Map();
    for (const item of cat.items) {
      if (typeof item.id !== 'string' || typeof item.name !== 'string' || !Number.isFinite(item.price) || item.price < 0 || !Array.isArray(item.variants)) {
        throw new Error('The product list is unavailable.');
      }
      for (const v of item.variants) {
        if (!Number.isSafeInteger(v.id) || typeof v.a !== 'boolean' || !Array.isArray(v.o)) {
          throw new Error('The product list is unavailable.');
        }
        variantMap.set(v.id, { item, variant: v });
      }
    }
    return variantMap;
  }

  const VARIANT_MAP = validateCatalog(NATIVE_CATALOG);

  function loadBag() {
    try {
      const raw = JSON.parse(localStorage.getItem(BAG_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((e) => e && Number.isSafeInteger(e.id) && Number.isSafeInteger(e.quantity) && e.quantity >= 1 && e.quantity <= 20 && VARIANT_MAP.has(e.id))
        .slice(0, 50);
    } catch {
      return [];
    }
  }

  function saveBag(entries) {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(entries.slice(0, 50)));
    } catch { /* ignore */ }
  }

  let bagEntries = loadBag();
  let toastTimer = null;

  function showBagToast(text) {
    const el = document.getElementById('bag-status');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2500);
  }

  function updateBagCounters() {
    const totalQty = bagEntries.reduce((s, e) => s + e.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(totalQty);
    });
  }

  function renderBagDialog() {
    updateBagCounters();
    const listEl = document.getElementById('bag-items');
    const totalEl = document.getElementById('bag-total');
    const exportBtn = document.getElementById('export-bag');
    if (!listEl || !totalEl || !exportBtn) return;

    if (!bagEntries.length) {
      listEl.innerHTML = '<p class="bag-note">Your styling bag is empty. Choose a size beside a piece to save it.</p>';
      totalEl.textContent = '';
      exportBtn.disabled = true;
      return;
    }

    let sum = 0;
    listEl.innerHTML = '';
    for (const entry of bagEntries) {
      const found = VARIANT_MAP.get(entry.id);
      if (!found) continue;
      const { item, variant } = found;
      const parsedUrl = new URL(item.url);
      if (parsedUrl.hostname !== 'nike-makknzjs.myshopify.com') {
        throw new Error('Invalid product URL host');
      }
      const linePrice = item.price * entry.quantity;
      sum += linePrice;
      const sizeStr = variant.o.join(' / ');

      const row = document.createElement('div');
      row.className = 'bag-row';
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}" width="60" height="80">
        <div>
          <h3>${item.name}</h3>
          <p>Size ${sizeStr} · Quantity ${entry.quantity} · ${usd.format(linePrice)}</p>
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">View original piece ↗</a>
        </div>
        <button type="button" class="bag-remove" data-remove-id="${entry.id}" aria-label="Remove ${item.name}">×</button>`;
      listEl.appendChild(row);
    }

    totalEl.textContent = `Reference subtotal ${usd.format(sum)}`;
    exportBtn.disabled = false;
  }

  const LUMEN_PID_MAP = {
    'tatum-5-orbit-copy': { id: 'p1027', title: 'Air Jordan 12 Retro', price: 4999, mrp: 6999, stock: 28 },
    'tatum-5-orbit': { id: 'p1028', title: 'Tatum 5 Orbit', price: 5499, mrp: 7499, stock: 32 },
    'air-jordan-12-retro-copy': { id: 'p1029', title: 'Luka 5', price: 4799, mrp: 6499, stock: 24 },
    'tshirt': { id: 'p1030', title: 'Reign Graphic Jersey Tshirt', price: 1799, mrp: 2499, stock: 65 },
    'sweatshirt': { id: 'p1031', title: 'Atelier Crewneck Sweatshirt', price: 2999, mrp: 4299, stock: 38 },
    'sweatshirt-plus': { id: 'p1032', title: 'Verdo Varsity Sweatshirt Plus', price: 3499, mrp: 4999, stock: 22 },
    'hoodie': { id: 'p1033', title: 'Studio Heather Graphic Hoodie', price: 3299, mrp: 4599, stock: 29 },
    'hoodie-black': { id: 'p1034', title: 'Nocturne Star Graphic Hoodie Black', price: 3499, mrp: 4999, stock: 35 },
  };

  const StylingBag = {
    add(items) {
      if (!Array.isArray(items) || !items.length) throw new Error('Please choose an available size.');
      for (const it of items) {
        const id = Number(it.id);
        const found = VARIANT_MAP.get(id);
        if (!found || !found.variant.a) throw new Error('Please choose an available size.');
      }
      for (const it of items) {
        const id = Number(it.id);
        const qty = Math.max(1, Math.min(20, Number(it.quantity) || 1));
        const existing = bagEntries.find((e) => e.id === id);
        if (existing) existing.quantity = Math.min(20, existing.quantity + qty);
        else if (bagEntries.length < 50) bagEntries.push({ id, quantity: qty });

        // If window.lumenAddFromRunway is registered (embedded inside Lumen storefront), sync into the live shopping cart
        const found = VARIANT_MAP.get(id);
        if (found && typeof window.lumenAddFromRunway === 'function') {
          const mapInfo = LUMEN_PID_MAP[found.item.id];
          if (mapInfo) {
            window.lumenAddFromRunway({
              ...mapInfo,
              image: found.item.image,
              size: found.variant.o[0] || null,
              qty,
            });
          }
        }
      }
      saveBag(bagEntries);
      renderBagDialog();
      showBagToast(items.length === 1 ? 'Piece saved to your styling bag' : 'Look saved to your styling bag');
      return Promise.resolve();
    },
  };

  function initBagUI() {
    updateBagCounters();
    const dlg = document.getElementById('bag-dialog');
    const openBtn = document.getElementById('open-bag');
    const closeBtn = document.getElementById('close-bag');
    const itemsEl = document.getElementById('bag-items');
    const exportBtn = document.getElementById('export-bag');
    if (!dlg) return;

    openBtn?.addEventListener('click', () => {
      renderBagDialog();
      dlg.showModal();
    });
    closeBtn?.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => {
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        dlg.close();
      }
    });
    itemsEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-id]');
      if (!btn) return;
      const id = Number(btn.dataset.removeId);
      bagEntries = bagEntries.filter((x) => x.id !== id);
      saveBag(bagEntries);
      renderBagDialog();
    });
    exportBtn?.addEventListener('click', () => {
      if (!bagEntries.length) return;
      const parts = [
        'RUNWAY — STYLING SHORTLIST',
        'Reference prices; no order or payment has been placed.',
        '',
      ];
      for (const entry of bagEntries) {
        const found = VARIANT_MAP.get(entry.id);
        if (!found) continue;
        const { item, variant } = found;
        parts.push(`${item.name} · Size ${variant.o.join(' / ')} · Quantity ${entry.quantity}\n${item.url}`);
      }
      const blob = new Blob([parts.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'runway-outfit-shortlist.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  // ---------- Helpers ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------- <runway-section> Custom Element ----------
  class RunwaySection extends HTMLElement {
    connectedCallback() {
      if (this._inited) return;
      this._inited = true;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.stage = this.querySelector('[data-rw-stage]');
      this.actorsEl = this.querySelector('[data-rw-actors]');
      this.heroesEl = this.querySelector('[data-rw-heroes]');
      this.liveEl = this.querySelector('[data-rw-live]');
      this.piecesLabelEl = this.querySelector('[data-rw-pieces]');
      this.cursorEl = this.querySelector('[data-rw-cursor]');
      this.lbEl = this.querySelector('[data-rw-lb]');
      this.lbStageEl = this.querySelector('[data-rw-lb-stage]');
      this.lbKickerEl = this.querySelector('[data-rw-lb-kicker]');
      this.lbNameEl = this.querySelector('[data-rw-lb-name]');
      this.lbCloseBtn = this.querySelector('[data-rw-zoom-close]');
      this.autoBtn = this.querySelector('[data-rw-auto]');

      this.heroes = [...this.querySelectorAll('[data-rw-hero]')];
      this.ticks = [...this.querySelectorAll('[data-rw-tick]')];
      this.panels = [...this.querySelectorAll('[data-rw-panel]')];
      const origModels = [...this.querySelectorAll('[data-rw-model]:not([data-rw-clone])')];

      this.n = origModels.length; // 6
      const mult = Math.ceil(8 / this.n); // 2
      this.N = this.n * mult; // 12

      // Clone bodies 0..5 into 6..11
      for (let m = 1; m < mult; m++) {
        for (let i = 0; i < this.n; i++) {
          const clone = origModels[i].cloneNode(true);
          clone.setAttribute('data-rw-clone', '');
          clone.dataset.index = String(i);
          clone.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
          this.actorsEl.appendChild(clone);
        }
      }
      this.modelEls = [...this.actorsEl.querySelectorAll('[data-rw-model]')];

      // Feel parameters (`balanced`: K = 95, C = 2*sqrt(95), lag = 0.04)
      this.K = 95;
      this.C = 2 * Math.sqrt(this.K);
      this.lag = 0.04;

      const initLook = clamp(Number(this.dataset.initialLook) || 0, 0, this.n - 1);
      this.index = initLook;
      this.target = initLook;
      const startOffset = this.reducedMotion ? 0 : 1.15;
      this.cur = initLook - startOffset;
      this.vel = 0;
      this.still = false;

      this.bodies = this.modelEls.map((el, a) => {
        const goal = mod(a - initLook, this.N);
        return {
          el,
          a,
          look: a % this.n,
          hit: el.querySelector('.rw__hit'),
          w: 240,
          x: goal + startOffset,
          g: goal + startOffset,
          v: 0,
          goal,
          from: goal,
          trip: false,
          lastBlur: -1,
        };
      });

      this.W = 800;
      this.H = 600;
      this.unit = 240;
      this.fs = 1.08;
      this.isMobile = window.innerWidth <= 749;
      this.mode = this.isMobile ? (this.dataset.mstyle || 'classic') : (this.dataset.style || 'ring');
      this.latchedVw = 0;
      this.latchedVh = 0;

      this.visible = true;
      this.playing = false;
      this.engaged = false;
      this.panelHover = false;
      this.zoomed = false;
      this.dragging = false;
      this.suppressClickUntil = 0;
      this.rafId = 0;
      this.lastFrameTime = 0;
      this.autoTimer = 0;
      this.lbClearTimer = 0;
      this.wheelAcc = 0;
      this.wheelLocked = false;
      this.activeSheetCard = null;
      this.sheetHost = null;

      // Setup intro reveal
      this.classList.add('rw--js');
      if (this.reducedMotion) {
        this.classList.add('is-revealed');
      }

      this._decodeAllModelImages();
      this._probeAllFeet();
      this._initPickers();
      this._initCursor();
      this._bindEvents();
      this.measure();
      this.setIndex(initLook, true);

      if (this.dataset.autoplay === 'true' && !this.reducedMotion) {
        this.play(true);
      }

      this.kick();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.rafId);
      cancelAnimationFrame(this.cursorRaf);
      clearTimeout(this.autoTimer);
      clearTimeout(this.lbClearTimer);
      clearTimeout(this.resizeTimer);
      this.visIo?.disconnect();
      this.revIo?.disconnect();
      this.ro?.disconnect();
      if (this._onWinResize) window.removeEventListener('resize', this._onWinResize);
      if (this._onVisChange) document.removeEventListener('visibilitychange', this._onVisChange);
      this._dockSheet();
      this.sheetHost?.remove();
    }

    // ---------- 2.2 Image Decode & 14. Feet Detection ----------
    _decodeAllModelImages() {
      this.querySelectorAll('img[data-model-image]').forEach((img) => {
        const mark = () => img.classList.add('is-decoded');
        if (img.complete && img.naturalWidth > 0) {
          mark();
          return;
        }
        if (typeof img.decode === 'function') {
          img.decode().then(mark).catch(() => {
            if (img.naturalWidth > 0) mark();
            else img.addEventListener('load', mark, { once: true });
          });
        } else {
          img.addEventListener('load', mark, { once: true });
        }
      });
    }

    _probeAllFeet() {
      this.heroes.forEach((hero, i) => {
        const url = hero.dataset.probe;
        if (!url) return;
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => {
          try {
            const cw = 48;
            const ch = Math.max(16, Math.round((im.naturalHeight / im.naturalWidth) * cw));
            const c = document.createElement('canvas');
            c.width = cw;
            c.height = ch;
            const ctx = c.getContext('2d');
            ctx.drawImage(im, 0, 0, cw, ch);
            const data = ctx.getImageData(0, 0, cw, ch).data;
            let lastRow = ch - 1;
            outer: for (let r = ch - 1; r >= 0; r--) {
              for (let x = 0; x < cw; x++) {
                if (data[(r * cw + x) * 4 + 3] > 40) {
                  lastRow = r;
                  break outer;
                }
              }
            }
            const foot = clamp((ch - 1 - lastRow) / ch, 0, 0.4);
            const val = foot.toFixed(4);
            hero.style.setProperty('--rw-foot', val);
            this.bodies.filter((b) => b.look === i).forEach((b) => b.el.style.setProperty('--rw-foot', val));
          } catch { /* tainted canvas keeps 0 */ }
        };
        im.src = url;
      });
    }

    // ---------- 8.1 Measure ----------
    measure() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const wasMobile = this.isMobile;
      this.isMobile = vw <= 749;
      this.mode = this.isMobile ? (this.dataset.mstyle || 'classic') : (this.dataset.style || 'ring');

      if (wasMobile && !this.isMobile) {
        this._dockSheet();
      }

      if (this.isMobile) {
        if (!this.latchedVh || vw !== this.latchedVw || Math.abs(vh - this.latchedVh) >= 160) {
          this.latchedVw = vw;
          this.latchedVh = vh;
        }
        const mvh = clamp(Number(this.dataset.mheightVh) || 109, 50, 120);
        const frameH = Math.round((this.latchedVh * mvh) / 100);
        this.style.setProperty('--rw-frame-h', frameH + 'px');
      } else {
        let headerH = 0;
        document.querySelectorAll('.shopify-section-group-header-group, #shopify-section-header, #shopify-section-announcement-bar, #header').forEach((el) => {
          if (!el.contains(this)) {
            const r = el.getBoundingClientRect();
            if (r.height > 0) headerH += r.height;
          }
        });
        const frameH = Math.max(380, Math.round(vh - headerH));
        this.style.setProperty('--rw-frame-h', frameH + 'px');
      }

      const rect = this.stage.getBoundingClientRect();
      this.W = Math.max(280, rect.width || vw);
      this.H = Math.max(260, rect.height || 560);

      if (this.mode === 'ring') {
        this.fs = 1.08;
        const modelH = Math.max(200, Math.round((this.H - 34 - 18) / 1.08));
        this.stage.style.setProperty('--rw-model-h', modelH + 'px');
        this.stage.style.setProperty('--rw-fs', '1.08');
        const hx = 0.5 * this.W;
        this.stage.style.setProperty('--rw-hx', hx + 'px');
        this.stage.style.setProperty('--rw-hy', '34px');
        this.style.setProperty('--rw-ax', '50%');
        this.unit = Math.max(this.isMobile ? 90 : 120, 0.3 * this.W);
      } else {
        this.fs = 1;
        const padBottom = this.isMobile ? 24 : 36;
        const modelH = Math.max(200, Math.round(this.H - padBottom - 18));
        this.stage.style.setProperty('--rw-model-h', modelH + 'px');
        this.stage.style.setProperty('--rw-fs', '1');
        const ax = this.isMobile ? 0.3 : 0.4;
        const ay = this.isMobile ? 22 : 36;
        const sx = this.isMobile ? 0.32 : 0.125;
        this.stage.style.setProperty('--rw-hx', (ax * this.W) + 'px');
        this.stage.style.setProperty('--rw-hy', ay + 'px');
        this.style.setProperty('--rw-ax', (ax * 100) + '%');
        this.unit = Math.max(90, this.W * sx * 1.6);
      }

      const sampleW = this.bodies[0]?.el.offsetWidth || Math.round(parseFloat(this.stage.style.getPropertyValue('--rw-model-h') || 500) * 0.5625);
      this.bodies.forEach((b) => { b.w = sampleW; });

      this.renderAll();
      this.kick();
    }

    // ---------- 7.3 Placement Primitive ----------
    put(s, x, bottom, scale, opacity, blur, z) {
      let op = opacity;
      const half = (s.w * scale) / 2;
      if (x + half < -4 || x - half > this.W + 4) {
        op = 0;
      }
      const el = s.el;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(z);
      el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
      el.style.pointerEvents = op < 0.5 ? 'none' : 'auto';

      const b = Math.round(blur * 10) / 10;
      if (b !== s.lastBlur) {
        s.lastBlur = b;
        if (b <= 0.05 || this.dataset.blur === 'false') {
          el.style.removeProperty('filter');
        } else {
          el.style.filter = `blur(${b}px)`;
        }
      }
    }

    setStill(val) {
      if (this.still === val) return;
      this.still = val;
      this.classList.toggle('rw--still', val);
    }

    // ---------- 7.4 & 7.5 Render All ----------
    renderAll() {
      const W = this.W;
      const H = this.H;

      if (this.mode === 'ring') {
        const cx = 0.5 * W;
        const R = (this.isMobile ? 0.72 : 0.62) * W;
        const P = (this.isMobile ? 1.9 : 1.65) * W;
        const floor = H - 34;
        const horizon = 0.36 * H;
        const step = (2 * Math.PI) / this.N;

        for (const s of this.bodies) {
          let phi = ((s.a - this.cur) * step) % (2 * Math.PI);
          if (phi <= -Math.PI) phi += 2 * Math.PI;
          else if (phi > Math.PI) phi -= 2 * Math.PI;

          const z = R * (1 - Math.cos(phi));
          const persp = P / (P + z);
          const sl = Math.abs(phi) / step;
          const scale = persp * (1 + (this.fs - 1) * clamp(1 - sl, 0, 1));
          const x = cx + R * Math.sin(phi) * persp;
          const feet = horizon + (floor - horizon) * persp;
          const bottom = H - feet;
          const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
          let opacity = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
          if (this.still && sl < 0.02) {
            opacity = 0;
          }
          const zIdx = Math.round(scale * 1000);
          this.put(s, x, bottom, scale, opacity, blur, zIdx);
        }
      } else {
        // Classic diagonal line mode
        const ax = this.isMobile ? 0.3 : 0.4;
        const ay = this.isMobile ? 22 : 36;
        const sx = this.isMobile ? 0.32 : 0.125;
        const sy = this.isMobile ? 22 : 58;
        const sr = 0.76;
        const ex = this.isMobile ? 0.55 : 0.38;
        const d = this.isMobile ? 4 : 5;

        for (const s of this.bodies) {
          let k = s.x;
          let e = -1;

          if (s.trip) {
            const denom = Math.max(0.001, Math.abs(s.goal - s.from));
            const u = clamp(Math.abs(s.x - s.from) / denom, 0, 1);
            if (s.goal > s.from) {
              if (u < 0.5) e = 2 * u * 1.4;
              else k = s.goal + 2 * (1 - u);
            } else {
              if (u < 0.5) k = s.from + 2 * u;
              else e = 2 * (1 - u) * 1.4;
            }
          } else if (k < 0) {
            e = Math.min(-k, 1.4);
          }

          if (e >= 0) {
            const x = W * (ax - ex * e);
            const bottom = ay - 22 * e;
            const scale = 1 + 0.14 * e;
            const opacity = Math.max(0, 1 - 1.05 * e);
            const blur = 4 * Math.min(e, 1);
            this.put(s, x, bottom, scale, opacity, blur, 1100);
          } else {
            const x = W * (ax + sx * k);
            const bottom = ay + sy * k;
            const scale = Math.pow(sr, k);
            let opacity = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
            if (this.still && Math.abs(k) < 0.02) {
              opacity = 0;
            }
            const blur = Math.min(0.9 * Math.max(0, k), 3.2);
            const zIdx = 1000 - Math.round(10 * k);
            this.put(s, x, bottom, scale, opacity, blur, zIdx);
          }
        }
      }
    }

    // ---------- 7.8 Animation Loop ----------
    kick() {
      if (this.rafId || !this.visible || document.hidden) return;
      this.lastFrameTime = 0;
      this.rafId = requestAnimationFrame((t) => this._tick(t));
    }

    _tick(now) {
      this.rafId = 0;
      if (!this.visible || document.hidden) return;

      const dt = this.lastFrameTime ? Math.min(0.034, (now - this.lastFrameTime) / 1000) : 1 / 60;
      this.lastFrameTime = now;

      if (this.reducedMotion) {
        this.cur = this.target;
        this.vel = 0;
        for (const s of this.bodies) {
          s.goal = mod(s.a - this.target, this.N);
          s.x = s.goal;
          s.g = s.goal;
          s.v = 0;
          s.trip = false;
        }
        this.setStill(!this.dragging);
        this.renderAll();
        return;
      }

      let settled = true;

      if (this.mode === 'ring') {
        const h = dt / 3;
        for (let step = 0; step < 3; step++) {
          const acc = -this.K * (this.cur - this.target) - this.C * this.vel;
          this.vel += acc * h;
          this.cur += this.vel * h;
        }
        if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005 && !this.dragging) {
          this.cur = this.target;
          this.vel = 0;
        } else {
          settled = false;
        }
      } else {
        const h = dt / 3;
        for (const s of this.bodies) {
          const newGoal = mod(s.a - this.target, this.N);
          if (Math.abs(newGoal - s.goal) > this.N / 2) {
            s.from = s.x;
            s.trip = true;
          }
          s.goal = newGoal;
          const tau = this.dragging ? 0.016 : s.trip ? 0.1 : 0.03 + this.lag * Math.min(s.goal, 4);
          s.g += (s.goal - s.g) * (1 - Math.exp(-dt / tau));
          for (let step = 0; step < 3; step++) {
            const acc = -this.K * (s.x - s.g) - this.C * s.v;
            s.v += acc * h;
            s.x += s.v * h;
          }
          if (s.trip && Math.abs(s.x - s.goal) < 0.02) {
            s.trip = false;
          }
          if (Math.abs(s.x - s.goal) <= 0.0006 && Math.abs(s.v) <= 0.0006 && !this.dragging) {
            s.x = s.goal;
            s.g = s.goal;
            s.v = 0;
            s.trip = false;
          } else {
            settled = false;
          }
        }
        this.cur = this.target;
      }

      if (settled && !this.dragging) {
        this.setStill(true);
        this.renderAll();
      } else {
        this.setStill(false);
        this.renderAll();
        this.rafId = requestAnimationFrame((t) => this._tick(t));
      }
    }

    // ---------- 8.3 & 8.4 Navigation & Index Change ----------
    _bodyRank(s) {
      const t = Math.round(this.target);
      let k = mod(s.a - t, this.N);
      if (this.mode === 'ring' && k > this.N / 2) k -= this.N;
      return k;
    }

    _updateBodyA11y() {
      const maxRank = this.mode === 'ring' ? 2 : 3;
      for (const s of this.bodies) {
        const k = this._bodyRank(s);
        const reachable = k !== 0 && (this.mode === 'ring' ? Math.abs(k) <= maxRank : k > 0 && k <= maxRank);
        if (reachable) {
          s.el.removeAttribute('aria-hidden');
          if (s.hit) {
            s.hit.tabIndex = 0;
            s.hit.removeAttribute('aria-hidden');
          }
        } else {
          s.el.setAttribute('aria-hidden', 'true');
          if (s.hit) s.hit.tabIndex = -1;
        }
      }
    }

    setIndex(i, silent = false) {
      const nextIdx = mod(i, this.n);
      const prevIdx = this.index;
      this.index = nextIdx;
      this._updateBodyA11y();
      this.kick();

      const progress = ((nextIdx + 1) / this.n).toFixed(3);
      this.style.setProperty('--rw-progress', progress);

      if (!silent) {
        if (this.zoomed) this.closePopup();
        if (this.isMobile && this.activeSheetCard) this._closePicker(this.activeSheetCard);
      }

      // Heroes
      this.heroes.forEach((h, idx) => {
        const isOn = idx === nextIdx;
        const wasOn = !silent && idx === prevIdx && prevIdx !== nextIdx;
        h.classList.toggle('is-on', isOn);
        h.classList.toggle('was', wasOn);
        if (isOn) h.removeAttribute('aria-hidden');
        else h.setAttribute('aria-hidden', 'true');
        const zoomBtn = h.querySelector('[data-rw-zoom]');
        if (zoomBtn) zoomBtn.tabIndex = isOn ? 0 : -1;
      });

      // Ticks
      this.ticks.forEach((t, idx) => {
        t.setAttribute('aria-current', idx === nextIdx ? 'true' : 'false');
        t.classList.toggle('is-past', idx < nextIdx);
      });

      // Panels
      this.panels.forEach((p, idx) => {
        const active = idx === nextIdx;
        p.hidden = !active;
        if (!silent) p.classList.remove('is-in');
      });
      const activePanel = this.panels[nextIdx];
      if (activePanel && !silent) {
        void activePanel.offsetWidth;
        activePanel.classList.add('is-in');
      }

      // Pieces label
      const tpl = activePanel?.querySelector('[data-rw-pieces-text]');
      if (this.piecesLabelEl && tpl) {
        this.piecesLabelEl.textContent = tpl.innerHTML.trim();
        if (!silent) {
          this.piecesLabelEl.classList.remove('is-swap');
          void this.piecesLabelEl.offsetWidth;
          this.piecesLabelEl.classList.add('is-swap');
        }
      }

      if (!silent) {
        // Light sweep
        if (!this.reducedMotion) {
          this.stage.classList.remove('is-sweep');
          void this.stage.offsetWidth;
          this.stage.classList.add('is-sweep');
        }
        // Live region
        const activeHero = this.heroes[nextIdx];
        if (this.liveEl && activeHero) {
          this.liveEl.textContent = activeHero.dataset.label || '';
        }
      }

      this.hot(0);
      this._restartAutoBar();
    }

    moveTo(T) {
      this.target = T;
      this.setStill(false);
      this.setIndex(mod(Math.round(T), this.n));
    }

    next() {
      this.moveTo(Math.round(this.target) + 1);
    }

    prev() {
      this.moveTo(Math.round(this.target) - 1);
    }

    go(i) {
      let d = mod(i - this.index, this.n);
      if (d > this.n / 2) d -= this.n;
      this.moveTo(Math.round(this.target) + d);
    }

    // ---------- 8.5 Autoplay ----------
    play(on) {
      this.playing = !!on;
      this.classList.toggle('is-playing', this.playing);
      if (this.autoBtn) {
        this.autoBtn.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
      }
      this._restartAutoBar();
    }

    engage() {
      this.engaged = true;
      if (this.playing) this.play(false);
    }

    _restartAutoBar() {
      clearTimeout(this.autoTimer);
      this.ticks.forEach((t) => t.classList.remove('is-run'));
      if (!this.playing) return;
      const curTick = this.ticks[this.index];
      if (curTick) {
        void curTick.offsetWidth;
        curTick.classList.add('is-run');
      }
      const speed = Number(this.dataset.speed) || 5000;
      this.autoTimer = setTimeout(() => {
        if (this.playing && this.visible && !this.dragging && !document.hidden && !this.panelHover && !this.zoomed && !this.engaged) {
          this.next();
        } else {
          this._restartAutoBar();
        }
      }, speed);
    }

    // ---------- 9.4 Hot Linking ----------
    hot(n, scroll = false) {
      this.querySelectorAll('.rw__pin.is-hot, .rw__item.is-hot').forEach((el) => el.classList.remove('is-hot'));
      if (!n) return;
      const pinScope = this.zoomed ? this.lbStageEl : this.heroes[this.index];
      const pin = pinScope?.querySelector(`[data-rw-pin="${n}"]`);
      const panel = this.panels[this.index];
      const card = panel?.querySelector(`[data-rw-card="${n}"]`);
      pin?.classList.add('is-hot');
      card?.classList.add('is-hot');

      if (scroll && card) {
        this._revealCard(card);
      }
    }

    _revealCard(card) {
      const list = card.closest('.rw__items');
      if (!list) return;
      const behavior = this.reducedMotion ? 'auto' : 'smooth';
      if (list.scrollWidth > list.clientWidth + 4) {
        const cRect = card.getBoundingClientRect();
        const lRect = list.getBoundingClientRect();
        list.scrollBy({ left: cRect.left - lRect.left - 20, behavior });
      } else if (list.scrollHeight > list.clientHeight + 4) {
        list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
      } else {
        const r = card.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight - 140) {
          window.scrollBy({ top: r.top - 0.3 * window.innerHeight, behavior });
        }
      }
    }

    // ---------- 11.1 "View look" Popup ----------
    openPopup() {
      if (this.zoomed) return;
      this.engage();
      this.hot(0);
      const hero = this.heroes[this.index];
      if (!hero || !this.lbEl || !this.lbStageEl) return;

      clearTimeout(this.lbClearTimer);
      this.lbStageEl.innerHTML = '';

      const heroFigure = hero.querySelector('.rw__figure');
      const heroShadow = hero.querySelector('.rw__shadow');
      const aRect = heroFigure.getBoundingClientRect();

      const wrap = document.createElement('div');
      wrap.className = 'rw__lb-model';
      const foot = hero.style.getPropertyValue('--rw-foot');
      if (foot) wrap.style.setProperty('--rw-foot', foot);

      if (heroShadow) wrap.appendChild(heroShadow.cloneNode(true));
      const figClone = heroFigure.cloneNode(true);
      figClone.querySelector('[data-rw-zoom]')?.remove();
      figClone.querySelectorAll('.rw__pin').forEach((p) => { p.tabIndex = 0; });
      this.lbStageEl.appendChild(wrap);
      wrap.appendChild(figClone);

      const stRect = this.lbStageEl.getBoundingClientRect();
      const h = Math.max(160, Math.min(stRect.height, stRect.width / 0.5625));
      wrap.style.setProperty('--rw-model-h', Math.round(h) + 'px');

      figClone.querySelectorAll('img[data-model-image]').forEach((img) => {
        img.setAttribute('loading', 'eager');
        img.setAttribute('sizes', Math.round(h * 0.5625) + 'px');
        img.classList.add('is-decoded');
      });

      const word = this.lbEl.dataset.word || 'Look';
      if (this.lbKickerEl) this.lbKickerEl.textContent = `${word} ${String(this.index + 1).padStart(2, '0')}`;
      if (this.lbNameEl) this.lbNameEl.textContent = hero.dataset.name || '';

      this.zoomed = true;
      this.classList.add('rw--zoom');
      this.lbEl.setAttribute('aria-hidden', 'false');

      if (!this.reducedMotion && aRect.height > 0) {
        const bRect = figClone.getBoundingClientRect();
        if (bRect.height > 0) {
          const dx = aRect.left - bRect.left;
          const dy = aRect.bottom - bRect.bottom;
          const sc = aRect.height / bRect.height;
          wrap.style.transformOrigin = '0 100%';
          wrap.style.transition = 'none';
          wrap.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
          void wrap.offsetWidth;
          wrap.style.transition = '';
          wrap.style.transform = '';
        }
      }

      this.lbCloseBtn?.focus({ preventScroll: true });
    }

    closePopup() {
      if (!this.zoomed) return;
      this.zoomed = false;
      this.hot(0);

      const wrap = this.lbStageEl?.querySelector('.rw__lb-model');
      const figClone = wrap?.querySelector('.rw__figure');
      const heroFigure = this.heroes[this.index]?.querySelector('.rw__figure');

      if (!this.reducedMotion && wrap && figClone && heroFigure) {
        const aRect = heroFigure.getBoundingClientRect();
        const bRect = figClone.getBoundingClientRect();
        if (aRect.height > 0 && bRect.height > 0) {
          const dx = aRect.left - bRect.left;
          const dy = aRect.bottom - bRect.bottom;
          const sc = aRect.height / bRect.height;
          wrap.style.transformOrigin = '0 100%';
          wrap.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        }
      }

      const hadFocus = this.lbEl?.contains(document.activeElement);
      this.classList.remove('rw--zoom');
      this.lbEl?.setAttribute('aria-hidden', 'true');

      clearTimeout(this.lbClearTimer);
      this.lbClearTimer = setTimeout(() => {
        if (!this.zoomed && this.lbStageEl) this.lbStageEl.innerHTML = '';
      }, 950);

      if (hadFocus) {
        this.stage?.focus({ preventScroll: true });
      }
    }

    // ---------- 10.1, 10.2 & 12.3 Pickers & Mobile Size Sheet ----------
    _initPickers() {
      this.querySelectorAll('.rw__item').forEach((card) => {
        const script = card.querySelector('[data-rw-variants]');
        if (!script) return;
        try {
          card._variants = JSON.parse(script.textContent || '[]');
        } catch {
          card._variants = [];
        }
        this._syncCardOptions(card, true);
      });
    }

    _pickerForCard(card) {
      if (card._picker) return card._picker;
      card._picker = card.querySelector('[data-rw-picker]');
      return card._picker;
    }

    _syncCardOptions(card, isInitial = false) {
      const picker = this._pickerForCard(card);
      if (!picker) return;
      const variants = card._variants || [];
      const radios = [...picker.querySelectorAll('input[type="radio"][data-rw-option]')];
      const checked = radios.find((r) => r.checked) || radios[0];
      const selectedVal = checked ? checked.value : null;

      radios.forEach((r) => {
        const pill = r.closest('.rw__pill');
        const avail = variants.some((v) => v.a && v.o[0] === r.value);
        pill?.classList.toggle('is-unavailable', !avail);
      });

      const match = variants.find((v) => v.a && v.o[0] === selectedVal);
      const confirmBtn = picker.querySelector('[data-rw-confirm]');
      const confirmLbl = picker.querySelector('[data-rw-confirm-label]');

      if (match) {
        card.dataset.selected = String(match.id);
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmLbl) confirmLbl.textContent = confirmLbl.dataset.add || 'Add to bag';
      } else {
        delete card.dataset.selected;
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmLbl) confirmLbl.textContent = this.dataset.msgSoldout || 'Sold out';
      }

      if (!isInitial) {
        card.dataset.touched = '1';
      }
    }

    _ensureSheetHost() {
      if (this.sheetHost) return this.sheetHost;
      const host = document.createElement('div');
      host.className = 'rw-sheet-host';
      host.innerHTML = '<button type="button" class="rw__pick-scrim" data-rw-pick-close tabindex="-1" aria-hidden="true"></button>';
      document.body.appendChild(host);

      const cs = getComputedStyle(this);
      const tokens = [
        '--rw-panel', '--rw-text', '--rw-muted', '--rw-line', '--rw-accent', '--rw-on-accent',
        '--rw-btn-bg', '--rw-btn-fg', '--rw-btn-radius', '--rw-pill-radius', '--rw-bar-r',
        '--rw-thumb-radius', '--rw-pt-size', '--rw-price', '--rw-opt', '--rw-ease',
        '--rw-ease-sheet', '--rw-ease-spring',
      ];
      tokens.forEach((t) => host.style.setProperty(t, cs.getPropertyValue(t)));
      host.style.fontFamily = cs.fontFamily;
      host.style.color = cs.color;

      host.addEventListener('click', (e) => this._handleSectionClick(e));
      host.addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"][data-rw-option]')) {
          this.engage();
          if (this.activeSheetCard) this._syncCardOptions(this.activeSheetCard, false);
        }
      });
      host.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeSheetCard) {
          e.stopPropagation();
          const btn = this.activeSheetCard.querySelector('[data-rw-add]');
          this._closePicker(this.activeSheetCard);
          btn?.focus({ preventScroll: true });
        }
      });

      this.sheetHost = host;
      return host;
    }

    _openPicker(card) {
      if (card.classList.contains('is-added')) return;
      const picker = this._pickerForCard(card);
      const addBtn = card.querySelector('[data-rw-add]');
      if (!picker) return;

      if (this.isMobile) {
        if (this.activeSheetCard && this.activeSheetCard !== card) {
          this._closePicker(this.activeSheetCard);
        }
        const host = this._ensureSheetHost();
        picker._ownerCard = card;
        host.appendChild(picker);
        picker.hidden = false;
        host.classList.add('is-open');
        this.classList.add('rw--picking');
        this.activeSheetCard = card;
      } else {
        picker.hidden = false;
        this._revealCard(card);
      }

      card.classList.add('is-picking');
      addBtn?.setAttribute('aria-expanded', 'true');
      const checked = picker.querySelector('input[type="radio"]:checked') || picker.querySelector('input[type="radio"]');
      checked?.focus({ preventScroll: true });
    }

    _closePicker(card) {
      if (!card) return;
      const picker = this._pickerForCard(card);
      const addBtn = card.querySelector('[data-rw-add]');
      if (picker) {
        picker.hidden = true;
        if (picker.parentElement !== card) {
          card.appendChild(picker);
        }
      }
      card.classList.remove('is-picking');
      addBtn?.setAttribute('aria-expanded', 'false');
      if (this.activeSheetCard === card) {
        this.activeSheetCard = null;
        this.sheetHost?.classList.remove('is-open');
        this.classList.remove('rw--picking');
      }
    }

    _dockSheet() {
      if (this.activeSheetCard) {
        this._closePicker(this.activeSheetCard);
      }
    }

    _togglePicker(card) {
      if (card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
      if (card.classList.contains('is-picking')) {
        this._closePicker(card);
      } else {
        this._openPicker(card);
      }
    }

    async _confirmCard(card) {
      if (!card || card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
      card.dataset.touched = '1';
      this._syncCardOptions(card, false);
      const variantId = Number(card.dataset.selected);
      const panel = this.panels[this.index];
      const msgEl = panel?.querySelector('[data-rw-msg]');
      if (msgEl) msgEl.textContent = '';

      if (!variantId) {
        if (msgEl) msgEl.textContent = this.dataset.msgError || 'Couldn’t add to bag. Please try again.';
        return;
      }

      this._closePicker(card);
      card.classList.add('is-loading');

      try {
        await StylingBag.add([{ id: variantId, quantity: 1 }]);
        card.classList.remove('is-loading');
        this._markCardAdded(card);
        this._checkPanelComplete(panel);
      } catch {
        card.classList.remove('is-loading');
        if (msgEl) msgEl.textContent = this.dataset.msgError || 'Couldn’t add to bag. Please try again.';
      }
    }

    _markCardAdded(card) {
      card.classList.add('is-added');
      this._closePicker(card);
      const addBtn = card.querySelector('[data-rw-add]');
      if (addBtn) {
        addBtn.setAttribute('aria-label', addBtn.dataset.addedLabel || 'Added to bag');
        addBtn.removeAttribute('aria-expanded');
      }
      if (this.isMobile && !this.reducedMotion && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(12); } catch { /* ignore */ }
      }
    }

    _checkPanelComplete(panel) {
      if (!panel) return;
      const cards = [...panel.querySelectorAll('.rw__item')];
      if (cards.length >= 2 && cards.every((c) => c.classList.contains('is-added'))) {
        panel.classList.add('is-complete');
        const msgEl = panel.querySelector('[data-rw-msg]');
        if (msgEl) msgEl.textContent = '';
      }
    }

    async _addFullLook() {
      const panel = this.panels[this.index];
      if (!panel || panel.classList.contains('is-complete')) return;
      const cta = panel.querySelector('[data-rw-all]');
      const msgEl = panel.querySelector('[data-rw-msg]');
      if (!cta || cta.classList.contains('is-loading')) return;
      if (msgEl) msgEl.textContent = '';

      const remaining = [...panel.querySelectorAll('.rw__item')].filter((c) => !c.classList.contains('is-added'));
      const ready = [];
      const pending = [];

      for (const c of remaining) {
        if (c.dataset.touched === '1' && c.dataset.selected) {
          ready.push(c);
        } else {
          pending.push(c);
        }
      }

      if (ready.length) {
        cta.classList.add('is-loading');
        ready.forEach((c) => c.classList.add('is-loading'));
        try {
          await StylingBag.add(ready.map((c) => ({ id: Number(c.dataset.selected), quantity: 1 })));
          ready.forEach((c) => {
            c.classList.remove('is-loading');
            this._markCardAdded(c);
          });
        } catch {
          ready.forEach((c) => c.classList.remove('is-loading'));
          cta.classList.remove('is-loading');
          if (msgEl) msgEl.textContent = this.dataset.msgError || 'Couldn’t add to bag. Please try again.';
          return;
        }
        cta.classList.remove('is-loading');
      }

      if (pending.length) {
        if (this.isMobile) {
          this._openPicker(pending[0]);
        } else {
          pending.forEach((c) => this._openPicker(c));
        }
        this._revealCard(pending[0]);
        const titles = pending.map((c) => c.dataset.title || '').filter(Boolean).join(', ');
        const tpl = this.dataset.msgChoose || 'Pick a size for: [items]';
        if (msgEl) msgEl.textContent = tpl.replace('[items]', titles);
      } else {
        this._checkPanelComplete(panel);
      }
    }

    // ---------- 9.3 Custom Cursor ----------
    _initCursor() {
      const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!fineHover) {
        this.cursorEl?.remove();
        this.cursorEl = null;
        return;
      }
      if (!this.cursorEl) return;
      this.classList.add('rw--cursor');

      let cx = 0, cy = 0, tx = 0, ty = 0, entered = false;
      const stepCursor = () => {
        this.cursorRaf = 0;
        const factor = this.reducedMotion ? 1 : 0.18;
        cx += (tx - cx) * factor;
        cy += (ty - cy) * factor;
        this.cursorEl.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
        if (Math.hypot(tx - cx, ty - cy) >= 0.2) {
          this.cursorRaf = requestAnimationFrame(stepCursor);
        }
      };

      this.stage.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = this.stage.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top;
        if (!entered) {
          entered = true;
          cx = tx;
          cy = ty;
          this.cursorEl.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
          this.cursorEl.classList.add('is-on');
        } else if (!this.cursorRaf) {
          this.cursorRaf = requestAnimationFrame(stepCursor);
        }

        if (this.dragging) {
          this.cursorEl.classList.remove('is-view', 'is-link');
          return;
        }
        const onZoom = e.target.closest('.rw__hero.is-on [data-rw-zoom]');
        const onLink = e.target.closest('.rw__pin, .rw__hit');
        this.cursorEl.classList.toggle('is-view', !!onZoom && !onLink);
        this.cursorEl.classList.toggle('is-link', !!onLink);
      });

      this.stage.addEventListener('pointerleave', () => {
        entered = false;
        this.cursorEl.classList.remove('is-on', 'is-view', 'is-link');
      });
    }

    // ---------- 9.1, 9.2 Event Binding ----------
    _bindEvents() {
      // IntersectionObserver for visibility & render loop
      this.visIo = new IntersectionObserver((entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        if (this.visible) this.kick();
      }, { threshold: 0 });
      this.visIo.observe(this);

      // IntersectionObserver for intro reveal
      if (!this.reducedMotion) {
        this.revIo = new IntersectionObserver((entries) => {
          if (entries[0]?.isIntersecting) {
            this.revIo.disconnect();
            requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-revealed')));
          }
        }, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
        this.revIo.observe(this);
      }

      // Resize
      this._onWinResize = () => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => this.measure(), 120);
      };
      window.addEventListener('resize', this._onWinResize);

      if ('ResizeObserver' in window) {
        this.ro = new ResizeObserver(() => this.measure());
        this.ro.observe(this.stage);
      }

      this._onVisChange = () => {
        if (!document.hidden) this.kick();
      };
      document.addEventListener('visibilitychange', this._onVisChange);

      // Pointer drag / swipe on stage
      let pId = null, startX = 0, startY = 0, startTarget = 0, abandoned = false, samples = [];

      const endDrag = (e) => {
        if (pId === null || (e && e.pointerId !== undefined && e.pointerId !== pId)) return;
        const wasDragging = this.dragging;
        const dx = (e ? e.clientX : samples[samples.length - 1]?.x || startX) - startX;
        pId = null;
        this.dragging = false;
        this.classList.remove('is-dragging');

        if (!wasDragging) return;
        this.suppressClickUntil = performance.now() + 60;

        let vx = 0;
        if (samples.length >= 2) {
          const first = samples[0];
          const last = samples[samples.length - 1];
          const dt = last.time - first.time;
          if (dt > 0) vx = (last.x - first.x) / dt;
        }
        const sign = -1;
        const from = Math.round(startTarget);

        if (this.isMobile) {
          if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
            this.moveTo(from + sign * (dx > 0 ? 1 : -1));
          } else {
            this.moveTo(from);
          }
        } else {
          let i = Math.round(this.target + (sign * vx * 160) / this.unit);
          if (i === from && Math.abs(vx) > 0.3) {
            i = from + sign * (vx > 0 ? 1 : -1);
          }
          i = clamp(i, from - 2, from + 2);
          this.moveTo(i);
        }
      };

      this.stage.addEventListener('pointerdown', (e) => {
        if (this.zoomed) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        startTarget = this.target;
        abandoned = false;
        this.dragging = false;
        samples = [{ x: e.clientX, time: performance.now() }];
      });

      this.stage.addEventListener('pointermove', (e) => {
        if (pId === null || e.pointerId !== pId || abandoned) return;
        if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) {
          endDrag(e);
          return;
        }
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!this.dragging) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
            abandoned = true;
            pId = null;
            return;
          }
          if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
            this.dragging = true;
            this.classList.add('is-dragging');
            try { this.stage.setPointerCapture(pId); } catch { /* ignore */ }
          } else {
            return;
          }
        }

        const now = performance.now();
        samples.push({ x: e.clientX, time: now });
        if (samples.length > 6) samples.shift();

        this.target = startTarget - dx / this.unit;
        this.setStill(false);
        this.kick();
      });

      this.stage.addEventListener('pointerup', endDrag);
      this.stage.addEventListener('pointercancel', endDrag);

      // Suppress click after drag
      this.addEventListener('click', (e) => {
        if (performance.now() < this.suppressClickUntil) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);

      // Trackpad horizontal wheel
      this.stage.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        if (this.wheelLocked) return;
        this.wheelAcc += e.deltaX;
        if (Math.abs(this.wheelAcc) > 45) {
          if (this.wheelAcc > 0) this.next();
          else this.prev();
          this.wheelAcc = 0;
          this.wheelLocked = true;
          setTimeout(() => { this.wheelLocked = false; }, 520);
        }
      }, { passive: false });

      // Keyboard
      this.stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        }
      });

      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.activeSheetCard) {
            const btn = this.activeSheetCard.querySelector('[data-rw-add]');
            this._closePicker(this.activeSheetCard);
            btn?.focus({ preventScroll: true });
          } else if (this.zoomed) {
            this.closePopup();
          }
        }
      });

      // Panel hover & hot linking
      const panelEl = this.querySelector('.rw__panel');
      panelEl?.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') this.panelHover = true;
      });
      panelEl?.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') {
          this.panelHover = false;
          this._restartAutoBar();
        }
      });
      panelEl?.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]');
        if (card) this.hot(Number(card.dataset.rwCard), false);
      });
      panelEl?.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]');
        if (card && !card.contains(e.relatedTarget)) {
          this.hot(0);
        }
      });

      // Option change inside panel
      this.addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"][data-rw-option]')) {
          this.engage();
          const card = e.target.closest('.rw__item');
          if (card) this._syncCardOptions(card, false);
        }
      });

      // Delegated clicks (priority 1..13)
      this.addEventListener('click', (e) => this._handleSectionClick(e));
    }

    _handleSectionClick(e) {
      const t = e.target;

      // Engage check on panel interactive click
      if (t.closest('.rw__panel') && t.closest('button, a, input, select, label')) {
        this.engage();
      }

      // 1. pick-close
      const pickClose = t.closest('[data-rw-pick-close]');
      if (pickClose) {
        const card = this.activeSheetCard || pickClose.closest('.rw__item');
        if (card) this._closePicker(card);
        return;
      }

      // 2. popup close button
      if (t.closest('[data-rw-zoom-close]')) {
        this.closePopup();
        return;
      }

      // 3. click on popup backdrop or stage beside the model
      if (this.zoomed && (t === this.lbEl || t === this.lbStageEl)) {
        this.closePopup();
        return;
      }

      // 4. [data-rw-zoom] opens popup
      if (t.closest('[data-rw-zoom]')) {
        this.openPopup();
        return;
      }

      // 5. next
      if (t.closest('[data-rw-next]')) {
        this.next();
        return;
      }

      // 6. prev
      if (t.closest('[data-rw-prev]')) {
        this.prev();
        return;
      }

      // 7. tick
      const tick = t.closest('[data-rw-tick]');
      if (tick) {
        this.go(Number(tick.dataset.rwTick));
        return;
      }

      // 8. autoplay toggle
      if (t.closest('[data-rw-auto]')) {
        if (!this.playing) this.engaged = false;
        this.play(!this.playing);
        return;
      }

      // 9. pin
      const pin = t.closest('[data-rw-pin]');
      if (pin) {
        this.engage();
        this.hot(Number(pin.dataset.rwPin), true);
        return;
      }

      // 10. queue body [data-rw-go]
      const hit = t.closest('[data-rw-go]');
      if (hit) {
        const bodyEl = hit.closest('[data-rw-model]');
        const bodyObj = this.bodies.find((b) => b.el === bodyEl);
        if (bodyObj) {
          const k = this._bodyRank(bodyObj);
          if (k === 0) {
            this.openPopup();
          } else if (Math.abs(k) < 6) {
            this.moveTo(Math.round(this.target) + k);
          }
        }
        return;
      }

      // 11. size confirm
      const confirmBtn = t.closest('[data-rw-confirm]');
      if (confirmBtn) {
        const picker = confirmBtn.closest('[data-rw-picker]');
        const card = picker?._ownerCard || confirmBtn.closest('.rw__item');
        if (card) this._confirmCard(card);
        return;
      }

      // 12. plus button
      const addBtn = t.closest('[data-rw-add]');
      if (addBtn) {
        const card = addBtn.closest('.rw__item');
        if (card) this._togglePicker(card);
        return;
      }

      // 13. add full look
      if (t.closest('[data-rw-all]')) {
        this._addFullLook();
      }
    }
  }

  if (!customElements.get('runway-section')) {
    customElements.define('runway-section', RunwaySection);
  }

  // ---------- Dynamic <runway-section> Builder for Each Fashion Product ----------
  const RW_SEC_ID = 'template--28035983671601__the_runway_wdM8BG';
  const RW_PRODUCTS = {
    'tatum-5-orbit-copy': { name: 'Air Jordan 12 Retro', vendor: 'Nikey | Password: 1', price: '$149.00', img: ASSET_BASE + 'source-tatum-5-orbit-copy.webp', w: 400, h: 400, mw: 160, mh: 160, legend: 'Shoe size', options: ['40', '41', '42', '43', '44', '45', '46'], variants: [57015167025457, 57015167058225, 57015167090993, 57015167123761, 57015167156529, 57015167189297, 57015167222065], url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy' },
    'tshirt': { name: 'Tshirt', vendor: 'Nike', price: '$199.00', img: ASSET_BASE + 'source-tshirt.webp', w: 400, h: 563, mw: 160, mh: 225, legend: 'Size', options: ['S', 'L', 'M', 'XL'], variants: [56835911582001, 56835911614769, 56835911647537, 56835911680305], url: 'https://nike-makknzjs.myshopify.com/products/tshirt' },
    'sweatshirt': { name: 'Sweatshirt', vendor: 'Nike', price: '$199.00', img: ASSET_BASE + 'source-sweatshirt.webp', w: 400, h: 581, mw: 160, mh: 232, legend: 'Size', options: ['S', 'L', 'M', 'XL'], variants: [56835806396721, 56835806429489, 56835806462257, 56835806495025], url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt' },
    'tatum-5-orbit': { name: 'Tatum 5 Orbit', vendor: 'Nikey | Password: 1', price: '$149.00', img: ASSET_BASE + 'source-tatum-5-orbit.webp', w: 400, h: 400, mw: 160, mh: 160, legend: 'Shoe size', options: ['40', '41', '42', '43', '44', '45', '46'], variants: [57015166730545, 57015166763313, 57015166796081, 57015166828849, 57015166861617, 57015166894385, 57015166927153], url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit' },
    'hoodie-black': { name: 'Hoodie Black', vendor: 'Nike', price: '$199.00', img: ASSET_BASE + 'source-hoodie-black.webp', w: 400, h: 536, mw: 160, mh: 214, legend: 'Size', options: ['S', 'L', 'M', 'XL'], variants: [56836251681073, 56836251713841, 56836251746609, 56836251779377], url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black' },
    'sweatshirt-plus': { name: 'Sweatshirt Plus', vendor: 'Nike', price: '$199.00', img: ASSET_BASE + 'source-sweatshirt-plus.webp', w: 400, h: 610, mw: 160, mh: 244, legend: 'Size', options: ['S', 'L', 'M', 'XL'], variants: [56836143743281, 56836143776049, 56836143808817, 56836143841585], url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus' },
    'hoodie': { name: 'Hoodie', vendor: 'Nike', price: '$199.00', img: ASSET_BASE + 'source-hoodie.webp', w: 400, h: 555, mw: 160, mh: 222, legend: 'Size', options: ['S', 'L', 'M', 'XL'], variants: [56836002185521, 56836002218289, 56836002251057, 56836002283825], url: 'https://nike-makknzjs.myshopify.com/products/hoodie' },
    'air-jordan-12-retro-copy': { name: 'Luka 5', vendor: 'Nikey | Password: 1', price: '$149.00', img: ASSET_BASE + 'source-air-jordan-12-retro-copy.webp', w: 400, h: 400, mw: 160, mh: 160, legend: 'Shoe size', options: ['40', '41', '42', '43', '44', '45', '46'], variants: [57015176364337, 57015176397105, 57015176429873, 57015176462641, 57015176495409, 57015176528177, 57015176560945], url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy' },
  };

  const RW_LOOKS = [
    { num: 1, idx: 0, key: 'bndthK', name: 'The City Edit', src640: ASSET_BASE + 'model-1-640.webp', src1080: ASSET_BASE + 'original-look-1.webp', items: [{ id: 'tatum-5-orbit-copy', x: '47%', y: '27%' }, { id: 'tshirt', x: '48%', y: '58%' }, { id: 'sweatshirt', x: '45%', y: '96%' }] },
    { num: 2, idx: 1, key: 'XckgG6', name: 'Gallery Opening', src640: ASSET_BASE + 'model-5-640.webp', src1080: ASSET_BASE + 'original-look-5.webp', items: [{ id: 'tatum-5-orbit', x: '50%', y: '28%' }, { id: 'hoodie-black', x: '48%', y: '58%', tag: 'New' }, { id: 'tshirt', x: '45%', y: '88%' }] },
    { num: 3, idx: 2, key: 'rLfAhC', name: 'Gallery Opening', src640: ASSET_BASE + 'model-4-640.webp', src1080: ASSET_BASE + 'original-look-4.webp', items: [{ id: 'sweatshirt-plus', x: '50%', y: '28%' }, { id: 'tatum-5-orbit', x: '48%', y: '58%', tag: 'New' }, { id: 'tshirt', x: '45%', y: '88%' }] },
    { num: 4, idx: 3, key: 'FKg67q', name: 'Studio Day', src640: ASSET_BASE + 'model-6-640.webp', src1080: ASSET_BASE + 'original-look-6.webp', items: [{ id: 'hoodie-black', x: '50%', y: '28%' }, { id: 'tatum-5-orbit-copy', x: '48%', y: '58%' }, { id: 'tshirt', x: '45%', y: '88%' }] },
    { num: 5, idx: 4, key: '8KREEE', name: 'Studio Day', src640: ASSET_BASE + 'model-3-640.webp', src1080: ASSET_BASE + 'original-look-3.webp', items: [{ id: 'sweatshirt', x: '50%', y: '28%' }, { id: 'tatum-5-orbit', x: '48%', y: '58%' }, { id: 'tshirt', x: '45%', y: '88%' }] },
    { num: 6, idx: 5, key: 'N3bfm9', name: 'Studio Day', src640: ASSET_BASE + 'model-2-640.webp', src1080: ASSET_BASE + 'original-look-2.webp', items: [{ id: 'hoodie', x: '50%', y: '28%' }, { id: 'air-jordan-12-retro-copy', x: '48%', y: '58%' }, { id: 'tshirt', x: '45%', y: '88%' }] },
  ];

  // Maps each Lumen fashion product ID to its matching starting Runway look index (0..5)
  const PRODUCT_LOOK_INDEX = {
    p1003: 0, // Velocity Runner Sneakers -> Look 01: The City Edit
    p1019: 3, // Rebel Leather Biker Jacket -> Look 04: Studio Day
    p1020: 1, // Essential Organic Cotton Tee -> Look 02: Gallery Opening
    p1021: 5, // Cloud Fleece Oversized Hoodie -> Look 06: Studio Day
    p1025: 2, // Milano Structured Tote Bag -> Look 03: Gallery Opening
    p1027: 0, // Air Jordan 12 Retro -> Look 01: The City Edit
    p1028: 1, // Tatum 5 Orbit -> Look 02: Gallery Opening
    p1029: 5, // Luka 5 -> Look 06: Studio Day
    p1030: 1, // Reign Graphic Jersey Tshirt -> Look 02: Gallery Opening
    p1031: 4, // Atelier Crewneck Sweatshirt -> Look 05: Studio Day
    p1032: 2, // Verdo Varsity Sweatshirt Plus -> Look 03: Gallery Opening
    p1033: 5, // Studio Heather Graphic Hoodie -> Look 06: Studio Day
    p1034: 3, // Nocturne Star Graphic Hoodie Black -> Look 04: Studio Day
  };

  const RW_INLINE_TOKENS = '--rw-c-stage:#ffffff;--rw-c-panel:#ffffff;--rw-c-text:#151413;--rw-c-muted:#66625c;--rw-c-accent:#0e0e0e;--rw-c-on-accent:#ffffff;--rw-c-line:#c8c8c8;--rw-card:#DFDFDF;--rw-hf:var(--font-heading--family, inherit);--rw-hw:400;--rw-h-d:46px;--rw-h-m:24px;--rw-sub-d:12px;--rw-sub-m:12px;--rw-eyebrow-d:11px;--rw-eyebrow-m:10px;--rw-label-d:10px;--rw-label-m:9px;--rw-chip-d:17px;--rw-chip-m:18px;--rw-ph-d:18px;--rw-ph-m:16px;--rw-pt-size-d:13px;--rw-pt-size-m:12px;--rw-price-d:12px;--rw-price-m:12px;--rw-opt-d:11px;--rw-opt-m:11px;--rw-total-d:16px;--rw-total-m:16px;--rw-thumb-d:92px;--rw-thumb-m:62px;--rw-tag-top:18px;--rw-tag-left:0px;--rw-thumb-radius:0px;--rw-morph:900ms;--rw-bar-r:20px;--rw-panel-w:380px;--rw-panel-pad-d:32px;--rw-radius:0px;--rw-max:none;--rw-speed:5s;--rw-ax:40%;--rw-btn-radius:0px;--rw-pill-radius:30px;--rw-add-radius:20px';

  window.buildRunwaySectionHtml = function (productId) {
    let startLook = PRODUCT_LOOK_INDEX[productId];
    if (startLook === undefined) {
      const n = parseInt(String(productId || '').replace(/\D/g, ''), 10) || 0;
      startLook = n % 6;
    }
    const uid = RW_SEC_ID + '_' + (productId || 'main');
    const imgTag = (l) => `<img src="${l.src640}" srcset="${l.src640} 640w, ${l.src1080} 1080w" sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px" loading="eager" decoding="async" width="1100" height="1956" draggable="false" data-model-image alt="${l.name}">`;

    const bodiesHtml = RW_LOOKS.map((l) => `
      <div class="rw__model" data-rw-model data-index="${l.idx}" aria-hidden="true">
        <span class="rw__shadow"></span>
        <div class="rw__figure" style="--rw-ar: 0.5625">
          <div class="rw__art">
            ${imgTag(l)}
            <button type="button" class="rw__hit" data-rw-go="${l.idx}" aria-label="Look ${l.num}: ${l.name}" tabindex="-1"></button>
          </div>
        </div>
      </div>`).join('');

    const heroesHtml = RW_LOOKS.map((l) => {
      const pins = l.items.map((it, k) => {
        const n = k + 1;
        const p = RW_PRODUCTS[it.id];
        return `<button type="button" class="rw__pin" data-rw-pin="${n}" data-tip="${p.name}" style="left:${it.x}; top:${it.y}; --pi:${n}" aria-label="${n}: ${p.name}" tabindex="-1"><span class="rw__pin-dot">${n}</span></button>`;
      }).join('');
      return `
      <div class="rw__hero${l.idx === startLook ? ' is-on' : ''}" data-rw-hero data-index="${l.idx}" data-name="${l.name}" data-label="Look ${l.num}: ${l.name}" data-probe="${l.src640}"${l.idx === startLook ? '' : ' aria-hidden="true"'}>
        <div class="rw__morph">
          <span class="rw__shadow"></span>
          <div class="rw__figure" style="--rw-ar: 0.5625">
            <div class="rw__art">
              ${imgTag(l)}
              <button type="button" class="rw__zoom" data-rw-zoom aria-label="View look: ${l.name}" tabindex="${l.idx === startLook ? '0' : '-1'}"></button>
              <div class="rw__pins">${pins}</div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    const ticksHtml = RW_LOOKS.map((l) => `
      <button type="button" class="rw__tick" data-rw-tick="${l.idx}" aria-current="${l.idx === startLook ? 'true' : 'false'}" aria-label="Look ${l.num}: ${l.name}">
        <span class="rw__tick-bar"></span>
        <span class="rw__tick-label">${String(l.num).padStart(2, '0')}<span class="rw__tick-name">&nbsp;&nbsp;${l.name}</span></span>
      </button>`).join('');

    const panelsHtml = RW_LOOKS.map((l) => {
      const rows = l.items.map((it, k) => {
        const n = k + 1;
        const p = RW_PRODUCTS[it.id];
        const pickerId = `Picker-${uid}-look_${l.key}-${n}`;
        const optName = `Opt-${uid}-look_${l.key}-${n}-1`;
        const variantsJson = JSON.stringify(p.options.map((val, idx) => ({ id: p.variants[idx], a: true, o: [val] })));
        const pills = p.options.map((val, idx) => `
          <label class="rw__pill">
            <input type="radio" name="${optName}" value="${val}" data-rw-option="0"${idx === 0 ? ' checked' : ''}>
            <span class="rw__pill-label">${val}</span>
          </label>`).join('');
        return `
          <li class="rw__item" data-rw-card="${n}" style="--i:${n}" data-title="${p.name}">
            ${it.tag ? `<span class="rw__tag"><span class="rw__tag-text">${it.tag}</span></span>` : ''}
            <a class="rw__media" href="${p.url}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
              <img src="${p.img}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}" alt="">
              <span class="rw__num">${n}</span>
            </a>
            <div class="rw__info">
              <span class="rw__type">${p.vendor}</span>
              <a class="rw__name" href="${p.url}" target="_blank" rel="noopener noreferrer">${p.name}</a>
              <span class="rw__price"><span>${p.price}</span></span>
            </div>
            <button type="button" class="rw__add" data-rw-add aria-expanded="false" aria-controls="${pickerId}" aria-label="Add to bag: ${p.name}" data-added-label="Added to bag: ${p.name}">
              <svg class="rw__ico-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>
              <svg class="rw__ico-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 7"/></svg>
              <svg class="rw__ico-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 3a9 9 0 1 1-9 9"/></svg>
            </button>
            <div class="rw__picker" id="${pickerId}" data-rw-picker hidden>
              <div class="rw__picker-head">
                <img class="rw__picker-thumb" src="${p.img}" loading="lazy" decoding="async" width="${p.mw}" height="${p.mh}" alt="">
                <div class="rw__picker-meta">
                  <span class="rw__picker-title">${p.name}</span>
                  <span class="rw__picker-price">${p.price}</span>
                </div>
                <button type="button" class="rw__picker-close" data-rw-pick-close aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
                </button>
              </div>
              <fieldset class="rw__opt">
                <legend class="rw__opt-name">${p.legend}</legend>
                <div class="rw__opt-values">${pills}</div>
              </fieldset>
              <button type="button" class="rw__confirm" data-rw-confirm>
                <span data-rw-confirm-label data-add="Add to bag">Add to bag</span>
                <span class="rw__sr"> — ${p.name}</span>
              </button>
              <script type="application/json" data-rw-variants>${variantsJson}</script>
            </div>
          </li>`;
      }).join('');

      return `
      <div class="rw__look-panel${l.idx === startLook ? ' is-in' : ''}" data-rw-panel="${l.idx}"${l.idx === startLook ? '' : ' hidden'}>
        <div class="rw__mhead">
          <span class="rw__mhead-title">${l.name}</span>
          <span class="rw__label">3 pieces</span>
        </div>
        <ul class="rw__items" role="list">${rows}</ul>
        <div class="rw__bundle has-rule">
          <p class="rw__msg" data-rw-msg role="status" aria-live="polite"></p>
          <div class="rw__bundle-row">
            <div class="rw__bundle-copy">
              <span class="rw__bundle-title">Complete the look</span>
              <span class="rw__bundle-note">Bundle all 3 and save 10%</span>
            </div>
            <div class="rw__bundle-price">
              <s>$547.00</s>
              <strong>$492.30</strong>
            </div>
          </div>
          <button type="button" class="rw__cta" data-rw-all>
            <span class="rw__cta-add">Add full look to bag</span>
            <span class="rw__cta-m">Add full look — $492.30</span>
            <span class="rw__cta-done">Full look in your bag</span>
            <svg class="rw__cta-arrow" width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h24M19 1l6 6-6 6"/></svg>
            <svg class="rw__cta-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3a9 9 0 1 1-9 9"/></svg>
          </button>
        </div>
        <template data-rw-pieces-text>3 pieces</template>
      </div>`;
    }).join('');

    return `
    <runway-section
      id="Runway-${uid}"
      class="rw rw--add-icon rw--popup rw--list has-dividers has-border"
      data-feel="balanced"
      data-blur="true"
      data-mblur="true"
      data-style="ring"
      data-mstyle="classic"
      data-fit="true"
      data-height-mode="original"
      data-height-vh="100"
      data-mheight-mode="custom"
      data-mheight-vh="109"
      data-reflect="false"
      data-autoplay="true"
      data-speed="5000"
      data-after-add="stay"
      data-bundle-code=""
      data-initial-look="${startLook}"
      data-msg-choose="Pick a size for: [items]"
      data-msg-error="Couldn’t add to bag. Please try again."
      data-msg-soldout="Sold out"
      style="${RW_INLINE_TOKENS}">
      <div class="rw__sticky">
        <div class="rw__grid">
          <div class="rw__left">
            <div class="rw__head">
              <div class="rw__intro">
                <h2 class="rw__title">Try the Look.</h2>
                <p class="rw__sub">Six looks, styled head to toe. Tap a pin to see the piece.</p>
              </div>
              <span class="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live></span>
            </div>
            <div class="rw__stage" data-rw-stage tabindex="0" role="region" aria-roledescription="carousel" aria-label="Try the Look. — use arrow keys or swipe to change look">
              <div class="rw__actors" data-rw-actors>${bodiesHtml}</div>
              <div class="rw__heroes" data-rw-heroes>${heroesHtml}</div>
              <span class="rw__sweep"></span>
              <span class="rw__cursor" data-rw-cursor><span class="rw__cursor-in"><span class="rw__cursor-label rw__cursor-drag">Drag</span><span class="rw__cursor-label rw__cursor-view">View</span></span></span>
              <span class="rw__walk"><span class="rw__walk-line"></span></span>
            </div>
            <div class="rw__controls">
              <button type="button" class="rw__icon" data-rw-prev aria-label="Previous look">
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M25 7H1M7 1L1 7l6 6"/></svg>
              </button>
              <div class="rw__ticks">${ticksHtml}</div>
              <button type="button" class="rw__icon rw__auto" data-rw-auto aria-pressed="false" aria-label="Autoplay">
                <svg class="rw__play-ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>
                <svg class="rw__pause-ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>
              </button>
              <button type="button" class="rw__icon" data-rw-next aria-label="Next look">
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h24M19 1l6 6-6 6"/></svg>
              </button>
            </div>
            <div class="rw__lb" data-rw-lb data-word="Look" role="region" aria-label="View look" aria-hidden="true">
              <div class="rw__lb-stage" data-rw-lb-stage></div>
              <div class="rw__lb-top">
                <p class="rw__lb-cap">
                  <span class="rw__lb-kicker" data-rw-lb-kicker></span>
                  <span class="rw__lb-name" data-rw-lb-name></span>
                </p>
                <button type="button" class="rw__lb-close" data-rw-zoom-close aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
                </button>
              </div>
              <p class="rw__lb-hint">Tap a dot to shop the piece</p>
            </div>
          </div>
          <div class="rw__panel has-rule">
            <div class="rw__panel-inner">
              <div class="rw__panel-head">
                <h3 class="rw__panel-title">In this look</h3>
                <span class="rw__label" data-rw-pieces>3 pieces</span>
              </div>${panelsHtml}
            </div>
          </div>
        </div>
      </div>
    </runway-section>`;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBagUI);
  } else {
    initBagUI();
  }
})();
