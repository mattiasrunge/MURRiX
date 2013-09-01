
var FilesModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "files" });
  BaseNodeDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    if (parentModel.node() !== false)
    {
      murrix.server.emit("helper_nodeGetFilesList", { nodeId: parentModel.node()._id() }, function(error, fileList)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, fileList);
      });
    }
    else
    {
      callback(null, []);
    }
  };
};
