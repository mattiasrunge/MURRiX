

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




/* Knockout HTML size formater */
ko.bindingHandlers.htmlSize = {
  init: function(element, valueAccessor)
  {
    var fileSizeInBytes = $.murrix.intval(ko.utils.unwrapObservable(valueAccessor()));
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

    do
    {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    $(element).html(Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i]);
  },
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
  init: function(element, valueAccessor)
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
  },
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
  init: function(element, valueAccessor)
  {
    var value = valueAccessor();
    var dateItem = moment(ko.utils.unwrapObservable(value) + "+0000", "YYYY-MM-DD HH:mm:ss Z");

    if (!dateItem.date())
    {
      $(element).html(ko.utils.unwrapObservable(value));
    }
    else
    {
      $(element).html(dateItem.fromNow());
    }
  },
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
      $(element).html(dateItem.fromNow());
    }
  }
};

ko.bindingHandlers.hrefFirst = {
  init: function(element, valueAccessor)
  {
    var values = ko.utils.unwrapObservable(valueAccessor());
    $(element).attr("href", $.murrix.createPath(0, values[0], values[1]));
  },
  update: function(element, valueAccessor)
  {
    var values = ko.utils.unwrapObservable(valueAccessor());
    $(element).attr("href", $.murrix.createPath(0, values[0], values[1]));
  }
};

ko.bindingHandlers.hrefFirstPrimary = {
  init: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(0, ko.utils.unwrapObservable(valueAccessor()), null));
  },
  update: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(0, ko.utils.unwrapObservable(valueAccessor()), null));
  }
};

ko.bindingHandlers.hrefFirstSecondary = {
  init: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(0, null, ko.utils.unwrapObservable(valueAccessor())));
  },
  update: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(0, null, ko.utils.unwrapObservable(valueAccessor())));
  }
};

ko.bindingHandlers.hrefSecond = {
  init: function(element, valueAccessor)
  {
    var values = ko.utils.unwrapObservable(valueAccessor());
    $(element).attr("href", $.murrix.createPath(1, values[0], values[1]));
  },
  update: function(element, valueAccessor)
  {
    var values = ko.utils.unwrapObservable(valueAccessor());
    $(element).attr("href", $.murrix.createPath(1, values[0], values[1]));
  }
};

ko.bindingHandlers.hrefSecondPrimary = {
  init: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(1, ko.utils.unwrapObservable(valueAccessor()), null));
  },
  update: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(1, ko.utils.unwrapObservable(valueAccessor()), null));
  }
};

ko.bindingHandlers.hrefSecondSecondary = {
  init: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(1, null, ko.utils.unwrapObservable(valueAccessor())));
  },
  update: function(element, valueAccessor)
  {
    $(element).attr("href", $.murrix.createPath(1, null, ko.utils.unwrapObservable(valueAccessor())));
  }
};
