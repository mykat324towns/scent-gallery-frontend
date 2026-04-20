<?php
/**
 * Template Tags & Helper Functions
 */

// Get theme asset URL
function scent_gallery_asset($path) {
    return get_template_directory_uri() . '/assets/' . $path;
}

// Get image URL
function scent_gallery_image($filename) {
    return get_template_directory_uri() . '/assets/img/' . $filename;
}
