<?php
/**
 * Plugin Name: HireSort AI Careers Portal
 * Plugin URI: https://hiresort.ai
 * Description: Embed your live HireSort AI job board, applicant counts, and candidate application flow into any WordPress page or post.
 * Version: 1.0.0
 * Author: HireSort AI
 * Author URI: https://hiresort.ai
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Add Settings Menu to WP Admin
add_action('admin_menu', function() {
    add_options_page(
        'HireSort Settings',
        'HireSort Careers',
        'manage_options',
        'hiresort-careers-settings',
        'hiresort_render_admin_settings'
    );
});

// 2. Render WP Admin Settings Form
function hiresort_render_admin_settings() {
    if (isset($_POST['hiresort_save_settings'])) {
        check_admin_referer('hiresort_settings_verify');
        update_option('hiresort_client_slug', sanitize_text_field($_POST['client_slug']));
        update_option('hiresort_theme', sanitize_text_field($_POST['theme']));
        update_option('hiresort_ats_url', esc_url_raw($_POST['ats_url']));
        echo '<div class="notice notice-success is-dismissible"><p><strong>HireSort settings saved successfully!</strong></p></div>';
    }

    $client_slug = get_option('hiresort_client_slug', 'zool');
    $theme       = get_option('hiresort_theme', 'dark');
    $ats_url     = get_option('hiresort_ats_url', 'https://app.hiresort.ai');
    ?>
    <div class="wrap">
        <h1>HireSort AI Careers Configuration</h1>
        <p>Embed real-time job openings and candidate screening on your WordPress website.</p>
        
        <form method="post" action="">
            <?php wp_nonce_field('hiresort_settings_verify'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="client_slug">Company Slug</label></th>
                    <td>
                        <input type="text" id="client_slug" name="client_slug" value="<?php echo esc_attr($client_slug); ?>" class="regular-text" required />
                        <p class="description">Your company identifier in HireSort (e.g., <code>zool</code>).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="theme">Portal Theme</label></th>
                    <td>
                        <select id="theme" name="theme">
                            <option value="dark" <?php selected($theme, 'dark'); ?>>Dark Mode</option>
                            <option value="light" <?php selected($theme, 'light'); ?>>Light Mode</option>
                        </select>
                        <p class="description">Select the default appearance matching your website style.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="ats_url">HireSort ATS Host URL</label></th>
                    <td>
                        <input type="url" id="ats_url" name="ats_url" value="<?php echo esc_attr($ats_url); ?>" class="regular-text" />
                        <p class="description">Default: <code>https://app.hiresort.ai</code> (or your custom domain/localhost in dev).</p>
                    </td>
                </tr>
            </table>
            
            <p class="submit">
                <input type="submit" name="hiresort_save_settings" class="button button-primary" value="Save Settings" />
            </p>
        </form>

        <hr />
        <h2>How to Display Jobs on Your Site</h2>
        <p>You can display the job board anywhere on your site using the shortcode:</p>
        <p><code>[hiresort_jobs]</code></p>
        <p>Or customize per page with attributes:</p>
        <p><code>[hiresort_jobs client="zool" theme="dark" height="700px"]</code></p>
    </div>
    <?php
}

// 3. Register Shortcode [hiresort_jobs]
add_shortcode('hiresort_jobs', function($atts) {
    $default_slug = get_option('hiresort_client_slug', 'zool');
    $default_theme = get_option('hiresort_theme', 'dark');
    $default_host = get_option('hiresort_ats_url', 'https://app.hiresort.ai');

    $args = shortcode_atts(array(
        'client' => $default_slug,
        'theme'  => $default_theme,
        'height' => '650px',
        'host'   => $default_host
    ), $atts);

    $embed_url = esc_url(rtrim($args['host'], '/') . '/embed/careers/' . urlencode($args['client']) . '?theme=' . urlencode($args['theme']));

    // Output container and auto-height iframe listener
    ob_start();
    ?>
    <div class="hiresort-careers-embed-container" style="width: 100%; max-width: 1200px; margin: 0 auto;">
        <iframe 
            id="hiresort-wp-iframe-<?php echo esc_attr($args['client']); ?>"
            src="<?php echo $embed_url; ?>"
            width="100%"
            height="<?php echo esc_attr($args['height']); ?>"
            style="border: none; overflow: hidden; display: block; border-radius: 12px; transition: height 0.25s ease;"
            title="Careers Portal"
            loading="lazy"
        ></iframe>
        <script>
            (function() {
                var iframe = document.getElementById('hiresort-wp-iframe-<?php echo esc_js($args['client']); ?>');
                if (!iframe) return;
                window.addEventListener('message', function(e) {
                    if (e.data && e.data.type === 'HIRESORT_RESIZE' && e.data.height > 100) {
                        iframe.style.height = e.data.height + 'px';
                    }
                });
            })();
        </script>
    </div>
    <?php
    return ob_get_clean();
});
