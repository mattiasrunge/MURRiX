
$(function()
{
  ko.bindingHandlers.toggle = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      $(element).off("click");

      $(element).on("click", function(event)
      {
        value(!value());
        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.ifset = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).toggle(typeof value !== 'undefined' && value === true);
    }
  };

  ko.bindingHandlers.ifnotset = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).toggle(typeof value === 'undefined' || value !== true);
    }
  };


  ko.bindingHandlers.draggable = {
    init: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      value.id = ko.utils.unwrapObservable(value.id);
      value.type = ko.utils.unwrapObservable(value.type);

      if (!value.id || !value.type)
      {
        return;
      }

      $(element).prop("draggable", true);

      $(element).on("dragstart", function(event)
      {
        murrix.dnd.start(value.id, value.type);
      });

      $(element).on("dragend", function(event)
      {
        murrix.dnd.end();
      });
    }
  };

  ko.bindingHandlers.target = {
    init: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      value.handler = ko.utils.unwrapObservable(value.handler);
      value.types = ko.utils.unwrapObservable(value.types);

      if (!value.handler)
      {
        return;
      }

      $(element).addClass("drop-target");

      var subscription = murrix.dnd.type.subscribe(function(type)
      {
        if ($(element).is(":visible"))
        {
          if (type === false)
          {
            $(element).removeClass("drop-target-highlight");
          }
          else
          {
            if (!value.types || murrix.inArray(type, value.types))
            {
              $(element).addClass("drop-target-highlight");
            }
          }
        }
        else
        {
          subscription.dispose();
        }
      });

      $(element).on("drop", function(event)
      {
        if (!value.types || murrix.inArray(murrix.dnd.type(), value.types))
        {
          event.preventDefault();
          event.stopPropagation();

          $(element).removeClass("drop-target-active");
          value.handler(murrix.dnd.id(), murrix.dnd.type());
        }
      });

      $(element).on("dragenter", function(event)
      {
        if (!value.types || murrix.inArray(murrix.dnd.type(), value.types))
        {
          $(element).addClass("drop-target-active");
          return true;
        }

        return false;
      });

      $(element).on("dragover", function(event)
      {
        if (!value.types || murrix.inArray(murrix.dnd.type(), value.types))
        {
          event.preventDefault();
          event.stopPropagation();
        }
      });

      $(element).on("dragleave", function(event)
      {
        if (!value.types || murrix.inArray(murrix.dnd.type(), value.types))
        {
          $(element).removeClass("drop-target-active");
          return true;
        }

        return false;
      });
    }
  };

  ko.bindingHandlers.clickKey = {
    init: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());

      $(document).bind("keydown", value, function()
      {
        if ($(element).is(":visible"))
        {
          $(element).trigger("click");
        }
        else
        {
          $(document).unbind("keydown", this);
        }
      });
    }
  };

  /* Knockout visibility changer (fading) handler  */
  ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor)
    {
      var value = valueAccessor();

      $(element).toggle(ko.utils.unwrapObservable(value));
    },
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      $(element).stop(false, true);

      if ($(element).is(":visible") !== ko.utils.unwrapObservable(value))
      {
        if (ko.utils.unwrapObservable(value))
        {
          $(element).fadeIn();
        }
        else
        {
          $(element).fadeOut();
        }
      }
    }
  };

  /* Knockout visibility changer (fading) handler  */
  ko.bindingHandlers.slideVisible = {
    init: function(element, valueAccessor)
    {
      var value = valueAccessor();

      if ($(element).is(":visible"))
      {
        //$(element).height($(element).height());
      }

      //$(element).toggle(ko.utils.unwrapObservable(value));
    },
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());

      $element = $(element);

      if ($element.is(":animated"))
      {
        if ($element.data("slideTarget") !== value)
        {
          $element.data("slideTarget", value);

          if (value)
          {
            $element.show("slide", function() { /*$element.height('');*/ });
          }
          else
          {
            //$element.height($element.height());
            $element.hide("slide");
          }
        }
      }
      else
      {
        $element.data("slideTarget", value);

        if (value)
        {
          $element.show("slide", function() { /*$element.height('');*/ });
        }
        else
        {
          //$element.height($element.height());
          $element.hide("slide");
        }
      }
    }
  };

   ko.bindingHandlers.popoverNode = {
    update: function(element, valueAccessor)
    {
      var id = ko.utils.unwrapObservable(valueAccessor());

      if (!id)
      {
        return;
      }

      murrix.cache.getNode(id, function(error, node)
      {
        if (error)
        {
          console.log(id, error);
          return;
        }

        var options = {};

        var imgUrl = "http://placekitten.com/g/60/60";

        if (node._profilePicture && node._profilePicture() !== false)
        {
          imgUrl = "/preview?id=" + node._profilePicture() + "&width=60&height=60&square=1";
        }

        options.html = true;
        options.trigger = "hover";
        options.placement = "left";
        options.delay = { show: 200, hide: 100 };
        options.title = node.name();
        options.content = "<img style='width: 60px; height: 60px;' class='imgRounded' src='" + imgUrl + "'/>";

        $(element).popover(options);
      });
    }
  };


  ko.bindingHandlers.typeahead = {
    update: function(element, valueAccessor)
    {
      var options = valueAccessor();

      if (!options.sorter)
      {
        options.sorter = function(items) { return items; };
      }

      $(element).typeahead(options);
    }
  };

  ko.bindingHandlers.yearSlider = {
    update: function(element, valueAccessor)
    {
      var options = valueAccessor();

      $(element).slider({
        value: ko.utils.unwrapObservable(options.year),
        min: options.min ? options.min : 1800,
        max: options.max ? options.max : new Date().getFullYear(),
        step: 1,
        start: function(event, ui) { options.sliding(true); },
        slide: function(event, ui) { options.year(ui.value); },
        stop: function(event, ui) { options.sliding(false); options.year.valueHasMutated(); }
      });
    }
  };


  ko.bindingHandlers.htmlPrintWhere = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var param = ko.utils.unwrapObservable(value);

      var where = param || false;

      $(element).popover('destroy');

      if (!where || where === null)
      {
        $(element).html("unknown location");
        return;
      }

      $(element).text("...loading...");

      var whereId = ko.utils.unwrapObservable(where._id);
      var longitude = ko.utils.unwrapObservable(where.longitude);
      var latitude = ko.utils.unwrapObservable(where.latitude);

      if (whereId)
      {
        murrix.cache.getNodes([ whereId ], function(error, nodeList)
        {
          if (error)
          {
            $(element).text(error);
            return;
          }

          if (nodeList[whereId])
          {
            $(element).html("<a href='#node:" + whereId + "'>" + nodeList[whereId].name() + "</a>");
          }
          else
          {
            $(element).text("unknown location");
          }
        });
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

          /*var text = "";

          text += "Latitude: " + where.latitude();
          text += "<br/>";
          text += "Longitude: " + where.longitude();
          text += "<br/>";
          text += "Source: " + where.source();

          var options = {
            html      : true,
            placement : "left",
            trigger   : "hover",
            title     : "Where - " + data.results[0].formatted_address,
            content   : text,
            delay     : { show: 200, hide: 100 }
          }

          $(element).popover(options);*/
        });
      }
      else
      {
         $(element).html("unknown location");
      }
    }
  };

  ko.bindingHandlers.htmlPrintWhen = {
    update: function(element, valueAccessor)
    {
      var data = ko.utils.unwrapObservable(valueAccessor()) || false;

      $(element).popover('destroy');

      if (data === false)
      {
        $(element).html("Unknown date and time");
        return;
      }

      var when = ko.utils.unwrapObservable(data.when);
      var timezone = murrix.parseTimezone(ko.utils.unwrapObservable(data.timezone));
      var timestamp = ko.utils.unwrapObservable(when.timestamp);

      if (!timestamp)
      {
        $(element).html("No date and time set");
        return;
      }

      var dateItem = moment.utc(timestamp * 1000).local(); // TODO: Make date to local timezone!

      if (!dateItem.date())
      {
        $(element).html("Failed to create date");
        return;
      }

      var format = data.format || "dddd, MMMM Do YYYY, HH:mm:ss";

      if (!data.format)
      {
        if (typeof when.source !== "function")
        {
          var type = ko.utils.unwrapObservable(when.source.type);

          if (type === "manual")
          {
            var datestring = ko.utils.unwrapObservable(when.source.datestring);
            var parts = datestring.replace(/-/g, " ").replace(/:/g, " ").split(" ");

            if (parts[0] === "XXXX") // Year missing
            {
              format = "[No date and time set]";
            }
            else if (parts[1] === "XX") // Month missing
            {
              format = "YYYY";
            }
            else if (parts[2] === "XX") // Day missing
            {
              format = "MMMM YYYY";
            }
            else if (parts[3] === "XX") // Hour missing
            {
              format = "dddd, MMMM Do YYYY";
            }
            else if (parts[4] === "XX") // Minute missing
            {
              format = "dddd, MMMM Do YYYY, HH";
            }
            else if (parts[5] === "XX") // Second missing
            {
              format = "dddd, MMMM Do YYYY, HH:mm";
            }

            // Full date exists!
          }
        }
      }

      var title = dateItem.format(format) + " (local)";

      $(element).html(title);

      if (data.popover)
      {
        var text = "";

        if (typeof when.source !== "function")
        {
          text += "<table class='table table-condensed table-striped'>";

          text += "<tr>";
          text += "<td>Timestamp</td><td>" + when.timestamp() + "</td>";
          text += "</tr>";

          text += "<tr>";
          text += "<td>Type</td><td>" + when.source.type() + "</td>";
          text += "</tr>";

          text += "<tr>";
          text += "<td>Datestring</td><td>" + when.source.datestring() + "</td>";
          text += "</tr>";

          if (when.source.reference && when.source.reference() !== "None")
          {
            text += "<tr>";
            text += "<td>Referance</td><td>If a references exists it will be used</td>";
            text += "</tr>";
          }

          if (when.source.timezone && when.source.timezone() !== false)
          {
            text += "<tr>";
            text += "<td>Timezone</td><td>" + when.source.timezone() + "</td>";
            text += "</tr>";
          }

          if (when.source.daylightSavings)
          {
            text += "<tr>";
            text += "<td>Daylight savings</td><td>" + (when.source.daylightSavings() ? "Yes" : "No") + "</td>";
            text += "</tr>";
          }

          if (when.source.comment && when.source.comment() !== "")
          {
            text += "<tr>";
            text += "<td>Comment</td><td>" + when.source.comment() + "</td>";
            text += "</tr>";
          }

          text += "</table>";

          if (ko.utils.unwrapObservable(data.timezone) === false)
          {
            text += "<span class='muted'>No information found on the timezone where this item was created, will display the time in your local timezone.</span>";
          }
        }

        var options = {
          html      : true,
          placement : "left",
          trigger   : "hover",
          title     : title,
          content   : "<div style='font-size: 10px;'>" + text + "</div>",
          delay     : { show: 200, hide: 100 }
        };

        $(element).popover(options);
      }
    }
  };

  ko.bindingHandlers.htmlPrintWith = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var param = ko.utils.unwrapObservable(value);

      var withId = param || false;

      $(element).popover('destroy');

      if (!withId || withId === null)
      {
        $(element).text("an unknown device");
        return;
      }

      $(element).text("...loading...");

      murrix.cache.getNodes([ withId ], function(error, nodeList)
      {
        if (error)
        {
          $(element).text(error);
          return;
        }

        if (!nodeList[withId])
        {
          $(element).text("an unknown device");
          return;
        }

        var title = "<a href='#node:" + withId + "'>" + nodeList[withId].name() + "</a>";

        $(element).html("the " + title);

        var text = "";

        text += "Type: " + nodeList[withId].type();

//         if (nodeList[withId]._owners)
//         {
//           text += "<br/>";
//           text += "Owner: " + nodeList[withId]._owner();
//         }

        var options = {
          html      : true,
          placement : "left",
          trigger   : "hover",
          title     : "With - " + nodeList[withId].name(),
          content   : text,
          delay     : { show: 200, hide: 100 }
        };

        $(element).popover(options);
      });
    }
  };

  ko.bindingHandlers.htmlPrintOwner = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var param = ko.utils.unwrapObservable(value);

      var withId = param || false;

      $(element).popover('destroy');

      if (!withId || withId === null)
      {
        $(element).text("unknown");
        return;
      }

      $(element).text("...loading...");

      murrix.cache.getNodes([ withId ], function(error, nodeList)
      {
        if (error)
        {
          $(element).text(error);
          return;
        }

        if (!nodeList[withId])
        {
          $(element).text("unknown");
          return;
        }

        murrix.cache.getNodes(nodeList[withId]._owners(), function(error, ownerNodeList)
        {
          if (error)
          {
            $(element).text(error);
            return;
          }

          var owners = [];

          for (var n = 0; n < nodeList[withId]._owners().length; n++)
          {
            if (ownerNodeList[nodeList[withId]._owners()[n]])
            {
              var href = "<a href='#node:" + nodeList[withId]._owners()[n] + "'>" + ownerNodeList[nodeList[withId]._owners()[n]].name() + "</a>";
              owners.push(href)
            }
          }

          if (owners.length === 0)
          {
            $(element).html("none");
          }
          else
          {
            $(element).html(owners.join(", "));
          }
        });
      });
    }
  };


  /* Knockout text, set attribute of item loaded async */

