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
