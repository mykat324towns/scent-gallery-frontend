/**
 * Scent Gallery — Homepage Shortcode
 * Usage: [sg_homepage]
 *
 * Code Snippets: PHP Snippet → Run Everywhere
 * Do NOT include opening <?php tag — Code Snippets adds it automatically.
 */

add_shortcode('sg_homepage', 'sg_hp_render');

function sg_hp_render() {
    if (!function_exists('wc_get_products')) {
        return '<p>WooCommerce is not active.</p>';
    }

    wp_enqueue_style(
        'sg-hp-fonts',
        'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,300;1,6..96,400&family=Figtree:wght@400;500;600;700&display=swap',
        [],
        null
    );

    $products = wc_get_products([
        'limit'      => 6,
        'orderby'    => 'total_sales',
        'order'      => 'DESC',
        'status'     => 'publish',
        'visibility' => 'visible',
    ]);

    // Hero: first 4 product images
    $hero_imgs = '';
    foreach (array_slice($products, 0, 4) as $p) {
        $img_id  = $p->get_image_id();
        $img_url = $img_id ? wp_get_attachment_image_url($img_id, 'woocommerce_single') : '';
        if ($img_url) {
            $hero_imgs .= '<img class="sg-hero__bottle" src="' . esc_url($img_url) . '" alt="' . esc_attr($p->get_name()) . '" loading="eager">';
        }
    }

    // Product cards
    $cards_html = '';
    foreach ($products as $product) {
        $cards_html .= sg_hp_product_card($product);
    }

    $shop_url = get_permalink(wc_get_page_id('shop'));

    ob_start();
    echo sg_hp_styles();
    ?>
    <div id="sg-hp">

    <!-- Hero -->
    <section class="sg-hero" id="sg-hero">
      <div class="sg-container sg-hero__inner">
        <div class="sg-hero__content">
          <span class="sg-hero__overline">Fragrance Decants</span>
          <h1 class="sg-hero__headline">Try before<br>you commit.</h1>
          <p class="sg-hero__sub">Sample the world&rsquo;s best fragrances from $4. No full-bottle risk &mdash; just the scent.</p>
          <div class="sg-hero__proof">
            <span class="sg-hero__proof-num">1,200+</span>
            <span class="sg-hero__proof-label">orders packed &amp; counting</span>
          </div>
          <div class="sg-hero__actions">
            <a href="#sg-collection" class="sg-btn-primary">Shop the Collection</a>
            <a href="#sg-how" class="sg-btn-ghost">How it works &rarr;</a>
          </div>
        </div>
        <div class="sg-hero__visual" aria-hidden="true">
          <div class="sg-hero__bottles">
            <?php echo $hero_imgs; ?>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="sg-collection" id="sg-collection">
      <div class="sg-container">
        <header class="sg-collection__header">
          <h2 class="sg-collection__title">Best Sellers</h2>
          <a href="<?php echo esc_url($shop_url); ?>" class="sg-collection__view-all">View All &rarr;</a>
        </header>
        <div class="sg-collection__grid">
          <?php echo $cards_html; ?>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="sg-how" id="sg-how">
      <div class="sg-container">
        <header class="sg-how__header sg-reveal">
          <h2 class="sg-how__title">How it works.</h2>
          <p class="sg-how__sub">Three steps. No risk. No regrets.</p>
        </header>
        <div class="sg-how__grid">
          <div class="sg-hiw-step sg-reveal">
            <span class="sg-hiw-step__num">01</span>
            <h3 class="sg-hiw-step__title">Pick your scent</h3>
            <p class="sg-hiw-step__sub">Browse by fragrance name &mdash; Creed, MFK, Dior, Tom Ford, and more. Find what&rsquo;s trending or search what you already know you want.</p>
          </div>
          <div class="sg-hiw-step sg-reveal" style="transition-delay:80ms">
            <span class="sg-hiw-step__num">02</span>
            <h3 class="sg-hiw-step__title">Choose your size</h3>
            <p class="sg-hiw-step__sub">From 1ml testers to 30ml supplies. Pick what fits your budget and how committed you&rsquo;re feeling. You can always go bigger next time.</p>
          </div>
          <div class="sg-hiw-step sg-reveal" style="transition-delay:160ms">
            <span class="sg-hiw-step__num">03</span>
            <h3 class="sg-hiw-step__title">Try. Then decide.</h3>
            <p class="sg-hiw-step__sub">Love it? Go full bottle knowing exactly what you&rsquo;re getting. Didn&rsquo;t connect? No regrets &mdash; you spent $4, not $200.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="sg-testimonials" id="sg-testimonials">
      <div class="sg-container">
        <header class="sg-testimonials__header sg-reveal">
          <span class="sg-testimonials__overline">Reviews</span>
          <h2 class="sg-testimonials__title">What collectors are saying</h2>
        </header>
        <div class="sg-testimonials__grid">
          <article class="sg-testimonial-card sg-reveal">
            <span class="sg-testimonial-card__quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="sg-testimonial-card__stars"><?php echo str_repeat(sg_hp_star(), 5); ?></div>
            <blockquote class="sg-testimonial-card__quote">Ordered the 10ml of Sauvage before committing to the full bottle. Saved me $120 on a fragrance I would have hated after a week. This is the way.</blockquote>
            <footer class="sg-testimonial-card__attribution">
              <div class="sg-testimonial-card__avatar">MR</div>
              <div>Marcus R.</div>
            </footer>
          </article>
          <article class="sg-testimonial-card sg-reveal" style="transition-delay:80ms">
            <span class="sg-testimonial-card__quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="sg-testimonial-card__stars"><?php echo str_repeat(sg_hp_star(), 5); ?></div>
            <blockquote class="sg-testimonial-card__quote">I&rsquo;ve been into fragrance for years. Scent Gallery is the fastest way to rotate and discover &mdash; no filler, just the good stuff. BR540 at 2ml is the perfect tester size.</blockquote>
            <footer class="sg-testimonial-card__attribution">
              <div class="sg-testimonial-card__avatar">AK</div>
              <div>Alex K.</div>
            </footer>
          </article>
          <article class="sg-testimonial-card sg-reveal" style="transition-delay:160ms">
            <span class="sg-testimonial-card__quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="sg-testimonial-card__stars"><?php echo str_repeat(sg_hp_star(), 5); ?></div>
            <blockquote class="sg-testimonial-card__quote">Shipping was fast, quality is consistent. Got Aventus 2ml and Tobacco Vanille 1ml in the same order &mdash; both perfect. Way cheaper than blind buying on eBay.</blockquote>
            <footer class="sg-testimonial-card__attribution">
              <div class="sg-testimonial-card__avatar">JL</div>
              <div>Jordan L.</div>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="sg-cta">
      <div class="sg-container">
        <div class="sg-cta__inner sg-reveal">
          <span class="sg-cta__overline">Start Sampling</span>
          <h2 class="sg-cta__title">Your next favorite scent is $4 away.</h2>
          <p class="sg-cta__body">No subscriptions. No minimums. No regrets. Just the scent you&rsquo;ve been wanting to try.</p>
          <div class="sg-cta__actions">
            <a href="<?php echo esc_url($shop_url); ?>" class="sg-btn-primary--white">Shop the Collection</a>
            <a href="#sg-how" class="sg-btn-ghost--white">How it works &rarr;</a>
          </div>
        </div>
      </div>
    </section>

    </div><!-- #sg-hp -->

    <script>
    (function(){
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.classList.add('sg-reveal--visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px 99999px 0px' });

      document.querySelectorAll('#sg-hp .sg-reveal').forEach(function(el) { obs.observe(el); });

      document.querySelectorAll('#sg-hp .sg-collection__grid .sg-product-card').forEach(function(card, i) {
        card.classList.add('sg-reveal');
        card.style.transitionDelay = (i * 50) + 'ms';
        obs.observe(card);
      });

      document.querySelectorAll('#sg-hp .sg-product-card__sizes').forEach(function(container) {
        container.querySelectorAll('.sg-size-pill').forEach(function(pill) {
          pill.addEventListener('click', function() {
            container.querySelectorAll('.sg-size-pill').forEach(function(p) { p.classList.remove('sg-size-pill--active'); });
            pill.classList.add('sg-size-pill--active');
            var price = parseFloat(pill.dataset.price).toFixed(2);
            container.closest('.sg-product-card').querySelector('.sg-product-card__price').textContent = '$' + price;
          });
        });
      });
    })();
    </script>
    <?php
    return ob_get_clean();
}

