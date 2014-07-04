
define(['jquery', 'knockout', 'bootstrap', 'murrix', 'moment'], function($, ko, bootstrap, murrix, moment)
{
  var activeImages = [];
  var queuedImages = [];
  
  function loadImages(imageDone)
  {
    if (imageDone)
    {
      activeImages.splice(activeImages.indexOf(imageDone), 1);
    }
    
    while (queuedImages.length > 0 && activeImages.length < 5)
    {
      var toActivate = queuedImages.splice(0, Math.max(5 - activeImages.length, 0));
      
      for (var n = 0; n < toActivate.length; n++)
      {
        toActivate[n].src = toActivate[n]._src;
        delete toActivate[n]._src;
      }
      
      activeImages = activeImages.concat(toActivate);
    }
  }
  
  ko.bindingHandlers.print = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      console.dir(element);
      console.dir(ko.unwrap(valueAccessor()));
      console.dir(viewModel);
    }
  };
  
  ko.bindingHandlers.media = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      var $element = $(element);
      var image = new Image();
      var speed = "fast";
      var fadeSwitch = false;
      
      if (typeof value === "object")
      {
        speed = value.speed ? ko.utils.unwrapObservable(value.speed) : speed;
        fadeSwitch = value.fadeSwitch ? ko.utils.unwrapObservable(value.fadeSwitch) : fadeSwitch;
        
        value = ko.utils.unwrapObservable(value.url);
      }
      
      if (!value)
      {
        console.log("Will not load empty image");
        return;
      }
     
      var timestamp = new Date().getTime().toString();
      
      if (!fadeSwitch)
      {
        $element.html("<i class='fa fa-spinner' style='display: block; width: 12px; margin-top: 45%; margin-left: auto; margin-right: auto;'></i>");
      }
      
      $element.data("loadTimestamp", timestamp);

      image.onerror = function()
      {
        if ($element.data("loadTimestamp") === timestamp)
        {
          $element.html("<div class='text-danger' style='margin-top: 45%; text-align: center;'>Failed to load image!</div>");
        }
        
        loadImages(image);
      };
      
      image.onload = function()
      {
        if ($element.data("loadTimestamp") === timestamp)
        {
          var $image = $(image);
          
          $image.css("max-width", "100%");
          $image.css("max-height", "100%");

          if (fadeSwitch)
          {
            $image.hide();
            
            var child = $element.children();
            
            if (child.length > 0)
            {
              var offset = child.offset();
              var width = child.width();
              var height = child.height();
              
              child.css("position", "fixed");
              child.css("top", offset.top + "px");
              child.css("left", offset.left + "px");
              child.css("width", width + "px");
              child.css("height", height + "px");
              
              child.fadeOut(speed, function()
              {
                child.remove();
              });
              
              $element.append($image);
              $image.fadeIn(speed);
            }
            else
            {
              $element.append($image);
              $image.fadeIn(speed);
            }
          }
          else
          {
            $element.empty();
            $element.append($image);
          }
        }
        
        loadImages(image);
      };
      
      image._src = value;
      
      queuedImages.push(image);
      
      loadImages();
    }
  };
  
  ko.bindingHandlers.datetimeLocal = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());

      if (!value)
      {
        $(element).text("Unknown");
        return;
      }

      var dateItem = moment.utc(value * 1000).local();

      if (!dateItem.date())
      {
        $(element).html(value);
      }
      else
      {
        $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
      }
    }
  };

  ko.bindingHandlers.datetimeAgo = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      var dateItem = null;

      if (typeof value === "number")
      {
        dateItem = moment.unix(value);
      }
      else if (typeof value === "string")
      {
        dateItem = moment(value + "+0000", "YYYY-MM-DD HH:mm:ss Z");
      }
      else
      {
        $(element).html("never");
        return;
      }

      if (!dateItem.date())
      {
        $(element).html(ko.utils.unwrapObservable(value));
      }
      else
      {
        $(element).html(dateItem.fromNow());
      }
    }
  };
  
  ko.bindingHandlers.userName = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      
      murrix.server.emit("user.getName", { _id: value }, function(error, result)
      {
        if (error)
        {
          $(element).text("Unknown");
          console.log(error);
          return;
        }
        
        if (!result)
        {
          $(element).text("Unknown");
          return;
        }
        
        $(element).text(result);
      });
    }
  };
    
  ko.bindingHandlers.nodeName = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      
      murrix.server.emit("node.getName", { _id: value }, function(error, result)
      {
        if (error)
        {
          $(element).text("Unknown");
          console.log(error);
          return;
        }
        
        if (!result)
        {
          $(element).text("Unknown");
          return;
        }
        
        $(element).text(result.name);
      });
    }
  };
  
  ko.bindingHandlers.whereName = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var param = ko.utils.unwrapObservable(value);

      var where = param || false;

      if (!where || where === null)
      {
        $(element).text("Unknwon");
        return;
      }

      var whereId = where._id;
      var longitude = where.longitude;
      var latitude = where.latitude;

      if (whereId)
      {
        ko.bindingHandlers.nodeName.update(element, ko.observable(whereId));
      }
      else if (longitude && latitude)
      {
        // TODO: Look in our own database first
        var options = {};

        options.sensor = false;
        options.latlng = latitude + "," + longitude;

        jQuery.getJSON("http://maps.googleapis.com/maps/api/geocode/json", options, function(data)
        {
          if (data.status !== "OK" || data.results.length === 0)
          {
            $(element).text("unknown location");
            return;
          }

          $(element).text(data.results[0].formatted_address);
        });
      }
      else
      {
         $(element).text("Unknown");
      }
    }
  };
  
  ko.bindingHandlers.profilePicture = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      
      var action = "";
      var id = false;
      
      if (value.user)
      {
        action = "user.getProfilePictureInfo";
        id = value.user._id;
      }
      else if (value.node)
      {
        action = "node.getProfilePictureInfo";
        id = value.node._id;
      }
      else if (value.userId)
      {
        action = "user.getProfilePictureInfo";
        id = value.userId;
      }
      else if (value.nodeId)
      {
        action = "node.getProfilePictureInfo";
        id = value.nodeId;
      }
      else
      {
        console.log("Unknown type for profile picture", value);
        return;
      }

      murrix.server.emit(action, { _id: id }, function(error, result)
      {
        if (error)
        {
          $element.html("<span class='text-danger' style='margin-top: 45%; text-align: center;'>Failed to load image!</span>");
          console.log(error);
          return;
        }
        
        if (result.id === false)
        {
          $(element).css("text-align", "center");
          
          if (result.type === false)
          {
            if (value.user || value.userId)
            {
              result.type = "user";
            }
          }
          
          var icon = false;
          
          if (result.type === "album")
          {
            icon = "fa-book";
          }
          else if (result.type === "person")
          {
            icon = "fa-user";
          }
          else if (result.type === "location")
          {
            icon = "fa-map-marker";
          }
          else if (result.type === "camera")
          {
            icon = "fa-camera-retro";
          }
          else if (result.type === "vehicle")
          {
            icon = "fa-truck";
          }
          
          if (icon)
          {
            $(element).html("<i style='font-size: " + $(element).height() + "px;'; class='fa " + icon + "'></i>");
          }
          else
          {
            $(element).empty();
          }
          
          return;
        }
        
        var url = "/media/" + result.id + "/image/" + value.width;
          
        if (value.height)
        {
          url += "/" + value.height;
        }
        
        url += '?';
        
        if (result.angle)
        {
          url += "angle=" + result.angle + "&";
        }
        
        if (result.mirror)
        {
          url += "mirror=" + result.mirror + "&";
        }
        
        if (result.deinterlace)
        {
          url += "deinterlace=" + result.deinterlace + "&";
        }
        
        if (result.timeindex)
        {
          url += "timeindex=" + result.timeindex + "&";
        }
        
        //console.log(url);
        ko.bindingHandlers.media.update(element, ko.observable(url));
      });
    }
  };
  
  ko.bindingHandlers.htmlSize = {
    update: function(element, valueAccessor)
    {
      var fileSizeInBytes = ko.utils.unwrapObservable(valueAccessor());
      var i = -1;
      var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

      do
      {
          fileSizeInBytes = fileSizeInBytes / 1024;
          i++;
      } while (fileSizeInBytes > 1024);

      $(element).html(fileSizeInBytes.toFixed(1) + byteUnits[i]);
    }
  };

  //UUID
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// Outer HTML
(function($){
  $.fn.outerHtml = function() {
    if (this.length == 0) return false;
    var elem = this[0], name = elem.tagName.toLowerCase();
    if (elem.outerHTML) return elem.outerHTML;
    var attrs = $.map(elem.attributes, function(i) { return i.name+'="'+i.value+'"'; }); 
    return "<"+name+(attrs.length > 0 ? " "+attrs.join(" ") : "")+">"+elem.innerHTML+"</"+name+">";
  };
})(jQuery);

