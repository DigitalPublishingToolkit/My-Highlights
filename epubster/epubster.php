<?php
/**
 * Plugin Name: EPUBster
 * Plugin URI: http://digitalpublishingtoolkit.org
 * Description: Creates an EPUB based on post and resource IDs.
 * Version: 1.0
 * Author: Marc de Bruijn, PUNTPIXEL
 * Author URI: http://puntpixel.nl
 * License: GPL2
 
 *  Copyright 2014, Marc de Bruijn (email : marc@puntpixel.nl)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
  require_once('lib/PHPePub/EPub.php');

  class EPUBster {
    var $EPUB;
    var $uploadDir;
    var $uploadURL;
  
    public function __construct() {
      $this->EPUB = new EPub(EPub::BOOK_VERSION_EPUB3, "en", EPub::DIRECTION_LEFT_TO_RIGHT);

	    $uploadDir = wp_upload_dir();
      $this->uploadDir = $uploadDir['basedir'].'/epubster/';
      $this->uploadURL = $uploadDir['baseurl'];
      
      if ( !file_exists($this->uploadDir) ) {
        if (wp_mkdir_p($this->uploadDir)) {
          @chmod($this->uploadDir, 0777);
        }
      }
    }
    
    static public function slugify($text) { 
      // replace non letter or digits by -
      $text = preg_replace('~[^\\pL\d]+~u', '-', $text);
    
      // trim
      $text = trim($text, '-');
    
      // transliterate
      $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    
      // lowercase
      $text = strtolower($text);
    
      // remove unwanted characters
      $text = preg_replace('~[^-\w]+~', '', $text);
    
      if (empty($text)) {
        return 'n-a';
      }
    
      return $text;
    }
    
    public function clean() {
      $directory = new DirectoryIterator($this->uploadDir);
      foreach ($directory as $file) {
        if (!in_array($file, array('__MACOSX', '.', '..', '.DS_Store', 'Thumbs.db')) && strpos($fileName, '/.') === false) {
          $file = $this->uploadDir.$file;
          if (file_exists($file)) {
            $timestamp = substr($file, strrpos($file, '-')+1);
            $timestamp = substr($timestamp, 0, strrpos($timestamp, '.epub'));
            
            //If the EPUB is older than 1 hour delete it
            if (time() - $timestamp > 3600) {
              unlink($file);
            }
          }
        }
      }
    }
  
  	public function package($contents=null, $cssFile=null, $download=true) {
  	  if ($contents && !empty($contents)) {  
        $content_start =
        "<?xml version=\"1.0\"?>
          <html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n"
        . "<head>"
        . "<link rel=\"stylesheet\" type=\"text/css\" href=\"styles.css\" />\n"
        . "<title>".$contents['name']."</title>\n"
        . "</head>\n"
        . "<body>\n";
        
        $this->bookend = "</body>\n</html>\n";
        $this->EPUB->setTitle($contents['name']);
        $this->EPUB->setIdentifier('', EPub::IDENTIFIER_ISBN);
        $this->EPUB->setLanguage("en");
        $this->EPUB->setDescription($contents['description']);
        $this->EPUB->setAuthor($contents['name'], $contents['name']);
        $this->EPUB->setPublisher($contents['publisher'], $contents['publisher_website']);
        $this->EPUB->setDate(time());
        $this->EPUB->setRights("Copyright ".date('Y'));
        $this->EPUB->setSourceURL('');
        
        if ($cssFile) {

          $cssDir = $cssFile;
          if (is_dir($cssDir)) {
        		$dir = realpath($cssDir);

        		$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
        		
        		$directoryName = '';
        		foreach($files as $file => $object){	
        		  $fileName = str_replace($dir.'/', '', $file);
              if (!in_array($fileName, array('__MACOSX', '.', '..', '.DS_Store', 'Thumbs.db')) && strpos($fileName, '/.') === false) {
                if (strpos($fileName, '/')) {
                  $directoryName = substr($file, 0, strrpos($file, '/'));
                  $directoryName = substr($directoryName, strrpos($directoryName, '/')+1);
                  if ($directoryName !== $lastDirectoryName) {
                    $this->EPUB->addDirectory('OEBPS'.'/'.$directoryName);  
                    $lastDirectoryName = $directoryName;
                  }
                } 
                
                if (substr($file, -4, 4) === '.css') {
                  $cssData = file_get_contents($file);
                  $this->EPUB->addCSSFile("styles.css", "global-css", $cssData);
                } elseif (is_file($file)) {
                  if (in_array(substr($file, -3, 3), array('txt', 'css'))) {
                    $mimetype = 'text/plain';
                  } else {
                    $mimetype = 'application/octet-stream';
                  }
                  $subDirectoryFileData = file_get_contents($file);                
                  $this->EPUB->addFile($fileName, 'file_'.$this->slugify($fileName), $subDirectoryFileData, $mimetype);
                }
              }
        		}
          }
        }

        $this->EPUB->setCoverImage($cssDir.'cover.jpg');

        foreach ($contents['Section'] as $index=>$section) {
          //$content = $content_start.$section['text'].$this->bookend;
          
          if ($section['type'] === 'post') {
            $metadata = array();
            foreach ($section['meta'] as $meta) {
              $postTypeLabel = str_pad($index+1, 3, "0", STR_PAD_LEFT).'/';
              $metadata[] = sprintf('<h3 class="meta-title">%s</h3><br /><span class="meta-value">%s</span>', $meta['title'], $meta['value']);
            }
            
            $images = array();
            foreach ($section['images'] as $image) {
              $images[] = sprintf('<img src="%s" /><br />', $image);
            }

            $content = sprintf('<div class="section"><h1>%s</h1><h2>%s</h2><div class="section-images">%s</div> <div class="section-meta"><img class="post-type-icon" width="30" src="image.png" /><br /> <span class="post-type-label">%s</span><br />%s</div> <img class="post-type-icon"  width="30" src="abstract.png" /><br /> <span class="post-type-label">%s</span> <div class="section-text">%s</div></div>', $section['title'], $section['subtitle'], implode("\n", $images), $postTypeLabel.'img', implode("\n<br />", $metadata), $postTypeLabel.'abstract', $section['text']);
          } else {
            $subtitle = (!empty($section['subtitle'])) ? '<h2>'.$section['subtitle'].'</h2>': '';
            $content = sprintf('<div class="section resource"><img class="post-type-icon" width="30" src="text.png" /><br /><span class="post-type-label">%s</span><br /> %s<br /><h1>%s</h1><br /> <h3 class="author">%s</h3> <div class="section-text">%s</div></div>', $section['type'], $subtitle, $section['title'], $section['author'], $section['text']);
          }
          $content = $content_start.$content.$this->bookend;
          $title = (!empty($section['title'])) ? $section['title']: 'No Title';
          
          $filename = $this->slugify($section['title']).'.html';
          //Fetching external images creates ugly file path at the moment
          $this->EPUB->addChapter($title, $filename, $content, true, EPub::EXTERNAL_REF_ADD);
          
          //Remove external images to prevent cURL error
          //$this->EPUB->addChapter($title, $filename, $content, true, EPub::EXTERNAL_REF_REMOVE_IMAGES);
        } 	  
        //$this->EPUB->buildTOC();
    	  $this->EPUB->finalize(); // Finalize the book, and build the archive.
    	  
    	  //$filename = $this->slugify($contents['name']);
    	  $filename = 'my-highlights-'.uniqid().'-'.time();
    	  
    	  if ($download) {
      	  $zipData = $this->EPUB->sendBook($filename);
    	  } else {
      	  $this->EPUB->saveBook($filename, $this->uploadDir);
      	  $zipData = $this->uploadURL.'/epubster/'.$filename;
    	  }
    	  return $zipData;
      }
  	  return false;
  	}
  	
  	public function get_contents($data=null) {
  	  if ($data) {
      	global $wpdb;
      	foreach ($data as $section) {
      	  $post = get_post( $section['id'] );
      	  $images = get_children( array('post_parent' => $section['id'], 'post_type' => 'attachment' ) );
      	  $post->images = array();
      	  foreach ($images as $image) {
        	  $post->images[] = get_attached_file($image->ID);
      	  }
      	  
      	  $post->meta = array();
      	  $metadata = get_field_objects($section['id']);
      	  foreach ($metadata as $meta) {
        	  $post->meta[] = array('title' => $meta['label'], 'value' => $meta['value']);
      	  }
          $posts[] = $post;
          if (isset($section['resources']) && !empty($section['resources'])) {
            $resources = get_posts( array('post_type' => array( 'post', 'biography', 'interview', 'essay', 'image' ), 'post__in' => $section['resources'] ) );
            $posts = array_merge($posts, $resources);
          }
      	}
      	$sections = array();
      	foreach ($posts as $post) { 
      	  $author = get_field('author', $post->ID);
          $subtitle = get_post_meta($post->ID, 'wps_subtitle', true);
        	
        	$postObject = array(
        	  'title' => $post->post_title,
        	  'subtitle' => $subtitle,
            'author' => $author,
        	  'text' => $post->post_content,
        	  'type' => $post->post_type
        	);
        	if (isset($post->images)) {
          	$postObject['images'] = $post->images;
        	}
        	if (isset($post->meta)) {
          	$postObject['meta'] = $post->meta;
        	}

        	$sections[] = $postObject;
      	}
        $user = $wpdb->get_results( sprintf("SELECT user_nicename FROM %susers", $wpdb->prefix) );
        $user = array_shift($user);
      	$contents = array(
      	  'name' => get_bloginfo('name'),
      	  'description' => get_bloginfo('description'),
      	  'author' => $user->user_nicename,
      	  'publisher' => $user->user_nicename,
      	  'publisher_website' => get_bloginfo('url'),
      	  'Section' => $sections
      	);
      	return $contents;
  	  }
  	}
  }
  
  function add_wps_subtitle_add_support() {
    $postTypes = array('biography', 'interview', 'essay', 'image');
    foreach ($postTypes as $type) {
      add_post_type_support( $type, 'wps_subtitle' );      
    }
  }
  add_action( 'init', 'add_wps_subtitle_add_support' );

  if (isset($_POST['epubster-api'])) {
    header('Access-Control-Allow-Origin: *');
    if (isset($_POST['data'])) {
    	$epubster = new EPUBster();
    	
    	//Clean the uploads directory
      $epubster->clean();
    	$contents = $epubster->get_contents($_POST['data']);  
  /*
    	$contents = array(
    	  array('id' => 24, 'resources' => array(52))
    	);
  
    	$contents = $epubster->get_contents($contents);  
  */
      $cssFile = plugin_dir_path( __FILE__ ).'styles/';
    	$path = $epubster->package($contents, $cssFile, false); 
    	echo $path.'.epub';
    }
    exit();
  }
?>