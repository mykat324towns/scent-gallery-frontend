// Product Page — Slug-based routing + API fetch + render

(function () {
  'use strict';

  const container = document.getElementById('product-content');
  const loading = document.getElementById('product-loading');
  const error = document.getElementById('product-error');

  function formatPrice(prices) {
    if (!prices) return '';
    const symbol  = prices.currency_symbol || '$';
    const minor   = prices.currency_minor_unit ?? 2;
    const divisor = Math.pow(10, minor);
    if (prices.price_range) {
      const min = (parseInt(prices.price_range.min_amount, 10) / divisor).toFixed(minor);
      return 'From ' + symbol + min;
    }
    const amount = (parseInt(prices.price, 10) / divisor).toFixed(minor);
    return symbol + amount;
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

  async function fetchVariations(productId) {
    try {
      const res = await fetch(getApiUrl('/variations') + '?id=' + encodeURIComponent(productId));
      if (!res.ok) throw new Error('variations API error: ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('[product-page] variations fetch failed:', err);
      return [];
    }
  }

  function buildSizeSelector(variations) {
    if (!variations || variations.length === 0) return '';
    // Sort by ml value ascending
    const sorted = variations.slice().sort(function (a, b) {
      const aVal = parseFloat((a.attributes[0] && a.attributes[0].value) || '0');
      const bVal = parseFloat((b.attributes[0] && b.attributes[0].value) || '0');
      return aVal - bVal;
    });
    const pills = sorted.map(function (v, i) {
      // Attribute value holds the size (e.g. "10ml") regardless of attribute name
      const raw   = (v.attributes[0] && v.attributes[0].value) || ('Option ' + (i + 1));
      const label = sanitizeHtml(raw.toUpperCase());
      return '<button' +
        ' class="size-pill' + (i === 0 ? ' size-pill--active' : '') + '"' +
        ' data-variation-id="' + v.id + '"' +
        ' style="padding:8px 18px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:' + (i === 0 ? 'var(--color-primary)' : 'transparent') + ';color:' + (i === 0 ? 'white' : 'var(--color-on-surface)') + ';font-size:12px;font-weight:600;letter-spacing:0.05em;"' +
        '>' + label + '</button>';
    }).join('');
    return '<div id="size-selector" style="margin-bottom:var(--space-6);">' +
      '<p style="font-size:12px;font-weight:600;color:var(--color-on-surface-muted);margin-bottom:8px;letter-spacing:0.08em;">SELECT SIZE</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + pills + '</div>' +
      '</div>';
  }

  function renderProduct(product) {
    const images = product.images || [];
    const mainImage = images[0]?.src || '';
    const galleryImages = images.slice(1);
    const prices = product.prices || null;
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

          <div id="product-price-display" style="font-size: 24px; font-weight: 600; color: var(--color-primary); margin-bottom: var(--space-6);">
            ${formatPrice(prices)}
          </div>

          ${description ? `
            <div style="color: var(--color-on-surface-muted); font-size: 14px; line-height: 1.6; margin-bottom: var(--space-6); max-width: 500px;">
              ${description}
            </div>
          ` : ''}

          <div id="size-selector-mount" style="margin-bottom: var(--space-6);"></div>

          <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-8);">
            <button
              id="add-to-cart-btn"
              disabled
              style="
                width: 100%;
                padding: var(--space-3) var(--space-4);
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 7px;
                font-size: 14px;
                font-weight: 600;
                cursor: not-allowed;
                opacity: 0.6;
                transition: background var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard);
              "
            >Select a size</button>
            <a
              href="${window.SG_CONFIG.shopUrl}/product/${product.slug}/"
              style="font-size:12px;color:var(--color-on-surface-muted);text-decoration:underline;text-align:center;display:block;"
              target="_blank" rel="noopener"
            >View on store</a>
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

    // Variations — data is already in product.variations, no separate fetch needed
    window._selectedVariationId = null;

    if (product.variations && product.variations.length > 0) {
      var mount = document.getElementById('size-selector-mount');
      if (!mount) return;

      mount.innerHTML = buildSizeSelector(product.variations);

      mount.querySelectorAll('.size-pill').forEach(function (pill) {
        pill.addEventListener('click', function () {
          mount.querySelectorAll('.size-pill').forEach(function (p) {
            p.style.background = 'transparent';
            p.style.color = 'var(--color-on-surface)';
          });
          pill.style.background = 'var(--color-primary)';
          pill.style.color = 'white';

          window._selectedVariationId = pill.dataset.variationId;

          var addBtn = document.getElementById('add-to-cart-btn');
          if (addBtn) {
            addBtn.disabled = false;
            addBtn.style.cursor = 'pointer';
            addBtn.style.opacity = '1';
            addBtn.textContent = 'Add to Cart';
          }
        });
      });

      // Auto-select first pill
      var first = mount.querySelector('.size-pill');
      if (first) first.click();
    }

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
