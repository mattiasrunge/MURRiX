
function DialogTextItemModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogTextItem");

  self.hideLocation = ko.observable(false);
  self.hidePosition = ko.observable(false);

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.textModel = new DialogComponentTextModel(self);

  self.typeModel = new DialogComponentSelectModel(self);
  self.typeModel.options([
    { name: "None", value: "none", description: "This text has no special type." },
    { name: "Birth", value: "birth", description: "This event represents someones birth." },
    { name: "Engagement", value: "engagement", description: "This event represents an engagement between two people." },
    { name: "Marriage", value: "marriage", description: "This event represents a marriage between two people." },
    { name: "Death", value: "death", description: "This event represents someones death." }
  ]);

  self.datetimeModel = new DialogComponentDatetimeModel(self);

  self.positionModel = new DialogComponentPositionModel(self);
  self.positionModel.value.subscribe(function(value)
  {
    if (value.latitude === false)
    {
      self.hideLocation(false);
    }
    else
    {
      self.hideLocation(true);
      self.locationModel.reset();
    }
  });

  self.locationModel = new DialogComponentNodeListModel(self);
  self.locationModel.types([ "location" ]);
  self.locationModel.max(1);
  self.locationModel.value.subscribe(function(value)
  {
    if (value.length === 0)
    {
      self.hidePosition(false);
    }
    else
    {
      self.hidePosition(true);
      self.positionModel.reset();
    }
  });

  self.relationsModel = new DialogComponentNodeListModel(self);
  self.relationsModel.min(1);


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
    self.textModel.reset();
    self.typeModel.reset();
    self.datetimeModel.reset();
    self.positionModel.reset();
    self.locationModel.reset();
    self.relationsModel.reset();
  };

  self.disabled.subscribe(function(value)
  {
    self.textModel.disabled(value);
    self.typeModel.disabled(value);
    self.datetimeModel.disabled(value);
    self.positionModel.disabled(value);
    self.locationModel.disabled(value);
    self.relationsModel.disabled(value);
  });

  self.showCreate = function(parentId, type)
  {
    self.reset();

    if (type)
    {
      self.typeModel.value(type);
    }

    self.relationsModel.value.push(parentId);

    self.disabled(false);
    self.show();
  };

  self.showEdit = function(id)
  {
    self.reset();

    self.errorText("");
    self.disabled(true);
    self.id(id);

    self.show();

    murrix.cache.getItem(id, function(error, item)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      var itemData = ko.mapping.toJS(item);

      self.id(itemData._id);
      self.name(itemData.name);
      self.textModel.value(itemData.text);
      self.typeModel.value(itemData.type === false ? "none" : itemData.type);

      if (itemData.when && itemData.when.source !== false)
      {
        self.datetimeModel.value(itemData.when.source);
      }

      if (itemData.where)
      {
        if (itemData.where._id && itemData.where._id !== false)
        {
          self.locationModel.value([ itemData.where._id ]);
        }

        if (itemData.where.latitude && itemData.where.latitude !== false)
        {
          self.positionModel.value(itemData.where);
        }
      }

      self.relationsModel.value(itemData._parents);
    });
  };

  self.saveItem = function(itemData)
  {
    if (self.id() !== false)
    {
      itemData._id = self.id();
    }

    itemData.name = self.name();
    itemData.text = self.textModel.value();
    itemData.type = self.typeModel.value() === "none" ? false : self.typeModel.value();
    itemData.what = "text";
    itemData.when = { timestamp: false, source: false };

    if (self.datetimeModel.value().datestring !== "XXXX-XX-XX XX:XX:XX")
    {
       itemData.when.source = self.datetimeModel.value();
       itemData.when.source.type = "manual";
       itemData.when.source.comment = "";
    }

    itemData.where = { latitude: self.positionModel.value().latitude, longitude: self.positionModel.value().longitude, _id: false, source: self.positionModel.value().latitude !== false ? "manual" : false };

    if (self.locationModel.value().length > 0)
    {
      itemData.where._id = self.locationModel.value()[0];
    }

    itemData._parents = self.relationsModel.value();

    self.errorText("");
    self.disabled(true);

    murrix.server.emit("saveItem", itemData, function(error, itemDataNew)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      console.log("Saved item!", itemDataNew);
      var item = murrix.cache.addItemData(itemDataNew);

      if (!itemData._id)
      {
        // TODO: Solve this in a nicer way!
        murrix.model.nodeModel.items.push(item);
      }

      self.reset();
      self.hide();
    });
  };

  self.saveHandler = function()
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
      murrix.cache.getItem(self.id(), function(error, item)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        var itemData = ko.mapping.toJS(item);

        self.saveItem(itemData);
      });
    }
    else
    {
      self.saveItem({});
    }
  };
};
