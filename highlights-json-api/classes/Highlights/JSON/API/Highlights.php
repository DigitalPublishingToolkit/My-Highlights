<?php
class Highlights_JSON_API_Highlights {

	public function register_routes( $routes ) {
		$routes[ '/highlights' ] = array(
			array( array( $this, 'get_items' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);    

		$routes[ '/highlights/(?P<id>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_item' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);    

		$routes[ '/highlights/get_media/(?P<id>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_media_for_post' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);

		$routes[ '/highlights/get_taxonomy_posts/(?P<taxonomy>[\w\-\_]+)/(?P<slug>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_taxonomy_posts' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);

		$routes[ '/highlights/get_related/(?P<id>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_related' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);

		$routes[ '/highlights/get_meta/(?P<id>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_meta' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);

		$routes[ '/highlights/get_price/(?P<id>[\w\-\_]+)' ] = array(
			array( array( $this, 'get_price' ), WP_JSON_Server::READABLE | WP_JSON_Server::ACCEPT_JSON ),
		);

		return $routes;

	}
	
	private function add_image_meta($posts=null) {
	  if ($posts) {
  	  foreach ($posts as $post) {
    	  $thumbnailId = get_post_thumbnail_id( $post->ID );
    	  
    	  $keys = array('url', 'width', 'height', 'icon');
    	  
        $thumbnail = wp_get_attachment_image_src($thumbnailId, 'thumbnail');
        $thumbnail = @array_combine ( $keys , $thumbnail );
        
        $medium = wp_get_attachment_image_src($thumbnailId, 'medium');
        $medium = @array_combine ( $keys , $medium );
        
    	  $post->featured_image = (object) array('attachment_meta' => array('sizes' => array(
    	    'medium' => $medium,
    	    'thumbnail' => $thumbnail
    	  )) );
    	  
    	  $post->title = $post->post_title;
    	  $preparedPosts[] = $post;
  	  }
  	  return $preparedPosts;
	  }
	}

  public function get_items( $data = array() ) {
    $postIds = $_GET['filter']['post__in'];
	  $posts = get_posts(array(
      'post_type' => 'any',
      'post__in' => $postIds
	  ));
    $posts = $this->add_image_meta($posts);
    foreach ($posts as $post) {
      $post->post_subtitle = get_post_meta($post->ID, 'wps_subtitle', true);  
    }
    return $posts;
    
  }

  public function get_item( $id, $data = array() ) {
    $post = get_post($id);
    $post->post_subtitle = get_post_meta($id, 'wps_subtitle');
    return $post;
  }

	public function get_taxonomy_posts( $taxonomy, $slug, $data = array() ) {
	  $posts = get_posts(array(
      'tax_query' => array(
      	array(
      		'taxonomy' => $taxonomy,
      		'field' => 'slug',
      		'terms' => $slug
      	)
      )
	  ));
    $posts = $this->add_image_meta($posts);
		return $posts;
	}

	public function get_media_for_post( $id, $data = array() ) {
    $attachments = get_attached_media('image', $id);
		return $attachments;
	}
	
	public function get_related( $id, $data = array() ) {
	  $postTypes = array('biography', 'essay', 'interview', 'image');
	  $resources = array();
	  foreach ($postTypes as $postType) {
      $posts = get_posts(array(
      	'post_type' => $postType,
      	'meta_query' => array(
      		array(
      			'key' => 'post',
      			'value' => $id,
      			'compare' => 'LIKE'
      		)
      	)
      ));
      foreach ($posts as $post) {
        $price = get_field('price', $post->ID);
        $post->price = $price;
      }
      $resources = array_merge($resources, $posts);
	  }
		return $resources;
	}

  public function get_meta( $id, $data = array() ) {
    $meta = get_field_objects($id);
    return $meta;
  }

  public function get_price( $id, $data = array() ) {
    $price = get_field('price', $id);
    return $price;
  }
}