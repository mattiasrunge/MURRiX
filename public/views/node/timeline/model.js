
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "timeline"))
    {
      self.show(value.action === "timeline");
    }
  });

  self.textItemEditOpenNew = function()
  {
    murrix.model.dialogModel.textItemModel.showCreate(parentModel.node()._id());
  };

  self.textItemEditOpen = function(item)
  {
    murrix.model.dialogModel.textItemModel.showEdit(item._id());
  };

  self.textItemEditOpenType = function(type)
  {
    murrix.model.dialogModel.textItemModel.showCreate(parentModel.node()._id(), type);
  };

};
