<?php
/**
 * Scent Gallery Theme Functions
 */

add_action('after_setup_theme', function() {
    add_theme_support('woocommerce');
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style'));
});

add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('scent-gallery-style', get_stylesheet_uri());
});

require_once get_template_directory() . '/inc/woocommerce.php';
require_once get_template_directory() . '/inc/template-tags.php';

function scent_gallery_homepage() {
?>
<style>
:root {
  --color-bg: #FFFFFF;
  --color-accent: #1C4032;
  --color-on-surface: #141414;
  --color-on-surface-muted: #6B6B6B;
  --color-primary: #1C4032;
  --color-primary-hover: #2C6050;
  --color-surface: #F7F4F0;
  --color-border: rgba(0,0,0,0.06);
  --color-bg-alt: #F9F7F5;
  --color-overlay: rgba(20, 20, 20, 0.60);
  --font-display: 'Bodoni Moda', Georgia, serif;
  --font-body: 'Figtree', system-ui, sans-serif;
  --text-display: clamp(52px, 6vw, 80px);
  --text-body-lg: 18px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-label: 11px;
  --text-h2: 36px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  --radius-md: 7px;
  --radius-lg: 12px;
  --shadow-raised: 0 2px 12px rgba(0,0,0,0.07);
  --duration-normal: 250ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --site-max-width: 1360px;
  --padding-x-mobile: 20px;
  --padding-x-tablet: 40px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-body); font-size: var(--text-body); line-height: 1.6; color: var(--color-on-surface); background: var(--color-bg); }
img, video { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { font-family: var(--font-body); cursor: pointer; border: none; background: none; }
ul { list-style: none; }

.container { width: 100%; max-width: var(--site-max-width); margin: 0 auto; padding: 0 var(--padding-x-mobile); }
@media (min-width: 768px) { .container { padding: 0 var(--padding-x-tablet); } }

.announcement-bar { background: var(--color-accent); color: #FFF; height: 36px; display: flex; align-items: center; justify-content: center; position: relative; }
.announcement-bar.is-hidden { display: none; }
.announcement-bar__text { font-size: 13px; font-weight: 500; text-align: center; }
.announcement-bar__dismiss { position: absolute; right: 20px; width: 30px; height: 30px; color: rgba(255,255,255,0.7); font-size: 18px; }
.announcement-bar__dismiss:hover { color: #FFF; }

.nav { position: sticky; top: 0; z-index: 90; width: 100%; height: 64px; display: flex; align-items: center; background: transparent; transition: background-color var(--duration-normal); }
.nav.is-scrolled { background: rgba(20,20,20,0.92); }
.nav__inner { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.nav__links-left, .nav__links-right { display: flex; gap: 32px; }
.nav__link { font-size: var(--text-body-sm); font-weight: 500; }
.nav__logo { font-size: 14px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; }
.nav__cart { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; }
.nav__cart-icon { width: 20px; height: 20px; stroke: currentColor; fill: none; }
.nav__hamburger { display: none; width: 44px; height: 44px; flex-direction: column; justify-content: center; gap: 5px; }
.nav__hamburger span { width: 22px; height: 1.5px; background: var(--color-on-surface); }
.nav__drawer { position: fixed; inset: 0; z-index: 200; display: none; }
.nav__drawer.is-open { display: flex; }
.nav__drawer-overlay { position: absolute; inset: 0; background: var(--color-overlay); }
.nav__drawer-panel { position: absolute; top: 0; right: 0; width: 300px; height: 100%; background: var(--color-surface); display: flex; flex-direction: column; padding: var(--space-8); gap: var(--space-6); }
.nav__drawer-close { align-self: flex-end; width: 44px; height: 44px; font-size: 22px; }
.nav__drawer-link { font-size: 18px; font-weight: 500; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }

.hero { min-height: 80vh; display: flex; align-items: center; padding: var(--space-32) 0 var(--space-24); }
.hero__inner { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-16); align-items: center; width: 100%; }
.hero__content { display: flex; flex-direction: column; gap: var(--space-6); }
.hero__overline { font-size: var(--text-label); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-accent); }
.hero__headline { font-family: var(--font-display); font-size: var(--text-display); font-weight: 400; line-height: 1; color: var(--color-on-surface); }
.hero__sub { font-size: var(--text-body-lg); color: var(--color-on-surface-muted); }
.hero__proof { display: flex; gap: var(--space-2); margin: var(--space-4) 0; }
.hero__proof-num { font-size: 32px; font-weight: 700; color: var(--color-accent); }
.hero__proof-label { font-size: var(--text-body-sm); color: var(--color-on-surface-muted); }
.hero__actions { display: flex; gap: var(--space-6); margin: var(--space-4) 0; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; font-size: var(--text-body-sm); font-weight: 600; color: white; background: var(--color-primary); border-radius: var(--radius-md); min-height: 52px; padding: 14px 28px; transition: all var(--duration-normal); }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-2px); }
.btn-ghost { font-size: var(--text-body-sm); font-weight: 600; color: var(--color-on-surface); background: none; }
.hero__trust { font-size: var(--text-body-sm); color: var(--color-on-surface-muted); }
.hero__media { width: 100%; }
.hero__video { width: 100%; border-radius: var(--radius-lg); }