// Bind twitter typeahead
ko.bindingHandlers.typeahead = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var $element = $(element);
        var allBindings = allBindingsAccessor();
        var typeaheadArr = ko.utils.unwrapObservable(valueAccessor());
        
        $element.attr("autocomplete", "off")
                                .typeahead({
                                    'source': typeaheadArr,
                                    'minLength': allBindings.minLength,
                                    'items': allBindings.items,
                                    'updater': allBindings.updater
                                });
    }
};

// Bind Twitter Progress
ko.bindingHandlers.progress = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var $element = $(element);

                var bar = $('<div/>', {
                        'class':'bar',
                        'data-bind':'style: { width:' + valueAccessor() + ' }'
                });

                $element.attr('id', guid())
                        .addClass('progress progress-info')
                        .append(bar);

                ko.applyBindingsToDescendants(viewModel, $element[0]);
        }
}

// Bind Twitter Alert
ko.bindingHandlers.alert = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element);
            var alertInfo = ko.utils.unwrapObservable(valueAccessor());

            var dismissBtn = $('<button/>', {
                    'type':'button',
                    'class':'close',
                    'data-dismiss':'alert'
            }).html('&times;');

            var alertMessage = $('<p/>').html(alertInfo.message);

            $element.addClass('alert alert-'+alertInfo.priority)
                            .append(dismissBtn)
                            .append(alertMessage);
    }
};

