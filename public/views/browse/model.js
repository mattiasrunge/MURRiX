
var BrowseModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "browse", title: "Browse material by year" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.year = ko.observable(new Date().getFullYear());
  self.lastSearchedYear = ko.observable(false);
  self.sliding = ko.observable(false);

  self.yearIncClicked = function()
  {
    self.year(self.year() + 1);
  };

  self.yearDecClicked = function()
  {
    self.year(self.year() - 1);
  };

  self.year.subscribe(function(value)
  {
    if (self.sliding() === false && self.lastSearchedYear() !== value)
    {
      self.lastSearchedYear(value);
      self.resetInternal();
      self.loadInternal();
    }
  });

  self.load = function(callback)
  {
    murrix.server.emit("findNodesByYear", self.year(), function(error, nodeDataList)
    {
      var nodeList = [];

      if (error)
      {
        callback(error);
        return;
      }

      for (var id in nodeDataList)
      {
        nodeList.push(murrix.cache.addNodeData(nodeDataList[id]));
      }

      callback(null, nodeList);
    });
  };
};
