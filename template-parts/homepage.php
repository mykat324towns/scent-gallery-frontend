<?php
/**
 * Homepage Template
 * This template displays the Scent Gallery homepage with hero, featured products, and CTAs
 */
?>

<!-- Announcement Bar -->
<div class="announcement-bar" id="announcement-bar" role="banner" aria-label="Promotional announcement">
  <div class="container announcement-bar__inner">
    <p class="announcement-bar__text">
      Use code <strong>FIRST10</strong> for 10% off your first order
    </p>
    <button class="announcement-bar__dismiss" aria-label="Dismiss announcement">×</button>
  </div>
</div>

<!-- Navigation -->
<nav class="nav" role="navigation" aria-label="Main navigation">
  <div class="container nav__inner">
    <ul class="nav__links-left" role="list">
      <li><a href="<?php echo esc_url(get_shop_page_url()); ?>" class="nav__link">Shop</a></li>
      <li><a href="#how-it-works" class="nav__link">How It Works</a></li>
    </ul>
    <button class="nav__hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer">
      <span></span><span></span><span></span>
    </button>
    <a href="<?php echo home_url(); ?>" class="nav__logo" aria-label="Scent Gallery home">
      <?php bloginfo('name'); ?>
    </a>
    <ul class="nav__links-right" role="list">
      <li>
        <button class="nav__search" aria-label="Search fragrances">
          <svg class="nav__search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </li>
      <li>
        <a href="<?php echo wc_get_cart_url(); ?>" class="nav__cart" aria-label="Cart (<?php echo WC()->cart->get_cart_contents_count(); ?> items)">
          <svg class="nav__cart-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </a>
      </li>
    </ul>
  </div>
</nav>

<!-- Mobile Drawer -->
<div class="nav__drawer" id="nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
  <div class="nav__drawer-overlay"></div>
  <div class="nav__drawer-panel">
    <button class="nav__drawer-close" aria-label="Close menu">×</button>
    <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="nav__drawer-link">Shop</a>
    <a href="#how-it-works" class="nav__drawer-link">How It Works</a>
    <a href="#" class="nav__drawer-link">About</a>
  </div>
</div>

<!-- Hero Section -->
<section class="hero" aria-label="Hero" id="hero">
  <div class="hero__sidebar" aria-hidden="true">
    <span class="hero__sidebar-text">Luxury Decants · Try Before You Commit</span>
  </div>
  <div class="container hero__inner">
    <div class="hero__content">
      <span class="hero__overline">Fragrance Decants</span>
      <h1 class="hero__headline">Try the hype.<br>Keep what hits.</h1>
      <p class="hero__sub">Stop putting all your money into one bottle. Try everything on your list — from <span class="hero__price-anchor">$4</span>.</p>
      <div class="hero__proof">
        <span class="hero__proof-num">846</span>
        <span class="hero__proof-label">orders packed</span>
      </div>
      <div class="hero__actions">
        <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="btn-primary">Build Your Collection</a>
        <a href="#how-it-works" class="btn-ghost">See how it works →</a>
      </div>
      <div class="hero__trust" aria-label="Trust signals">
        <span class="hero__trust-item">100% authentic</span>
        <span class="hero__trust-sep">·</span>
        <span class="hero__trust-item">Ships in 1–2 days</span>
        <span class="hero__trust-sep">·</span>
        <span class="hero__trust-item">Hand packed</span>
      </div>
    </div>
    <div class="hero__media">
      <video
        class="hero__video"
        src="<?php echo esc_url(scent_gallery_image('img/other/scent gallery hero video v1.1.mp4')); ?>"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        fetchpriority="high"
        aria-label="Scent Gallery order packing video"
      ></video>
    </div>
  </div>
</section>

<!-- Best Sellers Section -->
<section class="collection" aria-label="Best sellers" id="collection">
  <div class="container">
    <header class="collection__header">
      <h2 class="collection__title">Best Sellers</h2>
      <a href="<?php echo esc_url(get_shop_page_url()); ?>" class="collection__view-all">View All →</a>
    </header>
    <p class="collection__sub">The most-explored fragrances in the rotation. Pick one. Try them all.</p>

    <div class="carousel-track collection__swiper">
      <div class="swiper">
        <div class="swiper-wrapper" id="bestsellers-wrapper">
          <?php
          $bestsellers = scent_gallery_get_bestsellers(3);
          if ($bestsellers->have_posts()) {
            while ($bestsellers->have_posts()) {
              $bestsellers->the_post();
              wc_get_template_part('content', 'product');
            }
            wp_reset_postdata();
          }
          ?>
        </div>
        <div class="swiper-scrollbar"></div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer" role="contentinfo">
  <div class="container footer__inner">
    <div class="footer__content">
      <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>
    </div>
  </div>
</footer>