/* ko.bindingHandlers.textItemAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      if (params[0] === null ||  params[0] === "")
      {
        $(element).text("Unknown");
        return;
      }

      $(element).text("Loading " + params[1] + "...");

      murrix.cache.getItem(params[0], function(error, item)
      {
        if (error)
        {
          $(element).text(error);
          return;
        }

        $(element).text(item.specific[params[1]]());
      });
    }
  };*/

  /* Knockout text, set attribute of node loaded async */
  ko.bindingHandlers.textNodeAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      if (params[0] === null ||  params[0] === "")
      {
        $(element).text("Unknown");
        return;
      }

      $(element).text("Loading " + params[1] + "...");

      murrix.cache.getNode(params[0], function(error, node)
      {
        if (error)
        {
          $(element).text("Unknown");
          return;
        }

        $(element).text(node[params[1]]());
      });
    }
  };

  /* Knockout text, set attribute of group loaded async */
  ko.bindingHandlers.textGroupAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;

      if (!id || id === null || id === "")
      {
        $(element).text("Unknown");
        return;
      }

      $(element).text("Loading " + params[1] + "...");

      murrix.cache.getGroups([ id ], function(error, groupList)
      {
        if (error)
        {
          $(element).text("Unknown");
          return;
        }

        if (groupList[id])
        {
          $(element).text(groupList[id][params[1]]());
        }
        else
        {
          $(element).text("Unknown");
        }
      });
    }
  };

  /* Knockout text, set attribute of group loaded async */
  ko.bindingHandlers.textUserAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;

      if (!id || id === null || id === "")
      {
        $(element).text("Unknown");
        return;
      }

      $(element).text("Loading " + params[1] + "...");

      murrix.cache.getUsers([ id ], function(error, userList)
      {
        if (error)
        {
          $(element).text("Unknown");
          return;
        }

        if (userList[id])
        {
          $(element).text(userList[id][params[1]]());
        }
        else
        {
          $(element).text("Unknown");
        }
      });
    }
  };



