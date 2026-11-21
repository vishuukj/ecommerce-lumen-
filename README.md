# 🛍️ Lumen — Online Shopping Platform

A modern, interactive e-commerce web app built with **zero dependencies**: a Node.js REST API plus a vanilla-JS single-page frontend and a password-protected Admin panel. Nothing to install — just run it.

## Run

```bash
cd shop
npm start          # or: node server.js
# Storefront:  http://localhost:3000
# Admin panel: http://localhost:3000/admin  (default password: admin123)
```

Use `npm run dev` to auto-restart on server changes. Set `PORT` to change the port, or `ADMIN_PASSWORD` to override the initial admin password.

## Features

**Storefront (`http://localhost:3000`)**
- Animated hero carousel (autoplay, arrows, swipe), category tiles, flash-sale countdown, trending tabs, recently viewed
- Live search suggestions with keyboard navigation (press `/` to focus)
- Shop page with category / brand / price-range / rating / stock filters, sorting, pagination, grid/list toggle, removable filter chips — all synced to the URL
- Product page: image gallery with hover zoom, colour & size pickers, quantity, PIN-code delivery estimate, tabs for description / specs / reviews, related products, share
- Quick-view modal, wishlist, skeleton loaders, toasts, fly-to-cart animation, dark mode, fully responsive

**Admin Panel (`http://localhost:3000/admin`)**
- Password-protected login (`admin123` by default, scrypt-hashed with brute-force rate limiting and a change-password screen in **Settings**)
- **Dashboard**: live KPI stat cards (revenue, orders, pending fulfilment, customers, products, out-of-stock), 7-day revenue chart, one-click `+10` low-stock restock, recent orders, and top sellers
- **Products (`#/products`)**:
  - Instant search, category filter, and stock filter (`All`, `Low stock`, `Out of stock`, `Hidden`)
  - **Inline stock controls** (`−`, direct number input, `+`) that save immediately without reloading
  - **Add / Edit / Duplicate / Delete** products in a slide-out form with live preview, drag-and-drop image upload (auto-resized & saved to `/uploads/`), image URL support, drag-to-reorder gallery, colour swatches, sizes, features, specifications, tags (`New`, `Deal`, `Bestseller`), and visibility toggle
  - All changes are persisted to `data/db.json` and appear on the storefront immediately without restarting the server
- **Orders (`#/orders`)**: search & filter orders, expand full order details and timeline, and update order status (`confirmed` → `packed` → `shipped` → `delivered` / `cancelled`, with automatic stock restocking on cancel)
- **Categories (`#/categories`)**: create and delete store categories with custom emoji icons and accent colours

**Cart, Checkout & Accounts**
- Slide-out cart drawer with free-shipping progress bar
- Coupons validated on the server: `WELCOME10`, `FLAT500` (orders ≥ ₹4,999), `FREESHIP`
- 3-step checkout (address → delivery → payment) with inline validation, live card preview, Luhn check, UPI and Cash on Delivery
- Customer registration / sign-in, order history with live status tracker, order cancellation, and verified-purchase reviews

> Payments are **simulated** (demo mode). Test card: `4242 4242 4242 4242`, any future expiry, any CVV. Card numbers are never stored — only the last 4 digits.

## Project structure

```
shop/
├── server.js          # HTTP server, storefront & admin REST API, pricing, auth, uploads
├── data/
│   ├── catalog.js     # Initial seed categories & products
│   └── db.json        # Runtime database: products, categories, users, orders, reviews, admin
└── public/
    ├── index.html     # Storefront app shell
    ├── styles.css     # Design system + storefront styles (light/dark)
    ├── app.js         # Storefront SPA
    ├── admin.html     # Admin panel shell (/admin)
    ├── admin.css      # Admin panel styles
    ├── admin.js       # Admin panel SPA
    └── uploads/       # Uploaded product images (created automatically)
```
