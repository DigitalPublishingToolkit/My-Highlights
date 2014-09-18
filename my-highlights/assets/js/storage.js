function getMyResources(postId, myHighlights) {
  var resources = [];
  if (myHighlights) {
    $.each(myHighlights, function(index, myHighlight) {
      if (postId == myHighlight.id) {
        resources = myHighlight.resources;
        return false;
      }
    });    
  }
  return resources;
}

function saveMyHighlights(id, resource, price, remove) {
  if (id && resource) {
    var myHighlights = getMyHighlights();
    var myHighlightsTotals = $.jStorage.get('my-highlights-totals');
    var price = parseFloat(price);
    
    if (!myHighlightsTotals) {
      var myHighlightsTotals = 0;
    }
    
    if (myHighlights && myHighlights !== null) {
      var updated = false;
      $(myHighlights).each(function(index, highlight) {
        if (highlight.id === id) {
          if (remove) {
            var key = highlight.resources.indexOf(resource);
            if (key !== -1) {
              highlight.resources.splice(key, 1);
              
              if (highlight.resources.length === 0) {
                myHighlights.splice(index, 1);                
              }
              
              myHighlightsTotals -= price;
            }
          } else if ($.inArray(resource, highlight.resources) === -1) {
            highlight.resources.push(resource);
            
            myHighlightsTotals += price;
          }
          updated = true;
          return false;
        }
      });

      if (!updated) {
        myHighlights.push({ id : id, resources : [resource] });
        myHighlightsTotals += price;
      }
    } else {
      //Create new object
      var myHighlights = [
        { id : id, resources : [resource] },
      ];
      myHighlightsTotals += price;
    }
    $.jStorage.set('my-highlights-totals', myHighlightsTotals);
    $.jStorage.set('my-highlights', myHighlights);
  }
};

function getMyHighlights() {
  var myHighlights = $.jStorage.get('my-highlights');
  return myHighlights;
};

function deleteMyHighlights() {
  $.jStorage.deleteKey('my-highlights-totals');
  $.jStorage.deleteKey('my-highlights');
};
