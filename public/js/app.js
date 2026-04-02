// ─── BottleRush — Shared App Utilities ───────────────────────────────────────

// Dynamically resolve API base URL
const API_BASE = (() => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.host}`;
  }
  return window.location.origin; // Koyeb URL picked up automatically
})();

// ─── Cart State (sessionStorage) ─────────────────────────────────────────────
const Cart = {
  KEY: 'br_cart',

  get() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    sessionStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },

  add(product) {
    const items = this.get();
    const existing = items.find(i => i._id === product._id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    this.save(items);
    Toast.show(`${product.name} added to cart`, 'success');
  },

  remove(productId) {
    const items = this.get().filter(i => i._id !== productId);
    this.save(items);
  },

  updateQty(productId, delta) {
    const items = this.get();
    const item = items.find(i => i._id === productId);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) return this.remove(productId);
    this.save(items);
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.qty, 0);
  },

  clear() {
    sessionStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  updateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    const count = this.count();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }
};

// ─── Toast Notifications ──────────────────────────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  },

  show(message, type = '') {
    if (!this.container) this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }
};

// ─── Age Gate ─────────────────────────────────────────────────────────────────
const AgeGate = {
  KEY: 'br_age_ok',

  check() {
    if (sessionStorage.getItem(this.KEY)) return;
    this.show();
  },

  show() {
    const overlay = document.createElement('div');
    overlay.className = 'age-gate-overlay';
    overlay.innerHTML = `
      <div class="age-gate-box">
        <div style="font-size:3.5rem">🔞</div>
        <h2>Are you 21 or older?</h2>
        <p>BottleRush delivers alcohol. You must be of legal drinking age to proceed. Please drink responsibly.</p>
        <div class="age-gate-actions">
          <button class="btn btn-primary btn-block" id="age-yes">Yes, I'm 21+</button>
          <button class="btn btn-outline btn-block" id="age-no">No, take me back</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('age-yes').addEventListener('click', () => {
      sessionStorage.setItem(this.KEY, '1');
      overlay.remove();
    });
    document.getElementById('age-no').addEventListener('click', () => {
      window.location.href = 'https://google.com';
    });
  }
};

// ─── Nav Active State + Mobile Toggle ────────────────────────────────────────
function initNav() {
  Cart.updateBadge();

  // Highlight active link
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === path) a.classList.add('active');
  });

  // Mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

// ─── Format currency ─────────────────────────────────────────────────────────
function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── On DOM ready ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  initNav();
  AgeGate.check();
});
