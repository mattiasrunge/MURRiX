
function DialogVehicleNodeModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogVehicleNode");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.descriptionModel = new DialogComponentTextModel(self);

  self.ownersModel = new DialogComponentNodeListModel(self);
  self.ownersModel.types([ "person" ]);

  self.reset = function()
  {
    var tabElements = $(self.elementId).find("ul.nav-tabs li");
    var tabPanes = $(self.elementId).find("div.tab-pane");

    tabElements.removeClass("active");
    tabPanes.removeClass("active");

    $(tabElements[0]).addClass("active");
    $(tabPanes[0]).addClass("active");

    self.id(false);
    self.errorText("");
    self.disabled(false);
    self.name("");
    self.descriptionModel.reset();
    self.ownersModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.descriptionModel.disabled(value);
    self.ownersModel.disabled(value);
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
      self.descriptionModel.value(nodeData.description);
      self.ownersModel.value(nodeData._owners ? nodeData._owners : []);
    });
  };

  self.saveNode = function(nodeData)
  {
    if (self.id() !== false)
    {
      nodeData._id = self.id();
    }

    nodeData.type = "vehicle";
    nodeData.name = self.name();
    nodeData.description = self.descriptionModel.value();
    nodeData._owners = self.ownersModel.value();

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
