<?php
/**
 * Plugin Name: Vinitvers Local Chatbot (No API)
 * Description: Local rule-based chatbot for tournament site. Store Q/A in admin (Custom Post Type) and use shortcode [vinitvers_local_chat].
 * Version: 0.1
 * Author: Vinitvers Support
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Register CPT for Q/A
add_action('init', function() {
    $labels = [
        'name' => 'VV Chat Q/A',
        'singular_name' => 'VV QA',
        'add_new_item' => 'Add New Q/A',
        'edit_item' => 'Edit Q/A',
    ];
    register_post_type('vv_qa', [
        'labels' => $labels,
        'public' => false,
        'show_ui' => true,
        'supports' => ['title','editor'],
        'menu_position' => 58,
        'menu_icon' => 'dashicons-format-chat',
    ]);
});

// On activation, add some sample Q/A in Hindi (only if none exist)
register_activation_hook(__FILE__, function() {
    $exists = get_posts(['post_type'=>'vv_qa','posts_per_page'=>1]);
    if (empty($exists)) {
        $samples = [
            ['question' => 'Tournament ka schedule kya hai?', 'answer' => 'Tournament ka schedule homepage par "Tournaments" section me milega. Aap specific tournament page par jaake match timings dekh sakte hain.'],
            ['question' => 'Kaise join karen?', 'answer' => 'Join karne ke liye tournament page par "Join" button dabayen aur apni registration confirm karein. Agar entry fee hai to payment section se bharen.'],
            ['question' => 'Score kaise submit karte hain?', 'answer' => 'Match ke page par jaakar "Submit Score" form bhar kar submit karein. Admin verification ke baad score update hoga.'],
            ['question' => 'Registration fee kitni hai?', 'answer' => 'Registration fee tournament ke description me likhi hoti hai. Agar payment option chahiye to admin se contact karein.'],
        ];
        foreach ($samples as $s) {
            wp_insert_post([
                'post_type' => 'vv_qa',
                'post_title' => $s['question'],
                'post_content' => $s['answer'],
                'post_status' => 'publish',
            ]);
        }
    }
});

// REST endpoint: /wp-json/vinitvers/v1/localchat
add_action('rest_api_init', function () {
    register_rest_route('vinitvers/v1', '/localchat', [
        'methods' => 'POST',
        'callback' => 'vvc_localchat_handler',
        'permission_callback' => '__return_true', // public; modify if you want logged-in only
    ]);
});

function vvc_normalize_text($text) {
    $t = mb_strtolower(trim($text));
    $t = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $t);
    $t = preg_replace('/\s+/u', ' ', $t);
    return $t;
}

function vvc_localchat_handler($request) {
    $body = $request->get_json_params();
    $message = isset($body['message']) ? trim($body['message']) : '';
    if (empty($message)) {
        return new WP_Error('no_message', 'Message missing', ['status' => 400]);
    }

    $user_msg = vvc_normalize_text($message);

    $qas = get_posts([
        'post_type' => 'vv_qa',
        'post_status' => 'publish',
        'posts_per_page' => 200,
    ]);

    $best_answer = '';
    $best_score = 0;
    foreach ($qas as $qa) {
        $q = vvc_normalize_text($qa->post_title);
        if ($q !== '' && mb_stripos($user_msg, $q) !== false) {
            $best_answer = $qa->post_content;
            $best_score = 100;
            break;
        }
        $percent = 0;
        similar_text($user_msg, $q, $percent);
        if ($percent > $best_score) {
            $best_score = $percent;
            $best_answer = $qa->post_content;
        }
    }

    if ($best_score < 30 || empty($best_answer)) {
        $fallback = 'Maaf kijiye — mujhe samajh nahi aaya. Aap in me se try kar sakte hain: "Tournament ka schedule", "Kaise join karen", "Score submit kaise karein". Agar aap chahen to admin se contact karein.';
        return rest_ensure_response(['reply' => $fallback, 'matched' => false, 'score' => $best_score]);
    }

    return rest_ensure_response(['reply' => $best_answer, 'matched' => true, 'score' => $best_score]);
}

// Shortcode to display chat box and enqueue script
add_shortcode('vinitvers_local_chat', function($atts) {
    wp_enqueue_script('vvc-chat-widget', plugins_url('chat-widget.js', __FILE__), ['jquery'], '0.1', true);
    wp_localize_script('vvc-chat-widget', 'VVC_CHAT', [
        'rest_url' => esc_url_raw(rest_url('vinitvers/v1/localchat')),
    ]);

    $html = '<div id="vvc-chat" style="max-width:400px;border:1px solid #ddd;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;">';
    $html .= '<div id="vvc-messages" style="height:260px;overflow:auto;padding:10px;background:#fafafa;"></div>';
    $html .= '<div style="display:flex;border-top:1px solid #eee;padding:8px;background:#fff;">';
    $html .= '<input id="vvc-input" type="text" placeholder="Apna sawal likhein..." style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;">';
    $html .= '<button id="vvc-send" style="margin-left:6px;padding:8px 12px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;">Send</button>';
    $html .= '</div></div>';
    return $html;
});
