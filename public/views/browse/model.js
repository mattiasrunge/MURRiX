
var BrowseModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.nodes = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "browse"))
    {
      self.show(value.action === "browse");
    }
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self._load();
    }
  });

  self.loading = ko.observable(false);
  self.errorText = ko.observable("");

  self.yearIncClicked = function()
  {
    if (self.show())
    {
      console.log("inc");
      self.year(self.year() + 1);
      self._load();
    }
  };

  self.yearDecClicked = function()
  {
    if (self.show())
    {console.log("dec");
      self.year(self.year() - 1);
      self._load();
    }
  };

  self._load = function()
  {
    if (self.lastSearchedYear() === self.year())
    {
      return;
    }

    self.lastSearchedYear(self.year());

    self.nodes.removeAll();

    self.loading(true);
    self.errorText("");

    murrix.cache.clearNodes();

    murrix.server.emit("findNodesByYear", self.year(), function(error, nodeDataList)
    {
      var nodeList = [];

      self.loading(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      for (var id in nodeDataList)
      {
        nodeList.push(murrix.cache.addNodeData(nodeDataList[id]));
      }

      self.nodes(nodeList);
    });
  };

  self.year = ko.observable(new Date().getFullYear());
  self.lastSearchedYear = ko.observable(false);

  self.yearSliderChanged = function(year)
  {
    self._load();
  };
};
