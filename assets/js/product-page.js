// Product Page — Slug-based routing + API fetch + render

(function () {
  'use strict';

  const container = document.getElementById('product-content');
  const loading = document.getElementById('product-loading');
  const error = document.getElementById('product-error');

  function formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function fetchProduct(slug) {
    loading.style.display = 'block';
    container.innerHTML = '';
    error.style.display = 'none';

    try {
      const url = getApiUrl('/products') + '?slug=' + encodeURIComponent(slug);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // WooCommerce returns an array, find the matching product
      const products = Array.isArray(data) ? data : data.data || [];
      const product = products.find(p => p.slug === slug);

      if (!product) {
        showError();
        return;
      }

      renderProduct(product);
      loading.style.display = 'none';
    } catch (err) {
      console.error('[product-page] fetch failed:', err);
      showError();
    }
  }

  function renderProduct(product) {
    const images = product.images || [];
    const mainImage = images[0]?.src || '';
    const galleryImages = images.slice(1);
    const price = product.price ? parseInt(product.price, 10) : 0;
    const description = product.description || '';

    // Create breadcrumb + main layout
    const html = `
      <div style="margin-bottom: var(--space-6);">
        <a href="/collections.html" style="color: var(--color-on-surface-muted); font-size: 12px; text-decoration: none;">← Back to shop</a>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); align-items: start;">
        <!-- Gallery -->
        <div>
          <div style="position: relative; width: 100%; margin-bottom: var(--space-4); overflow: hidden; border-radius: var(--radius-md); background: var(--color-bg-alt);">
            <img
              id="main-image"
              src="${mainImage || ''}"
              alt="${sanitizeHtml(product.name)}"
              style="width: 100%; aspect-ratio: 1; object-fit: cover; display: ${mainImage ? 'block' : 'none'};"
            />
            ${!mainImage ? '<div style="width: 100%; aspect-ratio: 1; background: var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-on-surface-muted);">No image</div>' : ''}
          </div>

          ${galleryImages.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2);">
              ${galleryImages.slice(0, 4).map(img => `
                <button
                  class="gallery-thumb"
                  style="border: 2px solid transparent; border-radius: var(--radius-sm); cursor: pointer; overflow: hidden; aspect-ratio: 1; padding: 0; background: none;"
                  data-src="${img.src}"
                >
                  <img src="${img.src}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Details -->
        <div>
          <h1 style="font-family: var(--font-display); font-size: clamp(28px, 5vw, 44px); font-weight: 600; margin-bottom: var(--space-3); line-height: 1.1;">
            ${sanitizeHtml(product.name)}
          </h1>

          <div style="font-size: 24px; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-6);">
            ${formatPrice(price)}
          </div>

          ${description ? `
            <div style="color: var(--color-on-surface-muted); font-size: 14px; line-height: 1.6; margin-bottom: var(--space-6); max-width: 500px;">
              ${description}
            </div>
          ` : ''}

          <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-8);">
            <a
              href="${window.SG_CONFIG.shopUrl}/product/${product.slug}/"
              style="
                flex: 1;
                padding: var(--space-3) var(--space-4);
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 7px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                text-align: center;
                transition: background var(--duration-fast) var(--ease-standard);
              "
              onmouseover="this.style.background='var(--color-primary-dark)'"
              onmouseout="this.style.background='var(--color-primary)'"
            >
              View on Store
            </a>
          </div>

          <div style="background: var(--color-warm-sage-light); padding: var(--space-4); border-radius: var(--radius-md); font-size: 12px; color: var(--color-warm-sage); line-height: 1.6;">
            <strong>✓ Authentic</strong> · Sourced from authorized distributors
            <br />
            <strong>✓ Fresh</strong> · Stored in ideal conditions
            <br />
            <strong>✓ Ships fast</strong> · Orders typically ship within 24 hours
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    loading.style.display = 'none';

    // Attach gallery thumb listeners
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const mainImg = document.getElementById('main-image');
        const src = thumb.dataset.src;
        mainImg.src = src;
        mainImg.style.display = 'block';

        // Visual feedback
        document.querySelectorAll('.gallery-thumb').forEach(t => t.style.borderColor = 'transparent');
        thumb.style.borderColor = 'var(--color-primary)';
      });
    });
  }

  function showError() {
    container.innerHTML = '';
    loading.style.display = 'none';
    error.style.display = 'block';
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const slug = getSlugFromUrl();
    if (!slug) {
      error.textContent = 'No product specified';
      showError();
      return;
    }
    fetchProduct(slug);
  });

})();
