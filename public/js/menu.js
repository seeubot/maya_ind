// ─── BottleRush — Menu / Product Catalogue ───────────────────────────────────

let allProducts = [];
let activeFilter = 'all';

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="loader">
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
  </div>`;

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    allProducts = json.data;
    renderProducts(allProducts);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Could not load products</h3>
      <p>${err.message}</p>
      <button class="btn btn-outline btn-sm" onclick="loadProducts()" style="margin-top:1rem">Retry</button>
    </div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>Nothing here</h3>
      <p>Try a different filter.</p>
    </div>`;
    return;
  }

  const cartItems = Cart.get();

  grid.innerHTML = products.map(p => {
    const inCart = cartItems.some(i => i._id === p._id);
    const stars = '★'.repeat(Math.round(p.rating || 4)) + '☆'.repeat(5 - Math.round(p.rating || 4));
    return `
    <div class="product-card fade-in" data-id="${p._id}">
      <div class="product-img">
        <span>${p.emoji || categoryEmoji(p.category)}</span>
        ${!p.inStock ? '<span class="stock-badge">Out of Stock</span>' : ''}
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-meta">${p.volume}${p.unit}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">₹${p.price}</div>
            <div class="product-rating"><span>${stars}</span> ${p.rating || '4.0'}</div>
          </div>
          <button
            class="btn btn-cart ${inCart ? 'in-cart' : ''}"
            onclick="handleAddToCart('${p._id}')"
            ${!p.inStock ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}
            data-id="${p._id}">
            ${inCart ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function handleAddToCart(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (!product || !product.inStock) return;
  Cart.add(product);

  // Update button state
  const btn = document.querySelector(`[data-id="${productId}"].btn-cart`);
  if (btn) {
    btn.textContent = '✓ Added';
    btn.classList.add('in-cart');
  }
}

function categoryEmoji(cat) {
  const map = { beer: '🍺', wine: '🍷', whisky: '🥃', vodka: '🍸', gin: '🍹', rum: '🥂' };
  return map[cat] || '🍶';
}

function filterProducts(category) {
  activeFilter = category;

  // Update filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === category);
  });

  const filtered = category === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === category);
  renderProducts(filtered);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid')) {
    loadProducts();

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => filterProducts(chip.dataset.filter));
    });
  }
});
