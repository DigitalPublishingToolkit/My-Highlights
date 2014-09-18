Handlebars.registerHelper('get-thumbnail', function() {
  if (this.featured_image.attachment_meta.sizes.medium) {
    return this.featured_image.attachment_meta.sizes.medium.url; 
  }
});

Handlebars.registerHelper('split-periods', function() {
  var periods = this.name.split('-');
  return '<span class="btn-label">'+periods[0].trim()+'</span><span class="btn-label">'+periods[1].trim()+'</span>';
});

Handlebars.registerHelper('is-my-highlight', function() {
  if (this.active) {
    return ' active';
  }
});

Handlebars.registerHelper('parse-totals', function() {
  return accounting.formatMoney(this.amount, "€ ", 2, ".", ",");
});

function listScroll(list) {
  var width = 0;
  var height = 0;
  
  $('.highlights-filter-list li', $(list)).each(function() {
    width += $(this).outerWidth( true )+20;
    
    if ($(this).height() > height) {
      height = $(this).height();
    }
  });
  
  $('ul', $(list)).css({'width' : width, 'height' : height});
  $(list).css({ 'height' : height });
  
  new IScroll(list, {
    scrollX: true,
    scrollY: false, 
    mouseWheel: true
  });
}

function resizeViewPort() {
  var viewportWidth = $(window).width()+'px';
  var viewportHeight = $(window).height()+'px';
  $("#app-canvas-container").css({'width' : viewportWidth, 'height' : viewportHeight});
  $("#app-canvas").css({'width' : viewportWidth });
}

function renderTemplate(templateId, targetId, data) {
  if (templateId && targetId) {
    var source   = $(templateId).html();
    var template = Handlebars.compile(source);
    
    //Populate a template with data, or render an empty template
    if (data) {
      var html = template(data);      
    } else {
      var html = template;
    }
    $(targetId).hide().html(html).fadeIn('fast');
  }
}