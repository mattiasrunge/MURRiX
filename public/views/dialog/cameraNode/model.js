
function DialogCameraNodeModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogCameraNode");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.serial = ko.observable("");

  self.trackerId = ko.observable("");

  self.timezone = ko.observable("Unknown");

  self.descriptionModel = new DialogComponentTextModel(self);

  self.typeModel = new DialogComponentSelectModel(self);
  self.typeModel.options([
    { name: "Manual time adjustments only", value: "manual", description: "This camera does <strong>not</strong> adjust it's internal clock automatically." },
    { name: "Automatic daylight savings adjustments", value: "autoDaylightSavings", description: "This camera adjusts for daylight savings automatically." },
    { name: "Automatic date and time adjustments", value: "autoDatetime", description: "This camera adjusts it's internal clock automatically (e.g. a phone)." }
  ]);

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
    self.serial("");
    self.trackerId("");
    self.timezone("Unknown");
    self.descriptionModel.reset();
    self.typeModel.reset();
    self.ownersModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.descriptionModel.disabled(value);
    self.typeModel.disabled(value);
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
      self.serial(nodeData.serial);
      self.trackerId(nodeData.tracker_id);
      self.descriptionModel.value(nodeData.description);
      self.ownersModel.value(nodeData._owners ? nodeData._owners : []);
      self.typeModel.value(nodeData.mode ? nodeData.mode : "manual");

      if (nodeData.referenceTimelines)
      {
        for (var n = 0; n < nodeData.referenceTimelines.length; n++)
        {
          if (nodeData.referenceTimelines[n].type === "timezone")
          {
            self.timezone(nodeData.referenceTimelines[n].name);
            break;
          }
        }
      }
    });
  };

  self.saveNode = function(nodeData)
  {
    if (self.id() !== false)
    {
      nodeData._id = self.id();
    }

    nodeData.type = "camera";
    nodeData.name = self.name();
    nodeData.serial = self.serial();
    nodeData.tracker_id = self.trackerId();
    nodeData.description = self.descriptionModel.value();
    nodeData._owners = self.ownersModel.value();
    nodeData.mode = self.typeModel.value();

    nodeData.referenceTimelines = nodeData.referenceTimelines || [];

    nodeData.referenceTimelines = nodeData.referenceTimelines.filter(function(element)
    {
      return (element.type !== "timezone");
    });

    if (self.timezone() !== "Unknown")
    {
      var reference = {};

      reference._id = "defaultTimezone";
      reference.type = "timezone";
      reference.name = self.timezone();

      nodeData.referenceTimelines.push(reference);
    }

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
