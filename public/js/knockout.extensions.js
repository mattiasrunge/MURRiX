
$(function()
{
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
        ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
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

      if (where._id && where._id() !== false)
      {
        murrix.cache.getNodes([ where._id() ], function(error, nodeList)
        {
          if (error)
          {
            $(element).text(error);
            return;
          }

          if (nodeList[where._id()])
          {
            $(element).html("<a href='#node:" + where._id() + "'>" + nodeList[where._id()].name() + "</a>");
          }
          else
          {
            $(element).text("unknown location");
          }
        });
      }
      else if (where.longitude && where.latitude)
      {
        // TODO: Look in our own database first

        var options = {};

        options.sensor = false;
        options.latlng = where.latitude() + "," + where.longitude();

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
      var value = valueAccessor();
      var param = ko.utils.unwrapObservable(value);

      var when = param || false;

      $(element).popover('destroy');

      if (!when || when === null)
      {
        $(element).html("at an unknown date and time");
        return;
      }

      var dateItem = moment.utc(when.timestamp() * 1000);

      if (!dateItem.date())
      {
        $(element).html("at " + ko.utils.unwrapObservable(value));
      }
      else
      {
        var title = dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z");

        $(element).html("at " + title);

        var text = "";

        text += "Timestamp: " + when.timestamp();
        text += "<br/>";
        text += "Source: " + when.source();

        var options = {
          html      : true,
          placement : "left",
          trigger   : "hover",
          title     : "When - " + title,
          content   : text,
          delay     : { show: 200, hide: 100 }
        }

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

        if (nodeList[withId]._owner)
        {
          text += "<br/>";
          text += "Owner: " + nodeList[withId]._owner();
        }

        var options = {
          html      : true,
          placement : "left",
          trigger   : "hover",
          title     : "With - " + nodeList[withId].name(),
          content   : text,
          delay     : { show: 200, hide: 100 }
        }

        $(element).popover(options);
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
          $(element).text(error);
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
          $(element).text(error);
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
          $(element).text(error);
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



  ko.bindingHandlers.srcItemPicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var id = ko.utils.unwrapObservable(value);

      if (!id || id === null || id === "")
      {
        $(element).attr("src", "http://placekitten.com/g/1400/1400"); // TODO: Set generic user icon image
        console.log("No id given to srcItemPicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      var src = "/preview?id=" + id + "&width=1400";

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

  ko.bindingHandlers.srcPicture = {
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

      if (!id || id === null || id === "")
      {
        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to srcItemPicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      var src = "/preview?id=" + id + "&width=" + width + "&height=" + height + "&square=" + square;

      var image = new Image();

      image.onload = function()
      {
        $(element).attr("src", src);
      };

      image.onerror = function()
      {
        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
      };

      image.src = src;
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

      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var square = params[3] || 0;

      if (!id || id === null || id === "")
      {
        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
        console.log("No id given to srcNodeProfilePicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");

      murrix.cache.getNodes([ id ], function(error, nodeList)
      {
        if (error)
        {
          $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
          console.log("error received from the server: " + error);
          return;
        }

        if (nodeList[id])
        {

          if (!nodeList[id]._profilePicture || !nodeList[id]._profilePicture())
          {
            $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
            return;
          }

          murrix.loadProfilePicture(element, nodeList[id]._profilePicture(), width, height, square);

          return;
        }

        $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
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

      $(element).html(Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i]);
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

      var dateItem = moment.utc(rawValue * 1000).local();

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

  ko.bindingHandlers.htmlTimestampToDate = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

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
        $(element).html(dateItem.format("dddd, MMMM Do YYYY"));
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
        document.location.hash = murrix.createPath(0, values[0], values[1]);
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
        document.location.hash = murrix.createPath(0, value, null);
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
        document.location.hash = murrix.createPath(1, values[0], values[1]);
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
        document.location.hash = murrix.createPath(1, value, null);
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

