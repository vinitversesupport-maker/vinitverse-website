<?php
// Minimal functions for theme
add_action('wp_enqueue_scripts', function(){
  wp_enqueue_style('vinitvers-style', get_stylesheet_uri());
});
?>
