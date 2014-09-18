/*
  @codekit-prepend "../assets/bower_components/modernizr/modernizr.js";
  @codekit-prepend "../assets/bower_components/spinjs/spin.js";
  @codekit-prepend "../assets/bower_components/iscroll/build/iscroll.js";
  @codekit-prepend "../assets/bower_components/jquery/dist/jquery.js";
  @codekit-prepend "../assets/bower_components/jquery-json/src/jquery.json.js";
  @codekit-prepend "../assets/bower_components/jquery.inview/jquery.inview.js";
  @codekit-prepend "../assets/bower_components/jstorage/jstorage.js";
  @codekit-prepend "../assets/bower_components/spinjs/jquery.spin.js";
  @codekit-prepend "../assets/bower_components/easyModal.js/jquery.easyModal.js";
  @codekit-prepend "../assets/bower_components/accounting.js/accounting.js";  
  @codekit-prepend "../assets/bower_components/director/build/director.js";
  @codekit-prepend "../assets/bower_components/handlebars/handlebars.js";
  @codekit-prepend "../assets/bower_components/masonry/dist/masonry.pkgd.js";
  @codekit-prepend "../assets/js/storage.js";
  @codekit-prepend "../assets/js/templating.js";
*/

var DATA_URL = 'http://spielplatz.puntpixel.nl/highlights/wp-json/';
var GENERATION_URL = 'http://spielplatz.puntpixel.nl/highlights/';

/*
var DATA_URL = 'http://localhost/~mensch/highlights/wordpress/wp-json/';
var GENERATION_URL = 'http://localhost/~mensch/highlights/wordpress/';
*/
var postTypes = ['biography', 'essay', 'interview', 'image'];
var scroller;

function attachSpinner() {
  //Do not show spinner on generate page
  //if ($('#highlights-generate').length === 0) {
    $('#header').addClass('is-loading').append('<div class="loading-container"><div class="loading"></div></div>');
    $('#header .loading').spin({
      lines: 11, // The number of lines to draw
      length: 4, // The length of each line
      width: 1, // The line thickness
      radius: 4, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 50, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: true, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9 // The z-index (defaults to 2000000000)
    });    
  //}
}

$(document).ajaxError(function() {
  $('#higlights-error').easyModal({
  	top: 200,
  	overlayOpacity: 1,
  	overlayClose: false
  });
  $('#higlights-error').trigger('openModal');
  
  $('#higlights-error .retry').on('click', function(event) {
    location.reload();
    event.preventDefault();
  });
});

$(document).ajaxStart(function() {
  attachSpinner();
});

$(document).ajaxStop(function() {
  $('#header .loading-container').fadeOut('fast', function() { 
    this.remove();
    $('#header').removeClass('is-loading');
  });
  setTimeout(function () {
    scroller.refresh();
  }, 100);
});

function toggleChoices(id) {
  $('ul.choices:not(#highlights-my-choices):not(#highlights-checkout-choices) a').off('click').on('click', function(event) {
    if (id) {
      var choice = $(this);
      var resource = choice.attr('id').substr(9);

      var url = DATA_URL+'highlights/get_price/'+resource;
      $.get(url, function(price) {
        var remove = false;

        if (choice.hasClass('active')) {
          var remove = true;
        }
        saveMyHighlights(id, resource, price, remove);
        
        //The totals header is visible
        if ($('#highlights-header-total').length !== 0) {
          updateMyHighlightTotals();
        }

        //Totals on a single page
        if ($('#highlight-details').length !== 0) {
          renderTemplate('#highlights-subtotals-template', '#header', { amount : price });
          
          //Item is added
          if (!choice.hasClass('active')) {
            $('#highlights-header-total-add').show();
            $('#highlights-header-total-subtract').hide();          
          } else {
            $('#highlights-header-total-add').hide();
            $('#highlights-header-total-subtract').show();          
          }
        }
        choice.toggleClass('active');
      });

      event.preventDefault();      
    }
  });
}

function updateMyHighlightTotals() {
  var myHighlightsTotals = $.jStorage.get('my-highlights-totals');
  renderTemplate('#highlights-totals-template', '#header', { amount : myHighlightsTotals });
}

