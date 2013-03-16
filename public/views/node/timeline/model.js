
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);
  self.timeline = ko.observableArray();
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "timeline"))
    {
      self.show(value.action === "timeline");
    }
  });

  parentModel.node.subscribe(function(value)
  {
    self.timeline.removeAll();
    self.loaded(false);
    self.load();
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self.load();
    }
  });

  self.load = function()
  {
    if (self.show() && !self.loaded() && parentModel.node() !== false)
    {
      self.loading(true);

      murrix.server.emit("helper_nodeGetTimelineList", { nodeId: parentModel.node()._id() }, function(error, timeline)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        console.log("TimelineModel: Loaded " + timeline.length + " days!");
        self.loaded(true);
        self.timeline(timeline);
      });
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