// ── Product Card ────────────────────────────────────────────────────────────
function sg_hp_product_card($product) {
    // Brand: try registered attribute first, then parse from name
    $brand = $product->get_attribute('brand')
          ?: $product->get_attribute('pa_brand')
          ?: $product->get_attribute('Brand')
          ?: '';

    $display_name = $product->get_name();

    if (!$brand && strpos($display_name, ' by ') !== false) {
        $parts        = explode(' by ', $display_name);
        $display_name = trim($parts[0]);
        $brand        = trim(end($parts));
    }

    $permalink = get_permalink($product->get_id());
    $img_id    = $product->get_image_id();
    $img_url   = $img_id
        ? wp_get_attachment_image_url($img_id, 'woocommerce_single')
        : wc_placeholder_img_src('woocommerce_single');

    $rating       = (float) $product->get_average_rating();
    $review_count = (int)   $product->get_review_count();

    // Badge from featured flag, sale, or product tags
    $badge = '';
    if ($product->is_featured()) {
        $badge = 'Best Seller';
    } elseif ($product->is_on_sale()) {
        $badge = 'Sale';
    } else {
        $tags = wp_get_post_terms($product->get_id(), 'product_tag', ['fields' => 'names']);
        if (!is_wp_error($tags) && !empty($tags)) {
            $lower = array_map('strtolower', $tags);
            if (in_array('trending', $lower, true))     $badge = 'Trending';
            elseif (in_array('popular', $lower, true))  $badge = 'Popular';
            elseif (in_array('new', $lower, true))      $badge = 'New';
            elseif (in_array('fan fave', $lower, true)) $badge = 'Fan Fave';
        }
    }

    // Variations: extract size + price from each variation
    $variations  = [];
    $first_price = '';

    if ($product->is_type('variable')) {
        foreach ($product->get_children() as $var_id) {
            $variation = wc_get_product($var_id);
            if (!$variation || !$variation->is_purchasable() || !$variation->is_in_stock()) {
                continue;
            }
            // Try the most common size attribute slugs
            $size = $variation->get_attribute('pa_size')
                 ?: $variation->get_attribute('size')
                 ?: $variation->get_attribute('pa_volume')
                 ?: $variation->get_attribute('volume')
                 ?: '';
            $price = $variation->get_price();
            if (!$size || $price === '') {
                continue;
            }
            $variations[] = [
                'id'    => $var_id,
                'size'  => $size,
                'price' => (float) $price,
            ];
        }
        usort($variations, function($a, $b) {
            return $a['price'] < $b['price'] ? -1 : 1;
        });
        if (!empty($variations)) {
            $first_price = '$' . number_format($variations[0]['price'], 2);
        }
    } else {
        $first_price = '$' . number_format((float) $product->get_price(), 2);
    }

    // Size pills HTML
    $pills_html   = '';
    $first_active = true;
    foreach ($variations as $v) {
        $active = $first_active ? ' sg-size-pill--active' : '';
        $pills_html  .= '<button class="sg-size-pill' . $active . '" data-price="' . esc_attr($v['price']) . '">'
                      . esc_html($v['size']) . '</button>';
        $first_active = false;
    }

    // Stars HTML
    $stars_html = sg_hp_stars($rating, $review_count);

    // Displayed price (first variation or product price)
    $active_price = !empty($variations)
        ? '$' . number_format($variations[0]['price'], 2)
        : $first_price;

    // CTA: variable products → product page; simple → product page (WC standard)
    $cta_label = $product->is_type('variable') ? 'View Options' : 'Add to Cart';
    $cta_html  = '<a href="' . esc_url($permalink) . '" class="sg-product-card__cta">' . $cta_label . '</a>';

    $badge_html = $badge
        ? '<span class="sg-product-card__badge">' . esc_html($badge) . '</span>'
        : '';
    $brand_html = $brand
        ? '<p class="sg-product-card__brand">' . esc_html($brand) . '</p>'
        : '';
    $sizes_html = $pills_html
        ? '<div class="sg-product-card__sizes">' . $pills_html . '</div>'
        : '';

    return '
    <article class="sg-product-card">
      <a href="' . esc_url($permalink) . '" class="sg-product-card__image-link">
        <div class="sg-product-card__image-wrap">
          <img class="sg-product-card__image" src="' . esc_url($img_url) . '" alt="' . esc_attr($display_name) . '" loading="lazy" width="400" height="533">
          ' . $badge_html . '
        </div>
      </a>
      <div class="sg-product-card__info">
        ' . $brand_html . '
        <h3 class="sg-product-card__name">
          <a href="' . esc_url($permalink) . '">' . esc_html($display_name) . '</a>
        </h3>
        ' . $stars_html . '
        ' . $sizes_html . '
        <p class="sg-product-card__price">' . esc_html($active_price) . '</p>
        ' . $cta_html . '
      </div>
    </article>';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function sg_hp_star($empty = false) {
    $cls = $empty ? 'sg-star sg-star--empty' : 'sg-star';
    return '<svg class="' . $cls . '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
}

