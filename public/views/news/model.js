
var NewsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.nodes = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "news"))
    {
      self.show(value.action === "news");
    }
  });

  self.show.subscribe(function(value)
  {
    self.nodes.removeAll();

    if (value)
    {
      parentModel.title("MURRiX - News");

      murrix.server.emit("find", { query: { }, options: { collection: "nodes", limit: 100, sort: "modified.timestamp", sortDirection: "desc" } }, function(error, nodeDataList)
      {
        if (error)
        {
          console.log(error);
          callback([]);
          return;
        }

        var nodeList = [];

        for (var key in nodeDataList)
        {
          nodeList.push(murrix.cache.addNodeData(nodeDataList[key]));
        }

        self.nodes(nodeList);
      });
    }
  });
};
