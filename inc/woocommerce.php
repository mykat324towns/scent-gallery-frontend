<?php
/**
 * WooCommerce Integration
 */

// Customize WooCommerce
add_filter('woocommerce_show_page_title', '__return_false');

// Display featured products on homepage
function scent_gallery_get_featured_products($limit = 3) {
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $limit,
        'meta_key' => '_featured',
        'meta_value' => 'yes'
    );
    return new WP_Query($args);
}

// Get best sellers
function scent_gallery_get_bestsellers($limit = 3) {
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $limit,
        'meta_key' => 'total_sales',
        'orderby' => 'meta_value_num',
        'order' => 'DESC'
    );
    return new WP_Query($args);
}

// ── Storefront REST API ────────────────────────────────────────────────────
// Single endpoint that returns all page data using WC PHP functions directly
// (no HTTP calls, served from transient cache after first hit).
// GET /wp-json/sg/v1/storefront?context=homepage
// GET /wp-json/sg/v1/storefront?context=product&slug=product-slug
// GET /wp-json/sg/v1/storefront?context=collections

add_action('rest_api_init', function () {
    register_rest_route('sg/v1', '/storefront', [
        'methods'             => 'GET',
        'callback'            => 'sg_storefront_handler',
        'permission_callback' => '__return_true',
        'args'                => [
            'context' => [
                'required'          => true,
                'type'              => 'string',
                'enum'              => ['homepage', 'product', 'collections'],
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'slug' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_title',
            ],
        ],
    ]);
});

function sg_format_product($product) {
    if (!$product || !($product instanceof WC_Product)) return null;

    $minor_unit = wc_get_price_decimals();
    $multiplier = pow(10, $minor_unit);
    $symbol     = get_woocommerce_currency_symbol();

    // Image
    $images   = [];
    $image_id = $product->get_image_id();
    if ($image_id) {
        $src      = wp_get_attachment_image_url($image_id, 'woocommerce_single') ?: '';
        $alt      = get_post_meta($image_id, '_wp_attachment_image_alt', true) ?: $product->get_name();
        $images[] = ['src' => $src, 'alt' => $alt];
    }

    // Prices
    $prices = ['currency_symbol' => $symbol, 'currency_minor_unit' => $minor_unit];
    if ($product->is_type('variable')) {
        $min = $product->get_variation_price('min');
        $max = $product->get_variation_price('max');
        $prices['price']       = (string) intval(round(floatval($min) * $multiplier));
        $prices['price_range'] = [
            'min_amount' => (string) intval(round(floatval($min) * $multiplier)),
            'max_amount' => (string) intval(round(floatval($max) * $multiplier)),
        ];
    } else {
        $prices['price'] = (string) intval(round(floatval($product->get_price()) * $multiplier));
    }

    // Variations with prices
    $variations = [];
    if ($product->is_type('variable')) {
        foreach ($product->get_children() as $var_id) {
            $v = wc_get_product($var_id);
            if (!$v || !$v->is_in_stock()) continue;

            $attrs = [];
            foreach ($v->get_variation_attributes() as $attr_name => $attr_value) {
                $attrs[] = [
                    'name'  => preg_replace('/^attribute_/', '', $attr_name),
                    'value' => $attr_value,
                ];
            }

            $variations[] = [
                'id'         => $var_id,
                'attributes' => $attrs,
                'prices'     => [
                    'currency_symbol'     => $symbol,
                    'currency_minor_unit' => $minor_unit,
                    'price'               => (string) intval(round(floatval($v->get_price()) * $multiplier)),
                ],
            ];
        }
    }

    return [
        'id'                => $product->get_id(),
        'name'              => $product->get_name(),
        'slug'              => $product->get_slug(),
        'short_description' => $product->get_short_description(),
        'images'            => $images,
        'prices'            => $prices,
        'variations'        => $variations,
        'on_sale'           => $product->is_on_sale(),
        'featured'          => $product->is_featured(),
    ];
}

function sg_query_products($args) {
    $defaults = ['post_type' => 'product', 'post_status' => 'publish'];
    $query    = new WP_Query(array_merge($defaults, $args));
    $results  = [];
    while ($query->have_posts()) {
        $query->the_post();
        $p = wc_get_product(get_the_ID());
        $f = sg_format_product($p);
        if ($f) $results[] = $f;
    }
    wp_reset_postdata();
    return $results;
}

function sg_storefront_handler(WP_REST_Request $request) {
    $context   = $request->get_param('context');
    $slug      = $request->get_param('slug');
    $cache_key = 'sg_sf_' . md5($context . '_' . ($slug ?: ''));
    $cached    = get_transient($cache_key);

    if ($cached !== false) {
        $res = new WP_REST_Response($cached, 200);
        $res->header('X-SG-Cache', 'HIT');
        return $res;
    }

    if ($context === 'homepage') {
        $payload = ['products' => sg_query_products([
            'posts_per_page' => 6,
            'meta_key'       => 'total_sales',
            'orderby'        => 'meta_value_num',
            'order'          => 'DESC',
        ])];

    } elseif ($context === 'product') {
        if (!$slug) return new WP_Error('missing_slug', 'slug required', ['status' => 400]);

        $post = get_page_by_path($slug, OBJECT, 'product');
        if (!$post) return new WP_Error('not_found', 'Product not found', ['status' => 404]);

        $product = wc_get_product($post->ID);
        if (!$product) return new WP_Error('not_found', 'Product not found', ['status' => 404]);

        $also_like = sg_query_products([
            'posts_per_page' => 7,
            'meta_key'       => 'total_sales',
            'orderby'        => 'meta_value_num',
            'order'          => 'DESC',
            'post__not_in'   => [$post->ID],
        ]);

        $payload = [
            'product'  => sg_format_product($product),
            'alsoLike' => array_slice($also_like, 0, 6),
        ];

    } elseif ($context === 'collections') {
        $payload = ['products' => sg_query_products([
            'posts_per_page' => 100,
            'orderby'        => 'menu_order title',
            'order'          => 'ASC',
        ])];

    } else {
        return new WP_Error('invalid_context', 'Invalid context', ['status' => 400]);
    }

    set_transient($cache_key, $payload, 5 * MINUTE_IN_SECONDS);

    $res = new WP_REST_Response($payload, 200);
    $res->header('X-SG-Cache', 'MISS');
    return $res;
}

// Bust cache when any product is saved/updated
add_action('woocommerce_update_product', 'sg_clear_storefront_cache');
add_action('woocommerce_new_product', 'sg_clear_storefront_cache');

function sg_clear_storefront_cache() {
    global $wpdb;
    $wpdb->query(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_sg_sf_%' OR option_name LIKE '_transient_timeout_sg_sf_%'"
    );
}
