
var TagsModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "tags", title: "Browse tags" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    murrix.server.emit("helper_getTags", { }, function(error, tags)
    {
      if (error)
      {
        callback(error);
        return;
      }

      callback(null, tags);
    });
  };
};
