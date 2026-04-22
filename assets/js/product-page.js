// Product Page — Slug-based routing + API fetch + render

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────
  // Set this to match the Product Add-Ons field slug in WooCommerce > Products > Add-Ons
  const PRESSURIZED_ADDON_FIELD = 'addon-pressurized-atomizer';
  const PRESSURIZED_ADDON_PRICE_CENTS = 100; // $1.00 in minor units

  const SIZES_WITH_PRESSURIZED = new Set(['10ml', '30ml']);

  const container = document.getElementById('product-content');
  const loading   = document.getElementById('product-loading');
  const error     = document.getElementById('product-error');

  // ── Bottle image map ────────────────────────────────────────────────
  const BOTTLE_IMAGES = {
    '1ml':   'assets/img/brand-assets/bottles/1ML.avif',
    '2ml':   'assets/img/brand-assets/bottles/2ML.avif',
    '5ml':   'assets/img/brand-assets/bottles/5ML.avif',
    '10ml':  'assets/img/brand-assets/bottles/10ML-Basic.avif',
    '30ml':  'assets/img/brand-assets/bottles/30ML-basic.avif',
    '10ml+': 'assets/img/brand-assets/bottles/Pressurized-10ML.avif',
    '30ml+': 'assets/img/brand-assets/bottles/Pressurized-30ML.avif',
  };

  // ── Size info ───────────────────────────────────────────────────────
  const PILL_INFO = {
    '1ml':   { sprays: '~20 sprays',              label: 'Quick Test',   badge: false },
    '2ml':   { sprays: '~38 sprays',              label: 'Try It',       badge: false },
    '5ml':   { sprays: '~90 sprays',              label: '~3 wks daily', badge: false },
    '10ml':  { sprays: '~180 sprays',             label: 'Most Popular', badge: true  },
    '30ml':  { sprays: '~550 sprays',             label: 'Best Value',   badge: false },
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  function formatPrice(prices, extraCents) {
    if (!prices) return '';
    const symbol  = prices.currency_symbol || '$';
    const minor   = prices.currency_minor_unit ?? 2;
    const divisor = Math.pow(10, minor);
    let amount;
    if (prices.price_range) {
      const min = parseInt(prices.price_range.min_amount, 10) + (extraCents || 0);
      return 'From ' + symbol + (min / divisor).toFixed(minor);
    }
    amount = parseInt(prices.price, 10) + (extraCents || 0);
    return symbol + (amount / divisor).toFixed(minor);
  }

  // Normalize WooCommerce size attribute values to our canonical keys
  // Handles: '10 ML', '10ML', 'pa_10ml', '10ml', '10ml+' etc.
  function normalizeSizeKey(raw) {
    if (!raw) return '';
    let s = raw.toLowerCase().trim();
    // Strip WooCommerce taxonomy prefix
    if (s.startsWith('pa_')) s = s.slice(3);
    // Remove spaces before 'ml'
    s = s.replace(/\s+ml/, 'ml');
    return s;
  }

  function getBottleImage(sizeKey) {
    return BOTTLE_IMAGES[sizeKey] || null;
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

  // ── Cart / Nonce ─────────────────────────────────────────────────────
  window._wcNonce = null;

  async function initNonce() {
    try {
      const res = await fetch(getApiUrl('/cart'));
      const nonce = res.headers.get('X-WC-Store-API-Nonce') || res.headers.get('Nonce');
      if (nonce) window._wcNonce = nonce;
    } catch (e) {
      // Non-fatal — cart will try without nonce
    }
  }

  async function addToCart(productId, variationId, variationAttr, prices, pressurized) {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Adding…';

    const body = {
      id: productId,
      quantity: 1,
    };

    if (variationId) {
      body.variation = [{ attribute: variationAttr.name, value: variationAttr.value }];
      body.id = productId; // product ID, not variation ID; WC resolves variation via attributes
    }

    if (pressurized) {
      body.extensions = {
        'woocommerce-product-addons': {
          addons: [{
            field_name: PRESSURIZED_ADDON_FIELD,
            value: 'Pressurized',
            price: (PRESSURIZED_ADDON_PRICE_CENTS / 100).toFixed(2),
          }],
        },
      };
    }

    const headers = { 'Content-Type': 'application/json' };
    if (window._wcNonce) headers['X-WC-Store-API-Nonce'] = window._wcNonce;

    try {
      const res = await fetch(getApiUrl('/cart/add-item'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(body),
      });

      // Refresh nonce from response
      const newNonce = res.headers.get('X-WC-Store-API-Nonce');
      if (newNonce) window._wcNonce = newNonce;

      if (res.ok) {
        btn.textContent = 'Added ✓';
        btn.classList.add('btn-add-to-cart--success');
        setTimeout(() => {
          btn.textContent = 'Add to Cart';
          btn.classList.remove('btn-add-to-cart--success');
          btn.disabled = false;
        }, 2000);
      } else {
        throw new Error('Cart error ' + res.status);
      }
    } catch (err) {
      console.error('[product-page] addToCart failed:', err);
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  }

  // ── Fetch ───────────────────────────────────────────────────────────
  async function fetchProduct(slug) {
    loading.style.display = 'block';
    container.innerHTML = '';
    error.style.display = 'none';

    try {
      const url = getApiUrl('/products') + '?slug=' + encodeURIComponent(slug);
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error: ' + res.status);

      const data = await res.json();
      const products = Array.isArray(data) ? data : data.data || [];
      const product  = products.find(p => p.slug === slug);

      if (!product) { showError(); return; }
      renderProduct(product);
      loading.style.display = 'none';
    } catch (err) {
      console.error('[product-page] fetch failed:', err);
      showError();
    }
  }

  // ── Size card builder ───────────────────────────────────────────────
  function buildSizeCards(variations, basePrices) {
    if (!variations || variations.length === 0) return '';

    const sorted = variations.slice().sort(function (a, b) {
      const aVal = parseFloat(normalizeSizeKey((a.attributes[0] && a.attributes[0].value) || '0'));
      const bVal = parseFloat(normalizeSizeKey((b.attributes[0] && b.attributes[0].value) || '0'));
      return aVal - bVal;
    });

    const cards = sorted.map(function (v, i) {
      const raw      = (v.attributes[0] && v.attributes[0].value) || '';
      const sizeKey  = normalizeSizeKey(raw);
      const info     = PILL_INFO[sizeKey] || { sprays: '', label: '', badge: false };
      const bottleSrc = getBottleImage(sizeKey) || '';
      const priceStr = v.prices ? formatPrice(v.prices) : formatPrice(basePrices);
      const isFirst  = i === 0;

      const badgeHtml = info.badge
        ? '<span class="size-card__badge">Popular</span>'
        : '';

      return '<button' +
        ' class="size-card' + (isFirst ? ' size-card--active' : '') + '"' +
        ' data-variation-id="' + v.id + '"' +
        ' data-variation-name="' + sanitizeHtml((v.attributes[0] && v.attributes[0].name) || '') + '"' +
        ' data-variation-value="' + sanitizeHtml(raw) + '"' +
        ' data-size="' + sanitizeHtml(sizeKey) + '"' +
        ' data-bottle-src="' + sanitizeHtml(bottleSrc) + '"' +
        ' data-price="' + sanitizeHtml(priceStr) + '"' +
        ' data-price-raw="' + (v.prices ? v.prices.price : '') + '"' +
        ' data-price-minor="' + (v.prices ? (v.prices.currency_minor_unit ?? 2) : 2) + '"' +
        ' data-price-symbol="' + sanitizeHtml(v.prices ? (v.prices.currency_symbol || '$') : '$') + '"' +
        ' type="button"' +
        '>' +
        (bottleSrc ? '<img class="size-card__img" src="' + sanitizeHtml(bottleSrc) + '" alt="' + sanitizeHtml(sizeKey) + ' bottle" />' : '<div class="size-card__img-placeholder"></div>') +
        '<span class="size-card__label">' + sanitizeHtml(sizeKey.toUpperCase()) + '</span>' +
        (info.sprays ? '<span class="size-card__sub">' + sanitizeHtml(info.sprays) + '</span>' : '') +
        '<span class="size-card__price">' + sanitizeHtml(priceStr) + '</span>' +
        badgeHtml +
        '</button>';
    }).join('');

    return '<div class="size-selector">' +
      '<p class="size-selector__label">SELECT SIZE</p>' +
      '<div class="size-selector-grid">' + cards + '</div>' +
      '</div>';
  }

  // ── Pressurized toggle builder ──────────────────────────────────────
  function buildPressurizedToggle() {
    return '<div class="pressurized-toggle" id="pressurized-toggle" aria-hidden="true">' +
      '<div class="pressurized-toggle__inner">' +
        '<div class="pressurized-toggle__info">' +
          '<span class="pressurized-toggle__name">Pressurized Atomizer</span>' +
          '<span class="pressurized-toggle__sub">Stronger, consistent spray</span>' +
        '</div>' +
        '<div class="pressurized-toggle__right">' +
          '<span class="pressurized-toggle__price">+$1.00</span>' +
          '<button class="pressurized-toggle__btn" id="pressurized-toggle-btn" aria-pressed="false" type="button">' +
            '<span class="pressurized-toggle__track"><span class="pressurized-toggle__thumb-pill"></span></span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ── Scent toggle builder ───────────────────────────────────────────────
  function buildScentToggle(shortDescription) {
    if (!shortDescription) return '';

    const cleaned = shortDescription.replace(/^<p[^>]*>|<\/p>$/gi, '').trim();
    const parts = cleaned.split(/<br\s*\/?>/gi).map(p => p.trim()).filter(Boolean);

    if (parts.length === 0) return '';

    const rawNotes   = parts[0] || null;
    const rawBody    = parts[1] || null;
    const rawBestFor = parts.find(p => /^best for:/i.test(p)) || parts[2] || null;

    let notesHtml = '';
    if (rawNotes) {
      const pills = rawNotes.split(' · ').map(n =>
        '<span class="scent-note">' + sanitizeHtml(n.trim()) + '</span>'
      ).join('');
      notesHtml = '<div class="scent-toggle__section scent-toggle__section--notes">' + pills + '</div>';
    }

    let bodyHtml = '';
    if (rawBody && !/^best for:/i.test(rawBody)) {
      bodyHtml = '<div class="scent-toggle__section scent-toggle__section--body">' +
        '<p class="scent-toggle__desc">' + sanitizeHtml(rawBody) + '</p>' +
        '</div>';
    }

    let bestForHtml = '';
    if (rawBestFor) {
      const text = sanitizeHtml(rawBestFor.replace(/^best for:\s*/i, '').trim());
      bestForHtml = '<div class="scent-toggle__section scent-toggle__section--bestfor">' +
        '<p class="scent-toggle__bestfor-text">' +
          '<span class="scent-toggle__bestfor-label">Best for:</span>' + text +
        '</p>' +
        '</div>';
    }

    const sections = notesHtml + bodyHtml + bestForHtml;
    if (!sections) return '';

    return '<div class="scent-toggle" id="scent-toggle">' +
      '<button class="scent-toggle__trigger" id="scent-toggle-btn" type="button" ' +
        'aria-expanded="false" aria-controls="scent-toggle-body">' +
        '<span class="scent-toggle__trigger-label">What does this smell like?</span>' +
        '<span class="scent-toggle__chevron" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="scent-toggle__body" id="scent-toggle-body" role="region">' +
        sections +
      '</div>' +
    '</div>';
  }

  // ── Sync helpers ────────────────────────────────────────────────────
  function pulseCard(card) {
    card.classList.remove('size-card--pulse');
    // Force reflow to allow re-triggering the animation
    void card.offsetWidth;
    card.classList.add('size-card--pulse');
    setTimeout(() => card.classList.remove('size-card--pulse'), 200);
  }

  function setVariantImage(src, animate) {
    const varImg = document.getElementById('variant-image');
    if (!varImg || !src) return;
    if (animate) {
      varImg.classList.add('main-image--swap');
      setTimeout(() => {
        varImg.src = src;
        varImg.style.display = 'block';
        varImg.classList.remove('main-image--swap');
      }, 110);
    } else {
      varImg.src = src;
      varImg.style.display = 'block';
    }
  }

  function syncSizeCardActive(sizeKey) {
    const cards = document.querySelectorAll('.size-card');
    cards.forEach(function (c) {
      c.classList.toggle('size-card--active', c.dataset.size === sizeKey);
    });
  }

  // ── Render ──────────────────────────────────────────────────────────
  function renderProduct(product) {
    const images      = product.images || [];
    const prices      = product.prices || null;
    // Products with supportsPressurized: true in data, or treat all products as supporting it
    // (user says ~90% have it — show toggle for all 10ml/30ml; if a product doesn't support it,
    //  set supportsPressurized: false in WooCommerce custom field / product meta)
    const hasPressurized = product.supportsPressurized !== false;

    // Determine initial main image — prefer 10ml bottle as hero shot
    let initialBottleSrc = '';
    if (product.variations && product.variations.length > 0) {
      const sorted = product.variations.slice().sort(function (a, b) {
        return parseFloat(normalizeSizeKey((a.attributes[0] && a.attributes[0].value) || '0'))
             - parseFloat(normalizeSizeKey((b.attributes[0] && b.attributes[0].value) || '0'));
      });
      // Prefer 10ml as hero; fallback to smallest
      const heroVar = sorted.find(v => normalizeSizeKey((v.attributes[0] && v.attributes[0].value) || '') === '10ml') || sorted[0];
      initialBottleSrc = getBottleImage(normalizeSizeKey((heroVar.attributes[0] && heroVar.attributes[0].value) || '')) || '';
    }
    const mainImageSrc     = images[0]?.src || '';
    const initialVariantSrc = initialBottleSrc || '';

    const html = `
      <div class="product-breadcrumb">
        <a href="/collections.html" class="product-breadcrumb__link">← SHOP ALL</a>
      </div>

      <div class="product-layout">

        <!-- Gallery -->
        <div class="product-gallery">
          <div class="product-gallery__viewer">
            <div class="product-gallery__main">
              <img
                id="main-image"
                src="${sanitizeHtml(mainImageSrc)}"
                alt="${sanitizeHtml(product.name)}"
                style="${mainImageSrc ? '' : 'display:none;'}"
              />
              ${!mainImageSrc ? '<div class="product-gallery__empty">No image</div>' : ''}
            </div>
            <div class="product-gallery__variant">
              <img
                id="variant-image"
                src="${sanitizeHtml(initialVariantSrc)}"
                alt="Selected size"
                style="${initialVariantSrc ? '' : 'display:none;'}"
              />
              ${!initialVariantSrc ? '<div class="product-gallery__empty"></div>' : ''}
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="product-details">

          <h1 class="product-name">${sanitizeHtml(product.name)}</h1>

          <div id="product-price-display" class="product-price">${formatPrice(prices)}</div>

          ${buildScentToggle(product.short_description || '')}

          <div id="size-selector-mount"></div>

          ${hasPressurized ? buildPressurizedToggle() : ''}

          <div class="product-actions">
            <button
              id="add-to-cart-btn"
              class="btn-add-to-cart"
              disabled
              type="button"
            >Select a size</button>
          </div>

          <div class="product-trust">
            <div class="product-trust__item">
              <svg class="product-trust__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              <span class="product-trust__label">Satisfaction Guaranteed</span>
              <span class="product-trust__sub">Love it or we'll make it right</span>
            </div>
            <div class="product-trust__item">
              <svg class="product-trust__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              <span class="product-trust__label">100% Authentic</span>
              <span class="product-trust__sub">Authorized distributors only</span>
            </div>
            <div class="product-trust__item">
              <svg class="product-trust__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 8h14M5 8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
              </svg>
              <span class="product-trust__label">Ships in 24h</span>
              <span class="product-trust__sub">Careful, fast fulfillment</span>
            </div>
          </div>

        </div>
      </div>

      <section class="social-proof" aria-label="Customer comments from TikTok">
        <div class="social-proof__header">
          <svg class="social-proof__tiktok-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.78a4.85 4.85 0 0 1-1.07-.09z"/>
          </svg>
          <div class="social-proof__heading-group">
            <h2 class="social-proof__title">Straight from TikTok</h2>
            <p class="social-proof__sub">Real customers. Unfiltered.</p>
          </div>
        </div>
        <div class="swiper social-proof-swiper">
          <div class="swiper-wrapper">
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 170753.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 170923.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171149.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171252.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171346.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171415.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171648.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171655.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 171837.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 172342.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 172517.png" alt="Customer comment" loading="lazy" /></div>
            <div class="swiper-slide social-proof__slide"><img src="screenshots/comment social proof/Screenshot 2026-04-21 172541.png" alt="Customer comment" loading="lazy" /></div>
          </div>
          <div class="swiper-pagination social-proof__pagination"></div>
        </div>
      </section>
    `;

    container.innerHTML = html;
    loading.style.display = 'none';

    new Swiper('.social-proof-swiper', {
      slidesPerView: 1.25,
      spaceBetween: 12,
      loop: true,
      autoplay: { delay: 3000, pauseOnMouseEnter: true, disableOnInteraction: false },
      pagination: { el: '.social-proof__pagination', clickable: true },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 16 },
        1024: { slidesPerView: 3, spaceBetween: 20 },
      },
    });

    // ── Wire up interactions ─────────────────────────────────────────
    window._selectedVariationId   = null;
    window._selectedVariationAttr = null;
    window._selectedProductId     = product.id;
    window._selectedPrices        = null;
    window._selectedSizeKey       = null;
    window._pressurizedSelected   = false;

    const mount = document.getElementById('size-selector-mount');
    if (mount && product.variations && product.variations.length > 0) {
      mount.innerHTML = buildSizeCards(product.variations, prices);
    }

    // Size card clicks
    if (mount) {
      mount.querySelectorAll('.size-card').forEach(function (card) {
        card.addEventListener('click', function () {
          selectSizeCard(card, product, hasPressurized);
        });
      });

      // Auto-select the 10ml card as default hero, or first card
      const heroCard = mount.querySelector('.size-card[data-size="10ml"]') || mount.querySelector('.size-card');
      if (heroCard) selectSizeCard(heroCard, product, hasPressurized);
    }

    // Pressurized toggle
    if (hasPressurized) {
      const toggleBtn = document.getElementById('pressurized-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
          window._pressurizedSelected = !window._pressurizedSelected;
          toggleBtn.setAttribute('aria-pressed', String(window._pressurizedSelected));
          toggleBtn.classList.toggle('pressurized-toggle__btn--on', window._pressurizedSelected);

          const sizeKey = window._selectedSizeKey;
          const priceDisplay = document.getElementById('product-price-display');

          if (window._pressurizedSelected && sizeKey) {
            // Swap to pressurized bottle image
            const pressKey = sizeKey + '+';
            const pressSrc = getBottleImage(pressKey);
            if (pressSrc) setVariantImage(pressSrc, true);

            // Update price
            if (priceDisplay && window._selectedPrices) {
              priceDisplay.textContent = formatPrice(window._selectedPrices, PRESSURIZED_ADDON_PRICE_CENTS);
            }
          } else {
            // Revert to standard bottle
            const stdSrc = getBottleImage(sizeKey);
            if (stdSrc) setVariantImage(stdSrc, true);

            if (priceDisplay && window._selectedPrices) {
              priceDisplay.textContent = formatPrice(window._selectedPrices);
            }
          }
        });
      }
    }

    // Scent toggle
    const scentToggleBtn = document.getElementById('scent-toggle-btn');
    if (scentToggleBtn) {
      scentToggleBtn.addEventListener('click', function () {
        const toggle = document.getElementById('scent-toggle');
        if (!toggle) return;
        const isOpen = toggle.classList.toggle('is-open');
        scentToggleBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Add to cart
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (!window._selectedVariationId) return;
        addToCart(
          product.id,
          window._selectedVariationId,
          window._selectedVariationAttr,
          window._selectedPrices,
          window._pressurizedSelected
        );
      });
    }
  }

  function selectSizeCard(card, product, hasPressurized) {
    const mount = document.getElementById('size-selector-mount');

    // Update active state on cards
    if (mount) {
      mount.querySelectorAll('.size-card').forEach(c => c.classList.remove('size-card--active'));
    }
    card.classList.add('size-card--active');

    // Pulse the selected card
    pulseCard(card);

    const sizeKey   = card.dataset.size;
    const bottleSrc = card.dataset.bottleSrc;
    const priceStr  = card.dataset.price;

    // Swap variant image (only if pressurized toggle is off)
    if (!window._pressurizedSelected && bottleSrc) {
      setVariantImage(bottleSrc, true);
    }

    // Update price display
    const priceDisplay = document.getElementById('product-price-display');
    if (priceDisplay) {
      if (window._pressurizedSelected && SIZES_WITH_PRESSURIZED.has(sizeKey)) {
        // reconstruct prices from data attributes to recalculate with pressurized
        const rawPrice  = parseInt(card.dataset.priceRaw || '0', 10);
        const minor     = parseInt(card.dataset.priceMinor || '2', 10);
        const symbol    = card.dataset.priceSymbol || '$';
        const divisor   = Math.pow(10, minor);
        const total     = rawPrice + PRESSURIZED_ADDON_PRICE_CENTS;
        priceDisplay.textContent = symbol + (total / divisor).toFixed(minor);
      } else {
        priceDisplay.textContent = priceStr;
      }
    }

    // Store variation state
    window._selectedVariationId   = card.dataset.variationId;
    window._selectedVariationAttr = { name: card.dataset.variationName, value: card.dataset.variationValue };
    window._selectedSizeKey       = sizeKey;

    // Rebuild prices object for pressurized calculations
    window._selectedPrices = {
      currency_symbol: card.dataset.priceSymbol || '$',
      currency_minor_unit: parseInt(card.dataset.priceMinor || '2', 10),
      price: card.dataset.priceRaw || '0',
    };

    // Show/hide pressurized toggle
    if (hasPressurized) {
      const toggle = document.getElementById('pressurized-toggle');
      const toggleBtn = document.getElementById('pressurized-toggle-btn');
      const canPressurize = SIZES_WITH_PRESSURIZED.has(sizeKey);

      if (toggle) {
        toggle.classList.toggle('is-visible', canPressurize);
        toggle.setAttribute('aria-hidden', String(!canPressurize));
      }

      // Reset pressurized state when switching sizes
      if (!canPressurize && window._pressurizedSelected) {
        window._pressurizedSelected = false;
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-pressed', 'false');
          toggleBtn.classList.remove('pressurized-toggle__btn--on');
        }
        // Revert variant image to standard
        if (bottleSrc) setVariantImage(bottleSrc, true);
        if (priceDisplay) priceDisplay.textContent = priceStr;
      }
    }

    // Enable cart button with ring pulse on first activation
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      const wasDisabled = addBtn.disabled;
      addBtn.disabled = false;
      addBtn.textContent = 'Add to Cart';
      if (wasDisabled) {
        addBtn.classList.remove('btn-add-to-cart--just-enabled');
        void addBtn.offsetWidth;
        addBtn.classList.add('btn-add-to-cart--just-enabled');
        setTimeout(() => addBtn.classList.remove('btn-add-to-cart--just-enabled'), 500);
      }
    }
  }

  function showError() {
    container.innerHTML = '';
    loading.style.display = 'none';
    error.style.display = 'block';
  }

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Allow demo mode override — product-demo.html sets window.DEMO_PRODUCT
    if (window.DEMO_PRODUCT) {
      renderProduct(window.DEMO_PRODUCT);
      return;
    }

    const slug = getSlugFromUrl();
    if (!slug) {
      error.textContent = 'No product specified';
      showError();
      return;
    }

    // Fetch nonce in parallel with product data
    initNonce();
    fetchProduct(slug);
  });

})();