// Bind Twitter Tooltip
ko.bindingHandlers.tooltip = {
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var $element, options, tooltip;
    options = ko.utils.unwrapObservable(valueAccessor());
    $element = $(element);
    tooltip = $element.data('tooltip');
    if (tooltip) {
      $.extend(tooltip.options, options);
    } else {
      $element.tooltip(options);
    }
  }
};

// Bind Twitter Popover
ko.bindingHandlers.popover = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                // read popover options 
                var popoverBindingValues = ko.utils.unwrapObservable(valueAccessor());

                // set popover title 
                var popoverTitle = popoverBindingValues.title;
                
                // set popover template id
                var tmplId = popoverBindingValues.template;

                // set popover trigger
                var trigger = 'click';

                if (popoverBindingValues.trigger) {
                        trigger = popoverBindingValues.trigger;
                }

                // update triggers
                if (trigger === 'hover') {
            trigger = 'mouseenter mouseleave';
        } else if (trigger === 'focus') {
            trigger = 'focus blur';
        }

                // set popover placement
                var placement = popoverBindingValues.placement;

                // get template html
                var tmplHtml = $('#' + tmplId).html();

                // create unique identifier to bind to
                var uuid = guid();
        var domId = "ko-bs-popover-" + uuid;

        // create correct binding context
        var childBindingContext = bindingContext.createChildContext(viewModel);

        // create DOM object to use for popover content
                var tmplDom = $('<div/>', {
                        "class" : "ko-popover",
                        "id" : domId
                }).html(tmplHtml);

                // set content options
                options = {
                        content: $(tmplDom[0]).outerHtml(),
                        title: popoverTitle
                };

                if (placement) {
                        options.placement = placement;
                }

                if (popoverBindingValues.container) {
                        options.container = popoverBindingValues.container;
                }

                // Need to copy this, otherwise all the popups end up with the value of the last item
        var popoverOptions = $.extend({}, ko.bindingHandlers.popover.options, options);

        // bind popover to element click
                $(element).bind(trigger, function () {
                        var popoverAction = 'show';
                        var popoverTriggerEl = $(this);

                        // popovers that hover should be toggled on hover
                        // not stay there on mouseout
                        if (trigger !== 'click') {
                                popoverAction = 'toggle';
                        }

                        // show/toggle popover
                        popoverTriggerEl.popover(popoverOptions).popover(popoverAction);

                        // hide other popovers and bind knockout to the popover elements
                        var popoverInnerEl = $('#' + domId);
                        $('.ko-popover').not(popoverInnerEl).parents('.popover').remove();
                
                        // if the popover is visible bind the view model to our dom ID
                        if($('#' + domId).is(':visible')){

                ko.applyBindingsToDescendants(childBindingContext, $('#' + domId)[0]);

                /* Since bootstrap calculates popover position before template is filled,
                 * a smaller popover height is used and it appears moved down relative to the trigger element.
                 * So we have to fix the position after the bind
                 *  */

                var triggerElementPosition = $(element).offset().top;
                var triggerElementLeft = $(element).offset().left;
                var triggerElementHeight = $(element).outerHeight();
                var triggerElementWidth = $(element).outerWidth();

                var popover = $(popoverInnerEl).parents('.popover');
                var popoverHeight = popover.outerHeight();
                var popoverWidth = popover.outerWidth();
                var arrowSize = 10;

                switch (popoverOptions.placement) {
                    case 'left':
                    case 'right':
                        popover.offset({ top: triggerElementPosition - popoverHeight / 2 + triggerElementHeight / 2 });
                        break;
                    case 'top':
                        popover.offset({ top: triggerElementPosition - popoverHeight - arrowSize, left: triggerElementLeft - popoverWidth / 2 + triggerElementWidth / 2 });
                        break;
                    case 'bottom':
                        popover.offset({ top: triggerElementPosition + triggerElementHeight + arrowSize, left:triggerElementLeft - popoverWidth/2 + triggerElementWidth/2});
                }
            }

            
            // bind close button to remove popover
            $(document).on('click', '[data-dismiss="popover"]', function (e) {
                popoverTriggerEl.popover('hide');
            });
                });

                // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
                return { controlsDescendantBindings: true };
        },
        options: {
                placement: "right",
                title: "",
                html: true,
                content: "",
                trigger: "manual"
        }
};
  
  return ko;
});