var highlights = function (taxonomy, slug) {
  //Render layout
  renderTemplate('#highlights-template', '#app-canvas', null);
  $('#header-search, #header-title').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-highlights').addClass('active');
    
  var url = DATA_URL+'posts';
  if (taxonomy && slug) {
    var url = DATA_URL+'highlights/get_taxonomy_posts/'+taxonomy+'/'+slug;
  }

  $.get(url, function(data) {
    if (data !== null) {
      var data = { highlights : data };
      var templateId = "#highlights-item-template";
      var targetId = '#highlights-container';
      renderTemplate(templateId, targetId, data);
      
      if (taxonomy && slug) {
        $('#page-header').remove();
      }

      if ($('#highlights-overview').data('masonry') !== undefined) {
        $('#highlights-overview').masonry('destroy');
      }
      $('#highlights-overview').masonry({
        columnWidth: ".grid-sizer",
        gutter: 10,
        itemSelector: '.highlight'
      });
    }
  });
};

var highlight = function(id) {
  //Render layout
  renderTemplate('#highlights-single-template', '#app-canvas', null);
  $('#header-search, #header-title').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-highlights').addClass('active');
    
  //Get the selected highlights for the current user
  var myHighlights = getMyHighlights();
  var myResources = getMyResources(id, myHighlights);
  
  var url = DATA_URL+'highlights/'+id;
  $.get(url, function(data) {
    if (data !== null) {
      var url = DATA_URL+'highlights/get_media/'+id;
      $.get(url, function(attachments) {
        data.attachments = attachments;

        var url = DATA_URL+'highlights/get_related/'+id;
        $.get(url, function(resources) {
          $.each(resources, function(index, resource) {
            if (myResources && $.inArray(resource.ID.toString(), myResources) !== -1) {
              resource.active = true;
            }
          });
          data.resources = resources;
          var templateId = "#highlight-details-template";
          var targetId = '#highlight-details';
          renderTemplate(templateId, targetId, data);
          
          toggleChoices(id);
          
          var url = DATA_URL+'highlights/get_meta/'+id;
          $.get(url, function(meta) {
            renderTemplate('#highlights-metadata-template', '#highlight-details-metadata', { meta : meta });
          });
        });
      });
    }
  });
};

var search = function () {
  //Render layout
  renderTemplate('#highlights-search-template', '#header', null);
  $('.page').addClass('search-active');
  $('#page-header').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-search').addClass('active');
    
  var timeout = null;  
  $('input#search').focus().on('keyup', function() {
    $('#header-search .icon-close:hidden').fadeIn('fast');
    clearTimeout(timeout);
    var search = $(this).val();
    timeout = setTimeout(function() {
      if (search.length > 3) {
        var url = DATA_URL+'posts?filter[s]='+search;
        $.get(url, function(data) {
          if (data !== null) {
            renderTemplate('#highlights-template', '#app-canvas', null);
            $('#page-header').remove();
            
            var data = { highlights : data };
            var templateId = "#highlights-item-template";
            var targetId = '#highlights-container';
            renderTemplate(templateId, targetId, data);
      
            if ($('#highlights-overview').data('masonry') !== undefined) {
              $('#highlights-overview').masonry('destroy');
            }
            $('#highlights-overview').masonry({
              columnWidth: ".grid-sizer",
              gutter: 10,
              itemSelector: '.highlight'
            });
          }
        });
      }
    }, 500); 
  });
  
  $('#header-search .icon-close').on('click', function(event) {
    $('input#search').val('').focus();
    event.preventDefault();
  });
};

var filter = function () {
  //Render layout
  renderTemplate('#highlights-filter-template', '#app-canvas', null);
  $('#header-search, #header-title').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-filter').addClass('active');
  
  var taxonomies = [ 'movements', 'collections', 'periods' ];
  $(taxonomies).each(function(index, taxonomy) {
    var url = DATA_URL+'taxonomies/'+taxonomy+'/terms';
    $.get(url, function(data) {
      if (data !== null) {
        var data = { items : data, taxonomy : taxonomy };
        var templateId = "#highlights-filter-list-"+taxonomy+"-template";
        var targetId = '#highlights-filter-list-'+taxonomy;
        renderTemplate(templateId, targetId, data);
        
        listScroll(targetId);
        
        scroller.refresh();
      }
    });
  });
};

var guide = function () { 
  //Render layout
  renderTemplate('#highlights-guide-template', '#app-canvas', null);
  $('#header-search, #header-title').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-guide').addClass('active');
  scroller.refresh();
};

