
function DialogComponentNodeListModel()
{
  var self = this;

  DialogComponentBaseModel(self, "dialogComponentNodeListTemplate");

  /* Public observables, disables the component or part of it */
  self.types = ko.observableArray();
  self.value = ko.observableArray();
  self.suggestions = ko.observableArray();
  self.min = ko.observable(false);
  self.max = ko.observable(false);

  self.reset = function()
  {
    self.value([]);
    self.suggestions([]);
  };

  /* Private stuff */
  self.nodes = ko.observableArray();
  self.suggestionsNodes = ko.observableArray();

  self.disabledSearch = ko.computed(function()
  {
    return self.disabled() || (self.max() !== false && self.value().length >= self.max() && self.max() !== self.min());
  });

  self.disabledRemove = ko.computed(function()
  {
    return self.disabled() || (self.min() !== false && self.value().length <= self.min());
  });

  self.removeHandler = function(data)
  {
    var index = self.value.indexOf(data._id());

    if (index !== -1)
    {
      self.value.splice(index, 1);
    }
  };

  self.addHandler = function(data)
  {
    if (self.value.indexOf(data._id()) === -1)
    {
      self.value.push(data._id());
    }

    var index = self.suggestions.indexOf(data._id());

    if (index !== -1)
    {
      self.suggestions.splice(index, 1);
    }
  };

  self.typeaheadUpdater = function(key)
  {
    if (self.max() !== false && self.max() === self.min())
    {
      self.value.splice(0, 1);
      self.value.push(key);
      return;
    }

    if (!murrix.inArray(key, self.value()))
    {
      self.value.push(key);
    };
  };

  self.typeaheadSource = function(query, callback)
  {
    var inst = this;
    var query = { name: { $regex: ".*" + query + ".*", $options: "-i" } };

    if (self.types().length > 0)
    {
      query.type = { $in: self.types() };
    }

    murrix.server.emit("find", { query: query, options: { collection: "nodes", limit: inst.options.items + 5 } }, function(error, nodeDataList)
    {
      if (error)
      {
        console.log(error);
        callback([]);
      }

      var resultList = [];

      for (var key in nodeDataList)
      {
        var item = murrix.cache.addNodeData(nodeDataList[key]);

        item.toString = function() { return this._id(); };

        if (!murrix.inArray(item._id(), self.value()))
        {
          resultList.push(item);
        }
      }

      callback(resultList);
    });
  };

  self.typeaheadMatcher = function(item)
  {
    return ~item.name().toLowerCase().indexOf(this.query.toLowerCase());
  };

  self.typeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    var name = item.name().replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>"
    });

    var imgUrl = "http://placekitten.com/g/32/32";

    if (item._profilePicture && item._profilePicture() !== false)
    {
      imgUrl = "/preview?id=" + item._profilePicture() + "&width=32&height=32&square=1";
    }

    return "<div><img style='margin-right: 20px;' class='pull-left' src='" + imgUrl + "'/><span style='padding: 6px; display: inline-block;'>" + name + "</span></div>";
  };

  self.value.subscribe(function(value)
  {
    if (value.length === 0)
    {
      self.nodes.removeAll();
      return;
    }

    murrix.cache.getNodes(value, function(error, nodeList)
    {
      if (error)
      {
        console.log(error);
        self.nodes.removeAll();
        return;
      }

      var list = [];

      for (var n in nodeList)
      {
        list.push(nodeList[n]);
      }

      self.nodes(list);
    });
  });

  self.suggestions.subscribe(function(value)
  {
    if (value.length === 0)
    {
      self.suggestionsNodes.removeAll();
      return;
    }

    murrix.cache.getNodes(value, function(error, nodeList)
    {
      if (error)
      {
        console.log(error);
        self.suggestionsNodes.removeAll();
        return;
      }

      var list = [];

      for (var n in nodeList)
      {
        list.push(nodeList[n]);
      }

      self.suggestionsNodes(list);
    });
  });
};
