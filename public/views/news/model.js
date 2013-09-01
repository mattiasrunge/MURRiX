
var NewsModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "news", title: "Recent changes" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    murrix.server.emit("find", { query: { }, options: { collection: "nodes", limit: 40, sort: "modified.timestamp", sortDirection: "desc" } }, function(error, nodeDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var nodeList = [];

      for (var key in nodeDataList)
      {
        nodeList.push(murrix.cache.addNodeData(nodeDataList[key]));
      }

      callback(null, nodeList);
    });
  };
};
