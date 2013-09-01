
var TimelineModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "timeline" });
  BaseNodeDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    if (parentModel.node() !== false)
    {
      murrix.server.emit("helper_nodeGetTimelineList", { nodeId: parentModel.node()._id() }, function(error, timeline)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, timeline);
      });
    }
    else
    {
      callback(null, []);
    }
  };

  self.textItemEditOpenNew = function()
  {
    murrix.model.dialogModel.textItemModel.showCreate(ko.utils.unwrapObservable(parentModel.node()._id));
  };

  self.textItemEditOpen = function(item)
  {
    murrix.model.dialogModel.textItemModel.showEdit(ko.utils.unwrapObservable(item._id));
  };

  self.textItemEditOpenType = function(type)
  {
    murrix.model.dialogModel.textItemModel.showCreate(ko.utils.unwrapObservable(parentModel.node()._id), type);
  };
};