function sg_hp_stars($rating, $count) {
    $full  = (int) floor($rating);
    $empty = max(0, 5 - $full);
    $label = esc_attr($rating . ' stars');
    if ($count > 0) $label .= esc_attr(', ' . $count . ' reviews');

    $html = '<div class="sg-product-card__stars" aria-label="' . $label . '">';
    for ($i = 0; $i < $full;  $i++) $html .= sg_hp_star(false);
    for ($i = 0; $i < $empty; $i++) $html .= sg_hp_star(true);
    if ($count > 0) {
        $html .= '<span class="sg-product-card__review-count">(' . (int) $count . ')</span>';
    }
    $html .= '</div>';
    return $html;
}

// ── All CSS scoped under #sg-hp ─────────────────────────────────────────────
function sg_hp_styles() {
    return '<style>
#sg-hp {
  --sg-bg:            #0D0D0D;
  --sg-bg-alt:        #111111;
  --sg-surface:       #1A1A1A;
  --sg-surface-muted: #141414;
  --sg-on-surface:    #F5F0E8;
  --sg-on-muted:      #888888;
  --sg-primary:       #1C4032;
  --sg-primary-hover: #2C6050;
  --sg-accent:        #1C4032;
  --sg-border:        rgba(255,255,255,0.08);
  --sg-border-strong: rgba(255,255,255,0.15);
  --sg-shadow-raised: 0 2px 12px rgba(0,0,0,0.5);
  --sg-font-display:  "Bodoni Moda", Georgia, serif;
  --sg-font-body:     "Figtree", system-ui, sans-serif;
  --sg-ease:          cubic-bezier(0.4,0,0.2,1);
  --sg-ease-reveal:   cubic-bezier(0.16,1,0.3,1);
  background: var(--sg-bg);
  color: var(--sg-on-surface);
  font-family: var(--sg-font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
#sg-hp *, #sg-hp *::before, #sg-hp *::after { box-sizing: border-box; }
#sg-hp a { color: inherit; text-decoration: none; }
#sg-hp img { display: block; max-width: 100%; }
#sg-hp p, #sg-hp h1, #sg-hp h2, #sg-hp h3 { margin: 0; padding: 0; }
#sg-hp button { font-family: var(--sg-font-body); cursor: pointer; border: none; background: none; }

/* Container */
#sg-hp .sg-container { width: 100%; max-width: 1360px; margin-inline: auto; padding-inline: 20px; }
@media (min-width: 768px)  { #sg-hp .sg-container { padding-inline: 40px; } }
@media (min-width: 1280px) { #sg-hp .sg-container { padding-inline: 64px; } }

/* Reveal */
#sg-hp .sg-reveal { opacity: 0; transform: translateY(24px); transition: opacity 800ms var(--sg-ease-reveal), transform 800ms var(--sg-ease-reveal); }
#sg-hp .sg-reveal.sg-reveal--visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { #sg-hp .sg-reveal { opacity: 1; transform: none; transition: none; } }

/* Buttons */
#sg-hp .sg-btn-primary { display: inline-flex; align-items: center; justify-content: center; font-family: var(--sg-font-body); font-size: 14px; font-weight: 600; letter-spacing: 0.04em; color: #fff; background: var(--sg-primary); border: none; border-radius: 7px; min-height: 52px; padding: 14px 28px; cursor: pointer; transition: background-color 150ms var(--sg-ease), transform 250ms var(--sg-ease); text-decoration: none; }
#sg-hp .sg-btn-primary:hover { background: var(--sg-primary-hover); transform: translateY(-1px); color: #fff; }
#sg-hp .sg-btn-ghost { display: inline-flex; align-items: center; gap: 4px; font-family: var(--sg-font-body); font-size: 14px; font-weight: 600; color: var(--sg-on-surface); background: none; border: none; cursor: pointer; position: relative; padding-bottom: 3px; text-decoration: none; }
#sg-hp .sg-btn-ghost::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: var(--sg-accent); }

/* Hero */
#sg-hp .sg-hero { padding-block: 40px 48px; background: var(--sg-bg); }
#sg-hp .sg-hero__inner { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
#sg-hp .sg-hero__content { display: flex; flex-direction: column; gap: 24px; max-width: 560px; }
#sg-hp .sg-hero__overline { font-family: var(--sg-font-body); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sg-on-muted); }
#sg-hp .sg-hero__headline { font-family: var(--sg-font-display); font-style: italic; font-size: clamp(44px,5vw,72px); font-weight: 400; line-height: 1.05; letter-spacing: -0.03em; color: var(--sg-on-surface); }
#sg-hp .sg-hero__sub { font-size: 18px; line-height: 1.65; color: var(--sg-on-muted); max-width: 480px; }
#sg-hp .sg-hero__proof { display: flex; align-items: baseline; gap: 8px; }
#sg-hp .sg-hero__proof-num { font-family: var(--sg-font-display); font-size: 26px; font-weight: 700; color: var(--sg-on-surface); line-height: 1; }
#sg-hp .sg-hero__proof-label { font-size: 14px; color: var(--sg-on-muted); }
#sg-hp .sg-hero__actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
#sg-hp .sg-hero__visual { background: #1e2920; border-radius: 20px; max-height: clamp(360px,50vh,500px); aspect-ratio: 4/5; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; padding: 16px; }
#sg-hp .sg-hero__bottles { display: flex; align-items: flex-end; justify-content: center; gap: 16px; width: 100%; height: 100%; }
#sg-hp .sg-hero__bottle { flex: 1; max-width: 130px; object-fit: contain; object-position: bottom center; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4)); }
#sg-hp .sg-hero__bottle:nth-child(1) { max-height: 68%; align-self: flex-end; }
#sg-hp .sg-hero__bottle:nth-child(2) { max-height: 88%; align-self: flex-end; }
#sg-hp .sg-hero__bottle:nth-child(3) { max-height: 100%; align-self: flex-end; }
#sg-hp .sg-hero__bottle:nth-child(4) { max-height: 80%; align-self: flex-end; }
@media (max-width: 900px) { #sg-hp .sg-hero__inner { grid-template-columns: 1fr; gap: 48px; } #sg-hp .sg-hero__visual { order: -1; aspect-ratio: 3/2; max-height: 340px; } }

/* Collection */
#sg-hp .sg-collection { padding-block: 48px 80px; background: var(--sg-bg); }
#sg-hp .sg-collection__header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; }
#sg-hp .sg-collection__title { font-family: var(--sg-font-display); font-size: 36px; font-weight: 400; font-style: italic; letter-spacing: -0.01em; color: var(--sg-on-surface); }
#sg-hp .sg-collection__view-all { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sg-on-muted); transition: color 150ms var(--sg-ease); }
#sg-hp .sg-collection__view-all:hover { color: var(--sg-on-surface); }
#sg-hp .sg-collection__grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; }
@media (max-width: 900px) { #sg-hp .sg-collection__grid { grid-template-columns: repeat(2,1fr); gap: 16px; } }
@media (max-width: 640px) { #sg-hp .sg-collection__grid { grid-template-columns: 1fr 1fr; gap: 12px; } }

/* Product Card */
#sg-hp .sg-product-card { background: var(--sg-surface); border: 1px solid var(--sg-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 250ms var(--sg-ease), box-shadow 250ms var(--sg-ease); }
#sg-hp .sg-product-card:hover { transform: translateY(-3px); box-shadow: var(--sg-shadow-raised); }
#sg-hp .sg-product-card__image-link { display: block; }
#sg-hp .sg-product-card__image-wrap { position: relative; aspect-ratio: 3/4; background: var(--sg-surface-muted); overflow: hidden; }
#sg-hp .sg-product-card__image { width: 100%; height: 100%; object-fit: contain; object-position: center; padding: 24px; transition: transform 400ms var(--sg-ease); }
#sg-hp .sg-product-card:hover .sg-product-card__image { transform: scale(1.03); }
#sg-hp .sg-product-card__badge { position: absolute; top: 12px; right: 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #a3d4bc; background: rgba(28,64,50,0.45); border-radius: 9999px; padding: 4px 10px; line-height: 1.4; }
#sg-hp .sg-product-card__info { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
#sg-hp .sg-product-card__brand { font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sg-on-muted); margin-bottom: 2px; }
#sg-hp .sg-product-card__name { font-family: var(--sg-font-display); font-size: 20px; font-weight: 400; font-style: italic; color: var(--sg-on-surface); letter-spacing: -0.01em; }
#sg-hp .sg-product-card__name a { color: inherit; text-decoration: none; }
#sg-hp .sg-product-card__stars { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
#sg-hp .sg-star { width: 13px; height: 13px; fill: #3a7d5e; }
#sg-hp .sg-star--empty { fill: var(--sg-border-strong); }
#sg-hp .sg-product-card__review-count { font-size: 12px; color: var(--sg-on-muted); margin-left: 2px; }
#sg-hp .sg-product-card__sizes { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 4px; }
#sg-hp .sg-size-pill { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; padding: 5px 11px; border-radius: 9999px; border: 1px solid var(--sg-border-strong); background: transparent; color: var(--sg-on-muted); cursor: pointer; transition: all 150ms var(--sg-ease); }
#sg-hp .sg-size-pill--active { background: var(--sg-primary); border-color: var(--sg-primary); color: #fff; }
#sg-hp .sg-size-pill:hover:not(.sg-size-pill--active) { border-color: var(--sg-on-muted); color: var(--sg-on-surface); }
#sg-hp .sg-product-card__price { font-size: 20px; font-weight: 700; color: var(--sg-on-surface); }
#sg-hp .sg-product-card__cta { display: flex; align-items: center; justify-content: center; width: 100%; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; color: #fff; background: var(--sg-primary); border: none; border-radius: 7px; min-height: 48px; padding: 12px 20px; cursor: pointer; margin-top: 12px; text-align: center; transition: background-color 150ms var(--sg-ease), transform 250ms var(--sg-ease); text-decoration: none; }
#sg-hp .sg-product-card__cta:hover { background: var(--sg-primary-hover); transform: translateY(-1px); color: #fff; }
@media (max-width: 640px) { #sg-hp .sg-product-card__name { font-size: 16px; } #sg-hp .sg-size-pill { font-size: 10px; padding: 4px 8px; } }

/* How It Works */
#sg-hp .sg-how { padding-block: 80px; background: var(--sg-bg-alt); }
#sg-hp .sg-how__header { text-align: center; margin-bottom: 48px; }
#sg-hp .sg-how__title { font-family: var(--sg-font-display); font-size: 36px; font-weight: 400; font-style: italic; color: var(--sg-on-surface); line-height: 1.1; }
#sg-hp .sg-how__sub { font-size: 16px; color: var(--sg-on-muted); margin-top: 12px; }
#sg-hp .sg-how__grid { display: flex; gap: 40px; }
#sg-hp .sg-hiw-step { flex: 1; display: flex; flex-direction: column; gap: 12px; }
#sg-hp .sg-hiw-step__num { font-family: var(--sg-font-display); font-size: 52px; font-weight: 400; color: var(--sg-primary); line-height: 1; opacity: 0.9; }
#sg-hp .sg-hiw-step__title { font-size: 16px; font-weight: 600; color: var(--sg-on-surface); }
#sg-hp .sg-hiw-step__sub { font-size: 14px; color: var(--sg-on-muted); line-height: 1.65; }
@media (max-width: 640px) { #sg-hp .sg-how__grid { flex-direction: column; gap: 40px; } }

/* Testimonials */
#sg-hp .sg-testimonials { background: var(--sg-bg); padding-block: 80px; }
#sg-hp .sg-testimonials__header { text-align: center; margin-bottom: 48px; }
#sg-hp .sg-testimonials__overline { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sg-accent); display: block; margin-bottom: 12px; }
#sg-hp .sg-testimonials__title { font-family: var(--sg-font-display); font-size: 36px; font-weight: 400; font-style: italic; color: var(--sg-on-surface); }
#sg-hp .sg-testimonials__grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
#sg-hp .sg-testimonial-card { background: var(--sg-surface); border: 1px solid var(--sg-border); border-radius: 12px; padding: 32px 28px; position: relative; display: flex; flex-direction: column; gap: 16px; }
#sg-hp .sg-testimonial-card__quote-mark { font-family: var(--sg-font-display); font-size: 72px; line-height: 1; color: var(--sg-accent); opacity: 0.3; position: absolute; top: 20px; left: 24px; pointer-events: none; user-select: none; }
#sg-hp .sg-testimonial-card__stars { display: flex; gap: 3px; margin-top: 24px; }
#sg-hp .sg-testimonial-card__stars .sg-star { width: 14px; height: 14px; }
#sg-hp .sg-testimonial-card__quote { font-family: var(--sg-font-display); font-style: italic; font-size: 20px; font-weight: 300; line-height: 1.55; color: var(--sg-on-surface); }
#sg-hp .sg-testimonial-card__attribution { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sg-on-muted); margin-top: 16px; display: flex; align-items: center; gap: 12px; }
#sg-hp .sg-testimonial-card__avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--sg-surface); color: var(--sg-on-muted); border: 1px solid var(--sg-border-strong); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; font-family: var(--sg-font-body); letter-spacing: 0; text-transform: none; }
@media (max-width: 900px) { #sg-hp .sg-testimonials__grid { grid-template-columns: 1fr; } }

/* CTA */
#sg-hp .sg-cta { background: var(--sg-accent); padding-block: 80px; }
#sg-hp .sg-cta__inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px; max-width: 800px; margin-inline: auto; }
#sg-hp .sg-cta__overline { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.65); }
#sg-hp .sg-cta__title { font-family: var(--sg-font-display); font-size: 48px; font-weight: 400; line-height: 1.08; letter-spacing: -0.015em; color: #fff; }
#sg-hp .sg-cta__body { font-size: 18px; line-height: 1.65; color: rgba(255,255,255,0.75); max-width: 520px; }
#sg-hp .sg-cta__actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
#sg-hp .sg-btn-primary--white { display: inline-flex; align-items: center; justify-content: center; font-family: var(--sg-font-body); font-size: 14px; font-weight: 600; letter-spacing: 0.04em; color: var(--sg-accent); background: #fff; border: none; border-radius: 7px; min-height: 52px; padding: 14px 28px; cursor: pointer; transition: background-color 150ms var(--sg-ease), transform 250ms var(--sg-ease); text-decoration: none; }
#sg-hp .sg-btn-primary--white:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
#sg-hp .sg-btn-ghost--white { display: inline-flex; align-items: center; font-family: var(--sg-font-body); font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); background: none; border: none; cursor: pointer; position: relative; padding-bottom: 3px; text-decoration: none; }
#sg-hp .sg-btn-ghost--white::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.45); }
#sg-hp .sg-btn-ghost--white:hover { color: #fff; }
@media (max-width: 640px) { #sg-hp .sg-cta__title { font-size: 36px; } }
</style>';
}