.collection { padding: var(--space-24) 0; }
.collection__header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-8); }
.collection__title { font-family: var(--font-display); font-size: var(--text-h2); font-weight: 600; }
.collection__view-all { font-size: var(--text-body-sm); color: var(--color-accent); }
.collection__sub { color: var(--color-on-surface-muted); margin-bottom: var(--space-8); }

.footer { background: var(--color-bg-alt); padding: var(--space-20) 0; text-align: center; }
.footer__content { font-size: var(--text-body-sm); color: var(--color-on-surface-muted); }

@media (max-width: 900px) {
  .hero__inner { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .nav__links-left, .nav__links-right { display: none; }
  .nav__hamburger { display: flex; }
}
</style>

<div class="announcement-bar" id="announcement-bar">
  <div class="container">
    <p class="announcement-bar__text">Use code <strong>FIRST10</strong> for 10% off your first order</p>
    <button class="announcement-bar__dismiss">×</button>
  </div>
</div>

<nav class="nav">
  <div class="container nav__inner">
    <ul class="nav__links-left">
      <li><a href="<?php echo esc_url(get_shop_page_url()); ?>" class="nav__link">Shop</a></li>
      <li><a href="#" class="nav__link">How It Works</a></li>
    </ul>
    <button class="nav__hamburger"><span></span><span></span><span></span></button>
    <a href="<?php echo home_url(); ?>" class="nav__logo">Scent Gallery</a>
    <ul class="nav__links-right">
      <li><a href="<?php echo wc_get_cart_url(); ?>" class="nav__cart"><svg class="nav__cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></a></li>
    </ul>
  </div>
</nav>

<div class="nav__drawer" id="nav-drawer">
  <div class="nav__drawer-overlay"></div>
  <div class="nav__drawer-panel">
    <button class="nav__drawer-close">×</button>
    <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="nav__drawer-link">Shop</a>
    <a href="#" class="nav__drawer-link">How It Works</a>
  </div>
</div>

<section class="hero">
  <div class="container hero__inner">
    <div class="hero__content">
      <span class="hero__overline">Fragrance Decants</span>
      <h1 class="hero__headline">Try the hype.<br>Keep what hits.</h1>
      <p class="hero__sub">Stop putting all your money into one bottle. Try everything on your list — from <strong style="color: var(--color-accent);">$4</strong>.</p>
      <div class="hero__proof">
        <span class="hero__proof-num">846</span>
        <span class="hero__proof-label">orders packed</span>
      </div>
      <div class="hero__actions">
        <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="btn-primary">Build Your Collection</a>
        <a href="#" class="btn-ghost">See how it works →</a>
      </div>
      <div class="hero__trust">100% authentic · Ships in 1–2 days · Hand packed</div>
    </div>
    <div class="hero__media">
      <video class="hero__video" autoplay muted loop playsinline></video>
    </div>
  </div>
</section>

<section class="collection">
  <div class="container">
    <header class="collection__header">
      <h2 class="collection__title">Best Sellers</h2>
      <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="collection__view-all">View All →</a>
    </header>
    <p class="collection__sub">The most-explored fragrances in the rotation.</p>
  </div>
</section>

<footer class="footer">
  <div class="container footer__content">
    <p>&copy; <?php echo date('Y'); ?> Scent Gallery. All rights reserved.</p>
  </div>
</footer>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.nav__hamburger');
  const drawer = document.querySelector('#nav-drawer');
  const overlay = drawer?.querySelector('.nav__drawer-overlay');
  const close = drawer?.querySelector('.nav__drawer-close');
  const nav = document.querySelector('.nav');
  const dismiss = document.querySelector('.announcement-bar__dismiss');

  if (window) {
    window.addEventListener('scroll', () => {
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 10);
    });
  }

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      drawer.classList.toggle('is-open');
    });
  }

  if (overlay) overlay.addEventListener('click', () => {
    drawer.classList.remove('is-open');
  });

  if (close) close.addEventListener('click', () => {
    drawer.classList.remove('is-open');
  });

  if (dismiss) dismiss.addEventListener('click', () => {
    const bar = document.getElementById('announcement-bar');
    if (bar) bar.classList.add('is-hidden');
  });
});
</script>
<?php
}

add_shortcode('scent-gallery', 'scent_gallery_homepage');

