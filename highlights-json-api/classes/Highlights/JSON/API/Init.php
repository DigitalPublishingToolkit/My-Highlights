<?php

class Highlights_JSON_API_Init {

	private static $endpoints = array(
		'Highlights_JSON_API_Highlights'
	);

	public static $endpoint_objects = array();

	public static function include_endpoints() {

		foreach ( self::$endpoints as $class ) {
			include_once HIGHLIGHTS_JSON_API_DIR . 'classes/' . str_replace( '_', '/', $class ) . '.php';
		}

	}

	public static function add_endpoints() {
		foreach ( self::$endpoints as $class ) {
			self::$endpoint_objects[ $class ] = new $class;

			add_filter( 'json_endpoints', array( self::$endpoint_objects[ $class ], 'register_routes' ) );
		}

	}
}