/*
  ko.bindingHandlers.itemImage = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var request = ko.mapping.toJS(value);

      if (!request.id)
      {
        console.log("Missing id parameter for itemImage binding");
        return;
      }



      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;
      var timestamp = params[1] || 0;

      if (!id || id === null)
      {
        $(element).attr("src", "http://placekitten.com/g/1400/1400"); // TODO: Set generic user icon image
        console.log("No id given to srcItemPicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      var src = "/preview?id=" + id + "&width=1400&timestamp=" + timestamp+(new Date().getTime());

      var image = new Image();

      image.onload = function()
      {
        $(element).attr("src", src);
      };

      image.onerror = function()
      {
        $(element).attr("src", "http://placekitten.com/g/1400/1400");// TODO: Set error image
      };

      image.src = src;
    }
  };*/




  ko.bindingHandlers.srcItemPicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;
      var timestamp = params[1] || 0;

      if (!id || id === null)
      {
        $(element).attr("src", "http://placekitten.com/g/1400/1400"); // TODO: Set generic user icon image
        console.log("No id given to srcItemPicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      var src = "/preview?id=" + id + "&width=1400&timestamp=" + timestamp+(new Date().getTime());

      var image = new Image();

      image.onload = function()
      {
        $(element).attr("src", src);
      };

      image.onerror = function()
      {
        $(element).attr("src", "http://placekitten.com/g/1400/1400");// TODO: Set error image
      };

      image.src = src;
    }
  };

  ko.bindingHandlers.posterVideo = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var timestamp = params[3] || 0;

      if (!id || id === null || id === "")
      {
        $(element).attr("poster", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to posterVideo");
        return;
      }

      $(element).attr("poster", "/preview?id=" + id + "&width=" + width + "&height=" + height + "&timestamp=" + timestamp);
    }
  };

  ko.bindingHandlers.srcPicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var $element = $(element);
      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var square = params[3] || 0;
      var cacheId = params[4] || 0;
      var delayedLoad = params[5] === false ? false : true;

      if (!id || id === null || id === "")
      {
        $element.prop("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to srcPicture");
        return;
      }

