<?php get_header(); ?>
<div style="padding:20px;">
  <h1><?php bloginfo('name'); ?></h1>
  <p><?php bloginfo('description'); ?></p>
  <div><?php if (have_posts()) : while (have_posts()) : the_post(); the_content(); endwhile; endif; ?></div>
</div>
<?php get_footer(); ?>
