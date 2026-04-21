// Collections Page — Fetch and render all products

(function () {
  'use strict';

  const grid = document.getElementById('collection-grid');
  const loading = document.getElementById('collection-loading');
  const error = document.getElementById('collection-error');

  function formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function fetchProducts() {
    loading.style.display = 'block';
    grid.innerHTML = '';
    error.style.display = 'none';

    try {
      const res = await fetch(getApiUrl('/products') + '?per_page=100');

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const products = await res.json();
      const productArray = Array.isArray(products) ? products : products.data || [];

      if (productArray.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-on-surface-muted);">No products found</p>';
        loading.style.display = 'none';
        return;
      }

      renderProducts(productArray);
      loading.style.display = 'none';
    } catch (err) {
      console.error('[collections] fetch failed:', err);
      error.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  function renderProducts(products) {
    grid.innerHTML = products.map(product => renderProductCard(product)).join('');
  }

  function renderProductCard(product) {
    const image = product.images?.[0]?.src || '';
    const price = product.price ? parseInt(product.price, 10) : 0;

    return `
      <div class="product-card reveal" data-product-slug="${sanitizeHtml(product.slug)}">
        <div class="product-card__image" style="position: relative; overflow: hidden; border-radius: var(--radius-md); background: var(--color-bg-alt); margin-bottom: var(--space-3);">
          ${image ? `<img src="${image}" alt="${sanitizeHtml(product.name)}" style="width: 100%; aspect-ratio: 1; object-fit: cover; display: block;" />` : '<div style="width: 100%; aspect-ratio: 1; background: var(--color-border);"></div>'}
        </div>
        <div class="product-card__info">
          <h3 class="product-card__name" style="font-family: var(--font-display); font-size: 14px; font-weight: 600; margin-bottom: var(--space-1); line-height: 1.3;">
            ${sanitizeHtml(product.name)}
          </h3>
          <div class="product-card__price" style="font-size: 14px; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-2);">
            ${formatPrice(price)}
          </div>
          ${product.description ? `<p style="font-size: 12px; color: var(--color-on-surface-muted); line-height: 1.4; margin-bottom: var(--space-3);">${sanitizeHtml(product.description.substring(0, 80))}...</p>` : ''}
          <button class="product-card__cta" style="width: 100%; padding: var(--space-2) var(--space-3); background: var(--color-primary); color: white; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background var(--duration-fast);">
            View Product
          </button>
        </div>
      </div>
    `;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', fetchProducts);

})();