var myHighlights = function () {
  //Get the selected highlights for the current user
  var myHighlights = getMyHighlights();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-my-highlights').addClass('active');
  
  var queryString = '';
  if (myHighlights && myHighlights.length !== 0) {
    $.each(myHighlights, function(index, myHighlight) {
      if (index === 0) {
        queryString += '?filter[post__in][]='+myHighlight.id;      
      } else {
        queryString += '&filter[post__in][]='+myHighlight.id; 
      }
    });
    var url = DATA_URL+'highlights'+queryString;
    $.get(url, function(data) {
      $('#header-search').remove();
      $('#highlights-checkout-choices').hide();
      $('#highlights-my-choices').fadeIn('fast');
    
      //Render layout
      var data = { items : data };
      renderTemplate('#highlights-my-template', '#app-canvas', data);
      updateMyHighlightTotals();
  
      if ($('.lean-overlay').length === 0) {
        $('#higlights-clear-all').easyModal({
        	top: 200,
        	overlayOpacity: 0.8,
        });        
      }
  
      $('#clear-my-highlights').on('click', function(event) {
        $('#higlights-clear-all').trigger('openModal');
        event.preventDefault();
      });
      
      $('#higlights-clear-all a.clear').on('click', function(event) {
        deleteMyHighlights();
        window.location.hash = "#my-highlights"
        location.reload();
        event.preventDefault();
      });
  
      $('.highlight-my .highlight-my-resources').on('inview', function(event, isInView) {
        if (isInView && $('li', $(this)).length === 0) {
          var container = $(this).parents('.highlight-my');
          var id = container.attr('id').substr(13);
          
          //Get the chosen resources
          var myResources = getMyResources(id, myHighlights);
  
          var url = DATA_URL+'highlights/get_related/'+id;
          $.get(url, function(resources) {
            $.each(resources, function(index, resource) {
              if (myResources && $.inArray(resource.ID.toString(), myResources) !== -1) {
                resource.active = true;
              }
            });
            var targetId = '#'+container.attr('id')+' .highlight-my-resources';
            renderTemplate('#highlights-my-resources-template', targetId, {items : resources});
            toggleChoices(id);
  
            var width = 0;
            $('li a', $(targetId)).each(function() {
              width += 108+20;
            });
            $(targetId).css('width', width);
            new IScroll('#'+container.attr('id'), {
              scrollX: true,
              scrollY: false, 
              mouseWheel: true
            });
          });
        }
      });
    });
  } else {
    //Render layout
    renderTemplate('#highlights-my-template', '#app-canvas', null);
  }
};

var checkout = function () { 
  //Render layout
  renderTemplate('#highlights-checkout-template', '#app-canvas', null);
  $('#header-search').remove();
  $('#highlights-my-choices').hide();
  $('#highlights-checkout-choices').fadeIn('fast');
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-my-highlights').addClass('active');
  scroller.refresh();
};

var generate = function () { 
  //Render layout
  renderTemplate('#highlights-generate-template', '#app-canvas', null);
  $('#header-search, #header-title').remove();
  $('#highlights-my-choices, #highlights-checkout-choices').hide();
  $('#header').removeClass('is-loading');
  $('#footer ul li a').removeClass('active');
  $('#btn-my-highlights').addClass('active');
  
  var myHighlights = getMyHighlights();

  var myHighlightsData = {
    'epubster-api' : true,
    'data' : myHighlights
  };
  
  $.ajax(GENERATION_URL, {
    type : 'POST',
    data : myHighlightsData,
    error : function() {
      $('#progress-icon .icon').removeClass('icon-gear').addClass('icon-cancel');
      $('#highlights-generate-progress').hide();
      $('#highlights-generate-error').show();
    },
    success : function(url) {
      if (url) {
        $('#progress-icon .icon').removeClass('icon-gear').addClass('icon-checkmark-large');
        $('#highlights-generate-progress').hide();
        $('#highlights-generate-success').show();        
        
        $('#highlights-generate-download').attr('href', url);
      } else {
        $('#progress-icon .icon').removeClass('icon-gear').addClass('icon-cancel');
        $('#highlights-generate-progress').hide();
        $('#highlights-generate-error').show();        
      }
    }
  });
};

var routes = {
  '/' : highlights,
  '/highlights/': highlights,
  '/highlights/:taxonomy/:slug': highlights,
  '/highlight/:id': highlight,
  '/search': search,
  '/filter': filter,
  '/guide': guide,
  '/my-highlights': myHighlights,
  '/checkout': checkout,
  '/generate': generate  
};

var router = Router(routes);

router.init('/');

$(document).ready(function() {
  resizeViewPort();
  scroller = new IScroll('#app-canvas-container', {
    mouseWheel: true,
    scrollbars: true,
    fadeScrollbars: true,
    click: true
  });  
});

$(window).resize(function() { 
  resizeViewPort();
});