
function DialogTagsNodeModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogTagsNode");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.tagsModel = new DialogComponentTagsModel(self);

  self.reset = function()
  {
    self.id(false);
    self.errorText("");
    self.disabled(false);
    self.name("");
    self.tagsModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.tagsModel.disabled(value);
  });

  self.finishCallback = null;

  self.showCreate = function(callback)
  {
    self.reset();

    self.finishCallback = callback;

    self.disabled(false);
    self.show();
  };

  self.showEdit = function(id, callback)
  {
    self.reset();

    self.finishCallback = callback;

    self.errorText("");
    self.disabled(true);
    self.id(id);

    self.show();

    murrix.cache.getNode(id, function(error, node)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      var nodeData = ko.mapping.toJS(node);

      self.id(nodeData._id);
      self.name(nodeData.name);
      self.tagsModel.value(nodeData.tagSearch);
    });
  };

  self.saveNode = function(nodeData)
  {
    if (self.id() !== false)
    {
      nodeData._id = self.id();
    }

    nodeData.type = "tags";
    nodeData.name = self.name();
    nodeData.tagSearch = self.tagsModel.value();

    self.errorText("");
    self.disabled(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeDataNew)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      console.log("Saved node!", nodeDataNew);
      var node = murrix.cache.addNodeData(nodeDataNew);

      if (self.finishCallback)
      {
        self.finishCallback(node);
      }

      self.reset();
      self.hide();
    });
  };

  self.saveHandler = function(callback)
  {
    if (self.name() === "")
    {
      self.errorText("Can not save with an empty name!");
      return;
    }

    self.errorText("");
    self.disabled(true);

    if (self.id() !== false)
    {
      murrix.cache.getNode(self.id(), function(error, node)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        var nodeData = ko.mapping.toJS(node);

        self.saveNode(nodeData);
      });
    }
    else
    {
      self.saveNode({});
    }
  };
}