//       if (width > 0 && height > 0)
//       {
//         $element.width(width);
//         $element.height(height);
//       }

      //$(element).attr("src", "img/120x120_spinner.gif");

      murrix.cache.initImage($element, { id: id, width: width, height: height, square: square, cacheId: cacheId, delayedLoad: delayedLoad });
    }
  };

  /* Knockout src, get profile picture async */
  ko.bindingHandlers.srcNodeProfilePicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var $element = $(element);
      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var square = params[3] || 0;
      var delayedLoad = params[4] === false ? false : true;

      if (!id || id === null || id === "")
      {
        $element.prop("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to srcNodeProfilePicture");
        return;
      }

      murrix.cache.getNode(id, function(error, node)
      {
        if (error)
        {
          $element.prop("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
          console.log("error received from the server: " + error);
          return;
        }

        if (!node._profilePicture || node._profilePicture() === false)
        {
          $element.prop("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
          return;
        }

        murrix.cache.getItem(node._profilePicture(), function(error, item)
        {
          if (error)
          {
            $element.prop("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
            console.log("error received from the server: " + error);
            return;
          }

          var cacheId = item.cacheId ? item.cacheId() : item.modified.timestamp();

          murrix.cache.initImage($element, { id: item._id(), width: width, height: height, square: square, cacheId: cacheId, delayedLoad: delayedLoad });
        });
      });
    }
  };

  /* Knockout src, get profile picture async */
  ko.bindingHandlers.srcUserProfilePicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      for (var n = 0; n < params.length; n++)
      {
        params[n] = ko.utils.unwrapObservable(params[n]);
      }

      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var square = params[3] || 0;

//       $(element).width(width);
//       $(element).height(height);

      if (!id || id === null || id === "")
      {
        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to srcUserProfilePicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      murrix.cache.getUsers([ id ], function(error, userList)
      {
        if (error)
        {
          $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
          console.log("error received from the server: " + error);
          return;
        }

        if (userList[id])
        {
          if (!userList[id]._person || !userList[id]._person())
          {
            $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
            return;
          }


          murrix.cache.getNodes([ userList[id]._person() ], function(error, nodeList)
          {
            if (error)
            {
              $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
              console.log("error received from the server: " + error);
              return;
            }

            if (nodeList[userList[id]._person()])
            {

              if (!nodeList[userList[id]._person()]._profilePicture || !nodeList[userList[id]._person()]._profilePicture())
              {
                $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
                return;
              }

              murrix.loadProfilePicture(element, nodeList[userList[id]._person()]._profilePicture(), width, height, square);

              return;
            }

            $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
          });

          return;
        }

        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
      });
    }
  };



  /* Knockout HTML size formater */
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


  /* Knockout HTML date formater */
  ko.bindingHandlers.htmlDate = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var dateItem = moment.utc(ko.utils.unwrapObservable(value) + "+0000", "YYYY-MM-DD HH:mm:ss Z").local();

      if (!dateItem.date())
      {
        $(element).html(ko.utils.unwrapObservable(value));
      }
      else
      {
        $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
      }
    }
  };


  /* Knockout HTML timestamp formater */
  ko.bindingHandlers.htmlTimestamp = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("unknown date and time");
        return;
      }

      var dateItem = moment.utc(rawValue * 1000).local();

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
      }
    }
  };

  ko.bindingHandlers.htmlTimestampToNiceDate = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);
