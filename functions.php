<?php
/**
 * Scent Gallery Theme Functions
 */

// Theme setup
add_action('after_setup_theme', function() {
    add_theme_support('woocommerce');
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'script',
        'style'
    ));
});

// Enqueue styles & scripts
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('scent-gallery-style', get_stylesheet_uri());
    wp_enqueue_script('swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', array(), '11.0.0', true);
    wp_enqueue_script('scent-gallery-main', get_template_directory_uri() . '/assets/js/main.js', array('swiper-js'), '1.0.0', true);
});

// Load WooCommerce integration
require_once get_template_directory() . '/inc/woocommerce.php';

// Custom functions
require_once get_template_directory() . '/inc/template-tags.php';
