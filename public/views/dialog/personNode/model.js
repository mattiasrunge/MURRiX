
function DialogPersonNodeModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogPersonNode");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.birthname = ko.observable("");

  self.descriptionModel = new DialogComponentTextModel(self);

  self.genderModel = new DialogComponentSelectModel(self);
  self.genderModel.options([
    { name: "Male", value: "m", description: "This person is male." },
    { name: "Female", value: "f", description: "This person is female." }
  ]);

  self.parentsModel = new DialogComponentNodeListModel(self);
  self.parentsModel.max(2);
  self.parentsModel.types([ "person" ]);

  self.childrenModel = new DialogComponentNodeListModel(self);
  self.childrenModel.max(1);

  self.partnerModel = new DialogComponentNodeListModel(self);
  self.partnerModel.max(1);
  self.partnerModel.types([ "person" ]);

  self.birthModel = new DialogComponentDatetimeModel(self);

  self.homesModel = new DialogComponentNodeListModel(self);
  self.homesModel.types([ "location" ]);


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
    self.birthname("");
    self.descriptionModel.reset();
    self.genderModel.reset();
    self.parentsModel.reset();
    self.childrenModel.reset();
    self.partnerModel.reset();
    self.birthModel.reset();
    self.homesModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.descriptionModel.disabled(value);
    self.genderModel.disabled(value);
    self.parentsModel.disabled(value);
    self.childrenModel.disabled(value);
    self.partnerModel.disabled(value);
    self.birthModel.disabled(value);
    self.homesModel.disabled(value);
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
      self.birthname(nodeData.birthname);
      self.descriptionModel.value(nodeData.description);
      self.genderModel.value(nodeData.gender);
      self.homesModel.value(nodeData._homes);

      for (var n = 0; n < nodeData.family.parents.length; n++)
      {
        self.parentsModel.value.push(nodeData.family.parents[n]._id);
      }

      if (nodeData.family._partner !== false)
      {
        self.partnerModel.value.push(nodeData.family._partner);
      }


      self.errorText("");
      self.disabled(true);

      self.getBirthItem(nodeData._id, function(error, birthItemData)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        if (birthItemData.when && birthItemData.when.source !== false)
        {
          self.birthModel.value(birthItemData.when.source);
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

    nodeData.type = "person";
    nodeData.name = self.name();
    nodeData.birthname = self.birthname();
    nodeData.description = self.descriptionModel.value();
    nodeData.gender = self.genderModel.value();
    nodeData._homes = self.homesModel.value();

    nodeData.family = nodeData.family || {};
    nodeData.family.parents = [];

    for (var n = 0; n < self.parentsModel.value().length; n++)
    {
      nodeData.family.parents.push({ type: "blood", _id: self.parentsModel.value()[n] });
    }

    nodeData.family._partner = false;

    if (self.partnerModel.value().length > 0)
    {
      // TODO: Should change _partner on the partner person node as well
      nodeData.family._partner = self.partnerModel.value()[0];
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

      self.errorText("");
      self.disabled(true);

      self.getBirthItem(nodeData._id, function(error, birthItemData)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        birthItemData.name = birthItemData.name || "Birth event";
        birthItemData.text = birthItemData.text || "";
        birthItemData.type = "birth";
        birthItemData.what = "text";

        birthItemData.when = birthItemData.when || { timestamp: false, source: false };
        birthItemData.when.source = self.birthModel.value();
        birthItemData.when.source.type = "manual";
        birthItemData.when.source.comment = "";

        birthItemData.where = birthItemData.where || { latitude: false, longitude: false, _id: false };

        birthItemData._parents = [ nodeDataNew._id ];

        self.errorText("");
        self.disabled(true);

        murrix.server.emit("saveItem", birthItemData, function(error, itemDataNew)
        {
          self.disabled(false);

          if (error)
          {
            self.errorText(error);
            return;
          }

          console.log("Saved item!", itemDataNew);
          var item = murrix.cache.addItemData(itemDataNew);

          if (!birthItemData._id && murrix.model.nodeModel.node() !== false && murrix.model.nodeModel.node()._id() === nodeDataNew._id)
          {
            // TODO: Solve this in a nicer way!
            murrix.model.nodeModel.items.push(item);
          }

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

  self.getBirthItem = function(nodeId, callback)
  {
    var query = { };

    query.what = "text";
    query._parents = { $in : [ nodeId ] };
    query.type = "birth";

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
};
