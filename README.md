My Highlights
=============

This repository contains three projects, two WordPress plugins and a proof-of-concept mobile application. All three are probably not suited for production use, so proceed with proper caution.

##Highlights JSON API
This WordPress plugin is based on the [JSON API plugin for the Pods Framework](https://github.com/pods-framework/pods-json-api) and extends [WP API](https://github.com/WP-API/WP-API) with a number of methods normally not allowed or not yet implemented by the official REST API. As such this plugin introduces a number of shortcuts and exposes some information (Post Meta, for example) which is normally not public except for authenticated users.

##EPUBster
This plugin packages the EPUB functions from [the EPUBster project](https://github.com/DigitalPublishingToolkit/epubster) and is built on PHPePub by Asbjørn Grandt. The plugin compiles a selection of WordPress posts and associated custom Post Meta into an EPUB.

##My Highlights
My Highlights is a single page application (written in [jQuery](http://jquery.com) and using [flatiron director](https://github.com/flatiron/director) for routing) which interfaces with the WP API using AJAX requests. The application allows users to browse and select objects from a collection (works from the Stedelijk Museum catalogue in this case) and generate an EPUB based on the chosen objects. As this is a proof-of-concept the application is not optimised for production use, the many AJAX requests per screen transition need to be addressed for example.