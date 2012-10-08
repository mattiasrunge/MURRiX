
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
      ko.utils.unwrapObservable(ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut());
    }
  };


  ko.bindingHandlers.textNodeAttribute = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var params = ko.utils.unwrapObservable(value);

      $(element).text("Loading " + params[1] + "...");

      murrix.model.getNodes([ params[0] ], function(error, nodeList)
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


  /* Knockout HTML data formater */
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


        /* Knockout HTML data formater */
  ko.bindingHandlers.htmlTimeAgo = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      var rawValue = ko.utils.unwrapObservable(value);
      var dateItem = null;

      if (typeof rawValue === "number")
      {
        dateItem = moment(rawValue);
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

