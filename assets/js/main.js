// Scent Gallery — Main Theme JS

// API Configuration (shared across all pages)
window.SG_CONFIG = window.SG_CONFIG || {
  apiBase: '/api',
  shopUrl: 'https://scentgallery.shop',
};

function getApiUrl(path) {
  return window.SG_CONFIG.apiBase + path;
}

(function () {
  'use strict';

  // ── Nav: sticky + scroll state ──────────────────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile Drawer ───────────────────────────────────────────────
  const hamburger = document.querySelector('.nav__hamburger');
  const drawer    = document.querySelector('.nav__drawer');

  const openDrawer = () => {
    drawer.classList.add('is-open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });

    const overlay = drawer.querySelector('.nav__drawer-overlay');
    const close   = drawer.querySelector('.nav__drawer-close');
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (close)   close.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  // ── Announcement Bar dismiss ─────────────────────────────────────
  const bar     = document.getElementById('announcement-bar');
  const dismiss = document.querySelector('.announcement-bar__dismiss');
  if (bar && dismiss) {
    dismiss.addEventListener('click', () => bar.classList.add('is-hidden'));
  }

  // ── Scroll reveal ───────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 99999px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // Product card stagger reveal
    document.querySelectorAll('.collection__grid .product-card').forEach((card, i) => {
      card.classList.add('reveal');
      card.style.transitionDelay = `${i * 50}ms`;
      revealObs.observe(card);
    });

    // Testimonial cards
    document.querySelectorAll('.testimonial-card').forEach(card => revealObs.observe(card));
  }

  // ── Size Pill interaction ────────────────────────────────────────
  const PILL_INFO = {
    '1ml':   { sprays: '~20 sprays',              label: 'Quick Test',               badge: false },
    '2ml':   { sprays: '~38 sprays',              label: 'Try It',                   badge: false },
    '5ml':   { sprays: '~90 sprays',              label: '~3 weeks daily wear',      badge: false },
    '10ml':  { sprays: '~180 sprays',             label: 'Most Popular',             badge: true  },
    '10ml+': { sprays: '~135 pressurized sprays', label: 'Most Popular \u2014 Upgraded', badge: true  },
    '30ml':  { sprays: '~550 sprays',             label: 'Best Value',               badge: false },
    '30ml+': { sprays: '~400 pressurized sprays', label: 'Best Value + Pressurized', badge: false },
  };

  function renderPillInfo(infoEl, sizeKey) {
    if (!infoEl) return;
    const info = PILL_INFO[sizeKey];
    if (!info) { infoEl.innerHTML = ''; return; }
    infoEl.innerHTML = info.badge
      ? `<span class="pill-sprays">${info.sprays}</span> \u00b7 <span class="pill-badge">${info.label}</span>`
      : `<span class="pill-sprays">${info.sprays}</span> \u00b7 <span class="pill-label-text">${info.label}</span>`;
  }

  document.querySelectorAll('.product-card__sizes').forEach(container => {
    const cardInfo = container.closest('.product-card__info');
    const infoEl   = cardInfo ? cardInfo.querySelector('.pill-info') : null;
    const priceEl  = cardInfo ? cardInfo.querySelector('.product-card__price') : null;

    container.querySelectorAll('.size-pill').forEach(pill => {
      if (pill.classList.contains('size-pill--active')) renderPillInfo(infoEl, pill.dataset.size);

      pill.addEventListener('click', () => {
        container.querySelectorAll('.size-pill').forEach(p => p.classList.remove('size-pill--active'));
        pill.classList.add('size-pill--active');

        // Spring animation
        pill.classList.remove('just-selected');
        void pill.offsetWidth;
        pill.classList.add('just-selected');
        pill.addEventListener('animationend', () => pill.classList.remove('just-selected'), { once: true });

        if (priceEl && pill.dataset.price) {
          priceEl.textContent = '$' + parseFloat(pill.dataset.price).toFixed(2);
        }
        renderPillInfo(infoEl, pill.dataset.size);
      });
    });
  });

  // ── Hero order count tick ────────────────────────────────────────
  const countEl = document.getElementById('hero-order-count');
  if (countEl && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        setTimeout(() => {
          countEl.classList.add('is-ticking');
          countEl.addEventListener('animationend', () => {
            countEl.textContent = String(parseInt(countEl.textContent, 10) + 1);
            countEl.classList.remove('is-ticking');
          }, { once: true });
        }, 800);
      });
    }, { threshold: 0.5 }).observe(countEl);
  }

  // ── Add to Rotation: tactile feedback ───────────────────────────
  const cartIcon = document.querySelector('.nav__cart');
  document.querySelectorAll('.product-card__cta').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-added')) return;
      const original = btn.textContent;
      btn.classList.add('is-added');
      btn.textContent = 'Added \u2713';
      if (cartIcon) {
        cartIcon.classList.add('cart-bump');
        cartIcon.addEventListener('animationend', () => cartIcon.classList.remove('cart-bump'), { once: true });
      }
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('is-added');
      }, 1800);
    });
  });

  // ── Product card linking to product page ───────────────────────
  document.querySelectorAll('[data-product-slug]').forEach(card => {
    const slug = card.dataset.productSlug;
    const link = card.querySelector('.product-card__link') || card;

    // Make product name clickable if it exists
    const nameEl = card.querySelector('.product-card__name');
    if (nameEl && !nameEl.querySelector('a')) {
      const a = document.createElement('a');
      a.href = '/product.html?slug=' + encodeURIComponent(slug);
      a.style.textDecoration = 'none';
      a.style.color = 'inherit';
      a.textContent = nameEl.textContent;
      nameEl.textContent = '';
      nameEl.appendChild(a);
    }
  });

  // ── Swiper carousels (mobile only) ──────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof Swiper === 'undefined') return;

    const initCarousel = (swiperSelector, scrollbarId, thumbId) => {
      const wrap      = document.querySelector(swiperSelector);
      const scrollbar = document.getElementById(scrollbarId);
      const thumb     = document.getElementById(thumbId);
      if (!wrap || !scrollbar || !thumb) return;

      const swiper = new Swiper(wrap.querySelector('.swiper'), {
        spaceBetween: 14,
        slidesPerView: 2.5,
        freeMode: true,
        grabCursor: true,
        simulateTouch: true,
        touchRatio: 1,
        touchAngle: 45,
        resistanceRatio: 0.85,
      });

      const sync = () => {
        const tw = Math.max(scrollbar.offsetWidth * Math.max(0.15, 1 / swiper.slides.length), 24);
        thumb.style.width = tw + 'px';
        thumb.style.left  = swiper.progress * (scrollbar.offsetWidth - tw) + 'px';
      };
      swiper.on('progress', sync);
      swiper.on('resize', sync);
      window.addEventListener('resize', sync, { passive: true });

      let dragging = false;
      const dragTo = (clientX) => {
        const rect  = scrollbar.getBoundingClientRect();
        swiper.setProgress(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
      };
      thumb.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
      thumb.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
      document.addEventListener('mousemove', (e) => { if (dragging) dragTo(e.clientX); });
      document.addEventListener('touchmove', (e) => { if (dragging) dragTo(e.touches[0].clientX); }, { passive: true });
      document.addEventListener('mouseup',  () => { dragging = false; });
      document.addEventListener('touchend', () => { dragging = false; });
      scrollbar.addEventListener('click', (e) => dragTo(e.clientX));

      sync();
    };

    const initAll = () => {
      if (window.innerWidth <= 768) {
        initCarousel('.collection__swiper',     'bestsellers-scrollbar', 'bestsellers-thumb');
        initCarousel('.latest-pickups__swiper', 'latest-scrollbar',      'latest-thumb');
      }
    };

    initAll();
    window.addEventListener('resize', initAll, { passive: true });
  });

})();
