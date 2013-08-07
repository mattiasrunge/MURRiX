
var ToolsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.items = ko.observableArray();
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);
  self.cameraIdentifiers = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    var show = value.action === "tools";

    if (self.show() !== show)
    {
      self.show(show);
    }

    if (self.show())
    {
      self.tool(value.args.length === 0 ? "batch_camera" : value.args[0]);
    }
  });

  self.tool = ko.observable("batch_camera");

  self.enabled = ko.computed(function()
  {
    if (parentModel.node() === false)
    {
      return false;
    }

    return parentModel.node().hasAdminAccess();
  });


  self.show.subscribe(function(value)
  {
    if (value && parentModel.node() !== false)
    {
      self.loadCameraIdentifiers();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    self.loaded(false);
    self.cameraIdentifiers.removeAll();

    if (self.show() && value !== false)
    {
      self.loadCameraIdentifiers();
    }
  });

  self.loadCameraIdentifiers = function()
  {
    if (self.show() && !self.loaded() && parentModel.node() !== false)
    {
      self.loading(true);

      murrix.server.emit("helper_nodeToolsGetCameraList", { nodeId: parentModel.node()._id() }, function(error, identifiers)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        self.cameraIdentifiers(identifiers);
      });
    }
  };

  self.withCreateFromExif = function()
  {
    murrix.model.dialogModel.cameraNodeModel.showCreate(function(node)
    {
      self.loaded(false);
      self.loadCameraIdentifiers();
    });

    if (this.type === "serial")
    {
      murrix.model.dialogModel.cameraNodeModel.name(this.withName);
      murrix.model.dialogModel.cameraNodeModel.serial(this.unique);
    }
    else if (this.type === "name")
    {
      murrix.model.dialogModel.cameraNodeModel.name(this.withName);
    }
  };

  self.setCamera = function()
  {
    self.loading(true);

    murrix.server.emit("helper_nodeToolsSetCamera", { _with: this._with, _itemIds: this._itemIds }, function(error, itemDataList)
    {
      self.loading(false);

      if (error)
      {
        console.log(error);
        return;
      }

      for (var n = 0; n < itemDataList.length; n++)
      {
        murrix.cache.addItemData(itemDataList[n]);
      }

      self.loaded(false);
      self.loadCameraIdentifiers();
    });
  };
};
