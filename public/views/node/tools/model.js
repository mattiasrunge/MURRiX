
var ToolsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  self.cameraIdentifiersLoading = ko.observable(false);
  self.cameraIdentifiersLoaded = ko.observable(false);
  self.cameraIdentifiers = ko.observableArray();

  self.rawLoading = ko.observable(false);
  self.rawLoaded = ko.observable(false);
  self.rawCanHide = ko.observableArray();
  self.rawCannotHide = ko.observableArray();

  self.duplicatesLoading = ko.observable(false);
  self.duplicatesLoaded = ko.observable(false);
  self.duplicates = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    var show = value.action === "tools";

    if (self.show() !== show)
    {
      self.show(show);
    }

    if (self.show())
    {
      self.tool(value.args.length === 0 ? "set_camera" : value.args[0]);
    }
  });

  self.tool = ko.observable("set_camera");

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
      self.tool.valueHasMutated();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    self.cameraIdentifiersLoaded(false);
    self.cameraIdentifiers.removeAll();

    self.rawLoaded(false);
    self.rawCanHide.removeAll();
    self.rawCannotHide.removeAll();

    self.duplicatesLoaded(false);
    self.duplicates.removeAll();

    if (self.show() && value !== false)
    {
      self.tool.valueHasMutated();
    }
  });

  self.tool.subscribe(function(value)
  {
    if (value === "set_camera")
    {
      self.loadCameraIdentifiers();
    }
    else if (value === "hide_raw")
    {
      self.loadRaw();
    }
    else if (value === "remove_duplicates")
    {
      self.loadDuplicates();
    }
  });

  self.loadDuplicates = function()
  {
    console.log("ToolsModel: Loading duplicates...");

    if (self.show() && !self.duplicatesLoaded() && parentModel.node() !== false)
    {
      self.duplicatesLoading(true);

      murrix.server.emit("helper_nodeToolsGetDuplicateList", { nodeId: parentModel.node()._id() }, function(error, list)
      {
        self.duplicatesLoading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        self.duplicates(list);
      });
    }
  };

  self.removeDuplicates = function()
  {
    self.duplicatesLoading(true);

    murrix.server.emit("helper_nodeToolsRemoveDuplicates", { list: self.duplicates() }, function(error)
    {
      self.duplicatesLoading(false);

      if (error)
      {
        console.log(error);
        return;
      }

      self.duplicatesLoaded(false);
      self.loadDuplicates();
    });
  };

  self.loadRaw = function()
  {
    console.log("ToolsModel: Loading raw data...");

    if (self.show() && !self.rawLoaded() && parentModel.node() !== false)
    {
      self.rawLoading(true);

      murrix.server.emit("helper_nodeToolsGetHideRawList", { nodeId: parentModel.node()._id() }, function(error, cannotHideList, canHideList)
      {
        self.rawLoading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        self.rawCanHide(canHideList);
        self.rawCannotHide(cannotHideList);
      });
    }
  };

  self.hideRaw = function()
  {
    self.rawLoading(true);

    murrix.server.emit("helper_nodeToolsHideRaw", { list: self.rawCanHide() }, function(error, itemDataList)
    {
      self.rawLoading(false);

      if (error)
      {
        console.log(error);
        return;
      }

      for (var n = 0; n < itemDataList.length; n++)
      {
        murrix.cache.addItemData(itemDataList[n]);
      }

      self.rawLoaded(false);
      self.loadRaw();
    });
  };

  self.loadCameraIdentifiers = function()
  {
    console.log("ToolsModel: Loading camera identifiers...");

    if (self.show() && !self.cameraIdentifiersLoaded() && parentModel.node() !== false)
    {
      self.cameraIdentifiersLoading(true);

      murrix.server.emit("helper_nodeToolsGetCameraList", { nodeId: parentModel.node()._id() }, function(error, identifiers)
      {
        self.cameraIdentifiersLoading(false);

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
      self.cameraIdentifiersLoaded(false);
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
    self.cameraIdentifiersLoading(true);

    murrix.server.emit("helper_nodeToolsSetCamera", { _with: this._with, _itemIds: this._itemIds }, function(error, itemDataList)
    {
      self.cameraIdentifiersLoading(false);

      if (error)
      {
        console.log(error);
        return;
      }

      for (var n = 0; n < itemDataList.length; n++)
      {
        murrix.cache.addItemData(itemDataList[n]);
      }

      self.cameraIdentifiersLoaded(false);
      self.loadCameraIdentifiers();
    });
  };
};
