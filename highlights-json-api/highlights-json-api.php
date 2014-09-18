<?php
/*
Plugin Name: Highlights JSON API Extension
Plugin URI: http://puntpixel.nl
Description: Extra methods for the Wordpress JSON REST API
Version: 0.1
Author: PUNTPIXEL
Author URI: http://puntpixel.nl

Based on the JSON API plugin for the Pods Framework: https://github.com/pods-framework/pods-json-api
This plugin extends the API with some extra methods to allow for certain queries which are (to my knowledge) currently not allowed using WP API without authentication or otherwise.
*/

define( 'HIGHLIGHTS_JSON_API_DIR', plugin_dir_path( __FILE__ ) );

// Include main class
include_once HIGHLIGHTS_JSON_API_DIR . 'classes/Highlights/JSON/API/Init.php';

// Include endpoints
add_action( 'init', array( 'Highlights_JSON_API_Init', 'include_endpoints' ) );

// Setup endpoints
add_action( 'wp_json_server_before_serve', array( 'Highlights_JSON_API_Init', 'add_endpoints' ) );