console.log("htmlTimestampToNiceDate", rawValue);
      if (!rawValue)
      {
        $(element).text("unknown date");
        return;
      }

      var dateItem = moment.utc(rawValue * 1000).local();

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("MMMM Do YYYY"));
      }
    }
  };


  ko.bindingHandlers.htmlTimestampToTime = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("unknown time");
        return;
      }

      var dateItem = moment(rawValue * 1000);

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("HH:mm:ss"));
      }
    }
  };

//   ko.bindingHandlers.htmlTimestampToDate = {
//     update: function(element, valueAccessor)
//     {
//       var value = valueAccessor();
//       var rawValue = ko.utils.unwrapObservable(value);
//
//       if (!rawValue)
//       {
//         $(element).text("unknown date");
//         return;
//       }
//
//       var dateItem = moment(rawValue * 1000).local();
//
//       if (!dateItem.date())
//       {
//         $(element).html(rawValue);
//       }
//       else
//       {
//         $(element).html(dateItem.format("dddd, MMMM Do YYYY"));
//       }
//     }
//   };

  ko.bindingHandlers.htmlTimestampToYear = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("unknown year");
        return;
      }

      var dateItem = moment(rawValue);

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("YYYY"));
      }
    }
  };

  ko.bindingHandlers.htmlTimestampToDay = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("unknown date");
        return;
      }

      var dateItem = moment(rawValue);

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("dddd, MMMM Do"));
      }
    }
  };

  ko.bindingHandlers.htmlTimestampToTime = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("unknown time");
        return;
      }

      var dateItem = moment.utc(rawValue * 1000);

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("HH:mm:ss"));
      }
    }
  };



  /* Knockout HTML time ago formater */
  ko.bindingHandlers.htmlTimeAgo = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      var rawValue = ko.utils.unwrapObservable(value);
      var dateItem = null;

      if (typeof rawValue === "number")
      {
        dateItem = moment.unix(rawValue);
      }
      else
      {
        dateItem = moment(rawValue + "+0000", "YYYY-MM-DD HH:mm:ss Z");
      }

      if (!dateItem.date())
      {
        $(element).html(ko.utils.unwrapObservable(rawValue));
      }
      else
      {
        $(element).html(dateItem.fromNow());
      }
    }
  };



  ko.bindingHandlers.hrefFirst = {
    update: function(element, valueAccessor)
    {
      var values = ko.utils.unwrapObservable(valueAccessor());
      for (var n = 0; n < values.length; n++)
      {
        values[n] = ko.utils.unwrapObservable(values[n]);
      }

      $(element).off("click");

      $(element).on("click", function(event)
      {
        var path = murrix.createPath(0, values[0], values[1]);

        if (document.location.hash === path)
        {
          path = murrix.createPath(0, values[0], "");
        }

        document.location.hash = path;

        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.hrefFirstPrimary = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).off("click");

      $(element).on("click", function(event)
      {
        var path = murrix.createPath(0, value, null);

        if (document.location.hash === path)
        {
          path = murrix.createPath(0, "", "");
        }

        document.location.hash = path;

        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.hrefFirstSecondary = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).off("click");

      $(element).on("click", function(event)
      {
        document.location.hash = murrix.createPath(0, null, value);
        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.hrefSecond = {
    update: function(element, valueAccessor)
    {
      var values = ko.utils.unwrapObservable(valueAccessor());
      for (var n = 0; n < values.length; n++)
      {
        values[n] = ko.utils.unwrapObservable(values[n]);
      }

      $(element).off("click");

      $(element).on("click", function(event)
      {
        var path = murrix.createPath(1, values[0], values[1]);

        if (document.location.hash === path)
        {
          path = murrix.createPath(1, values[0], "");
        }

        document.location.hash = path;

        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.hrefSecondPrimary = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).off("click");

      $(element).on("click", function(event)
      {
        var path = murrix.createPath(1, value, null);

        if (document.location.hash === path)
        {
          path = murrix.createPath(1, "", "");
        }

        document.location.hash = path;

        event.preventDefault();
      });
    }
  };

  ko.bindingHandlers.hrefSecondSecondary = {
    update: function(element, valueAccessor)
    {
      var value = ko.utils.unwrapObservable(valueAccessor());
      $(element).off("click");

      $(element).on("click", function(event)
      {
        document.location.hash = murrix.createPath(1, null, value);
        event.preventDefault();
      });
    }
  };
});

