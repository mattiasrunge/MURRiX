
function DialogLocationNodeModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogLocationNode");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.descriptionModel = new DialogComponentTextModel(self);

  self.positionModel = new DialogComponentPositionModel(self);

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
    self.positionModel.reset();
    self.ownersModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.descriptionModel.disabled(value);
    self.positionModel.disabled(value);
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

      self.errorText("");
      self.disabled(true);

      self.getPositionItem(nodeData._id, function(error, positionItemData)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        if (positionItemData.where && positionItemData.where.latitude && positionItemData.where.latitude !== false)
        {
          self.positionModel.value(positionItemData.where);
        }
      });
    });
  };

  self.saveNode = function(nodeData)
  {
    if (self.id() !== false)
    {
      nodeData._id = self.id();
    }

    nodeData.type = "location";
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

      self.errorText("");
      self.disabled(true);

      self.getPositionItem(nodeData._id, function(error, positionItemData)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        positionItemData.name = positionItemData.name || "Position";
        positionItemData.what = "position";
        positionItemData.where = { latitude: self.positionModel.value().latitude, longitude: self.positionModel.value().longitude, source: self.positionModel.value().latitude !== false ? "manual" : false };
        positionItemData._parents = [ nodeDataNew._id ];

        self.errorText("");
        self.disabled(true);

        murrix.server.emit("saveItem", positionItemData, function(error, itemDataNew)
        {
          self.disabled(false);

          if (error)
          {
            self.errorText(error);
            return;
          }

          console.log("Saved item!", itemDataNew);
          murrix.cache.addItemData(itemDataNew);
          murrix.model.nodeModel.loadNode();

          if (self.finishCallback)
          {
            self.finishCallback(node);
          }

          self.reset();
          self.hide();
        });
      });
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

  self.getPositionItem = function(nodeId, callback)
  {
    var query = { };

    query.what = "position";
    query._parents = { $in : [ nodeId ] };

    murrix.server.emit("find", { query: query, options: "items" }, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      itemDataList = murrix.makeArray(itemDataList);

      if (itemDataList.length > 0)
      {
        callback(null, itemDataList[0]);
      }
      else
      {
        callback(null, {});
      }
    });
  };
}
