
$(function()
{
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
      ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
  };

  /* Knockout visibility changer (fading) handler  */
  ko.bindingHandlers.slideVisible = {
    init: function(element, valueAccessor)
    {
      var value = valueAccessor();
      $(element).toggle(ko.utils.unwrapObservable(value));
    },
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      if (ko.utils.unwrapObservable(value))
      {
        $(element).show("slide", function() { $(element).height(''); });
      }
      else
      {
        $(element).height($(element).height());
        $(element).hide("slide");
      }
    }
  };


  /* Knockout text, set attribute of node loaded async */
  ko.bindingHandlers.textNodeAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      $(element).text("Loading " + params[1] + "...");

      murrix.cache.getNodes([ params[0] ], function(error, nodeList)
      {
        if (error)
        {
          $(element).text(error);
          return;
        }

        if (nodeList[params[0]])
        {
          $(element).text(nodeList[params[0]][params[1]]());
        }
        else
        {
          $(element).text("Unknown");
        }
      });
    }
  };

  /* Knockout src, get profile picture async */
  ko.bindingHandlers.srcNodeProfilePicture = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      var id = params[0] || false;
      var width = params[1] || 0;
      var height = params[2] || 0;
      var square = params[3] || 0;

      if (!id)
      {
        console.log("No id given to srcNodeProfilePicture");
        return;
      }

      $(element).attr("src", "img/120x120_spinner.gif");


      murrix.cache.getNodes([id ], function(error, nodeList)
      {
        if (error)
        {
          $(element).text(error);
          return;
        }

        if (nodeList[id])
        {
          if (!nodeList[id]._profilePicture || !nodeList[id]._profilePicture())
          {
            $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
            return;
          }

          var src = "/preview?id=" + nodeList[id]._profilePicture() + "&width=" + width + "&height=" + height + "&square=" + square;

          var image = new Image();

          image.onload = function()
          {
            $(element).attr("src", src);
          };
          
          image.onerror = function()
          {
            //$(element).attr("src", ""); TODO: Set error image
          };
          
          image.src = src;

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
      var dateItem = moment(ko.utils.unwrapObservable(value) + "+0000", "YYYY-MM-DD HH:mm:ss Z");

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
      var dateItem = moment.utc(ko.utils.unwrapObservable(value) * 1000);

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
      $(element).attr("href", murrix.createPath(0, values[0], values[1]));
    }
  };

  ko.bindingHandlers.hrefFirstPrimary = {
    update: function(element, valueAccessor)
    {
      $(element).attr("href", murrix.createPath(0, ko.utils.unwrapObservable(valueAccessor()), null));
    }
  };

  ko.bindingHandlers.hrefFirstSecondary = {
    update: function(element, valueAccessor)
    {
      $(element).attr("href", murrix.createPath(0, null, ko.utils.unwrapObservable(valueAccessor())));
    }
  };

  ko.bindingHandlers.hrefSecond = {
    update: function(element, valueAccessor)
    {
      var values = ko.utils.unwrapObservable(valueAccessor());
      $(element).attr("href", murrix.createPath(1, values[0], values[1]));
    }
  };

  ko.bindingHandlers.hrefSecondPrimary = {
    update: function(element, valueAccessor)
    {
      $(element).attr("href", murrix.createPath(1, ko.utils.unwrapObservable(valueAccessor()), null));
    }
  };

  ko.bindingHandlers.hrefSecondSecondary = {
    update: function(element, valueAccessor)
    {
      $(element).attr("href", murrix.createPath(1, null, ko.utils.unwrapObservable(valueAccessor())));
    }
  };
});

