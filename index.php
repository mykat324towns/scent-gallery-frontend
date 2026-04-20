<?php
/**
 * Main Template File
 */

get_header();

if (is_home() || is_front_page()) {
    include get_template_directory() . '/template-parts/homepage.php';
} else {
    while (have_posts()) {
        the_post();
        ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
            <h1><?php the_title(); ?></h1>
            <div class="entry-content">
                <?php the_content(); ?>
            </div>
        </article>
        <?php
    }
}

get_footer();
