
function DialogGroupModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogGroup");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.descriptionModel = new DialogComponentTextModel(self);

  self.reset = function()
  {
    var tabElements = $(self.elementId).find("ul.nav-tabs li");
    var tabPanes = $(self.elementId).find("div.tab-pane");

    tabElements.removeClass("active");
    tabPanes.removeClass("active");

    $(tabElements[0]).addClass("active");
    $(tabPanes[0]).addClass("active");

    self.id(false);
    self.name("");
    self.descriptionModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.descriptionModel.disabled(value);
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

    murrix.cache.getGroup(id, function(error, group)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      var groupData = ko.mapping.toJS(group);

      self.id(groupData._id);
      self.name(groupData.name);
      self.descriptionModel.value(groupData.description);
    });
  };

  self.saveGroup = function(groupData)
  {
    if (self.id() !== false)
    {
      groupData._id = self.id();
    }

    groupData.type = "camera";
    groupData.name = self.name();
    groupData.description = self.descriptionModel.value();

    self.errorText("");
    self.disabled(true);

    murrix.server.emit("saveGroup", groupData, function(error, groupDataNew)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      console.log("Saved group!", groupDataNew);
      var group = murrix.cache.addNodeData(groupDataNew);

      if (self.finishCallback)
      {
        self.finishCallback(group);
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
      murrix.cache.getGroup(self.id(), function(error, group)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        var groupData = ko.mapping.toJS(group);

        self.saveGroup(groupData);
      });
    }
    else
    {
      self.saveGroup({});
    }
  };
};
