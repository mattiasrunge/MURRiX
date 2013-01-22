
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "timeline"))
    {
      self.show(value.action === "timeline");
    }
  });


  /* Text item stuff */
  self.textItemEditLoading = ko.observable(false);
  self.textItemEditErrorText = ko.observable("");
  self.textItemEditId = ko.observable(false);
  self.textItemEditName = ko.observable("");
  self.textItemEditText = ko.observable("");
  self.textItemEditType = ko.observable("none");
  self.textItemEditYear = ko.observable("XXXX");
  self.textItemEditMonth = ko.observable("XX");
  self.textItemEditDay = ko.observable("XX");
  self.textItemEditHour = ko.observable("XX");
  self.textItemEditMinute = ko.observable("XX");
  self.textItemEditSecond = ko.observable("XX");
  self.textItemEditTimezone = ko.observable("(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna");
  self.textItemEditDaylightSavings = ko.observable(false);
  self.textItemEditPeople = ko.observableArray();

  self.textItemEditTimeUpdatedValue = function()
  {
    if (self.textItemEditYear() === "XXXX")
    {
      self.textItemEditMonth("XX");
    }

    if (self.textItemEditMonth() === "XX")
    {
      self.textItemEditDay("XX");
    }

    if (self.textItemEditDay() === "XX")
    {
      self.textItemEditHour("XX");
    }

    if (self.textItemEditHour() === "XX")
    {
      self.textItemEditMinute("XX");
    }

    if (self.textItemEditMinute() === "XX")
    {
      self.textItemEditSecond("XX");
    }

    var datestring = self.textItemEditYear() + "-" + self.textItemEditMonth() + "-" + self.textItemEditDay() + " " + self.textItemEditHour() + ":" + self.textItemEditMinute() + ":" + self.textItemEditSecond();
    self.textItemEditDaylightSavings(murrix.isDaylightSavings(datestring));
  };

  self.textItemEditPeopleRemove = function(data)
  {
    self.textItemEditErrorText("");

    if (data.id === parentModel.node()._id())
    {
      self.textItemEditErrorText("Can not remove the parent node");
      return;
    }

    self.textItemEditPeople(self.textItemEditPeople().filter(function(item)
    {
      return data.id !== item;
    }));
  };

  self.textItemEditTypeaheadNodeFilter = function(item)
  {
    return !murrix.inArray(item._id(), self.textItemEditPeople());
  };

  self.textItemEditTypeaheadUpdater = function(key)
  {
    if (!murrix.inArray(key, self.textItemEditPeople()))
    {
      self.textItemEditPeople.push(key);
    };
  };

  self.textItemEditSet = function(itemData)
  {
    self.textItemEditId(itemData._id ? itemData._id : false);
    self.textItemEditName(itemData.name ? itemData.name : "");
    self.textItemEditText(itemData.text ? itemData.text : "");
    self.textItemEditType(itemData.type ? itemData.type : "none");

    itemData.when = itemData.when || { timestamp: false, source: false }

    if (itemData.when.source !== false)
    {
      var data = murrix.parseDatestring(itemData.when.source.datestring);

      self.textItemEditYear(data.year);
      self.textItemEditMonth(data.month);
      self.textItemEditDay(data.day);
      self.textItemEditHour(data.hour);
      self.textItemEditMinute(data.minute);
      self.textItemEditSecond(data.second);

      self.textItemEditTimezone(itemData.when.source ? itemData.when.source : "Unknown");
      self.textItemEditDaylightSavings(itemData.when.source.daylightSavings);
    }

    self.textItemEditPeople(itemData._parents);
  };

  self.textItemEditUpdate = function(itemData)
  {
    if (self.textItemEditId() !== false)
    {
      itemData._id = self.textItemEditId();
    }

    itemData.name = self.textItemEditName();
    itemData.text = self.textItemEditText();
    itemData.type = self.textItemEditType() === "none" ? false : self.textItemEditType();
    itemData.what = "text";
    itemData.when = { timestamp: false, source: false }

    if (self.textItemEditYear() !== "XXXX")
    {
      itemData.when.source = {};

      itemData.when.source.type = "manual";
      itemData.when.source.comment = "";
      itemData.when.source.datestring = self.textItemEditYear() + "-" + self.textItemEditMonth() + "-" + self.textItemEditDay() + " " + self.textItemEditHour() + ":" + self.textItemEditMinute() + ":" + self.textItemEditSecond();
      itemData.when.source.daylightSavings = self.textItemEditDaylightSavings();
      itemData.when.source.timezone = self.textItemEditTimezone();
    }

    itemData._parents = self.textItemEditPeople();

    return itemData;
  };

  self.textItemEditSubmit = function(form)
  {
    var itemData = {};

    if (self.textItemEditId() !== false)
    {
      murrix.cache.getItem(self.textItemEditId(), function(error, item)
      {
        if (error)
        {
          self.textItemEditErrorText(error);
          return;
        };

        itemData = self.textItemEditUpdate(ko.mapping.toJS(item));

        self.textItemEditSave(itemData);
      });

      return;
    }

    itemData = self.textItemEditUpdate({});

    self.textItemEditSave(itemData);
  };

  self.textItemEditSave = function(newItemData)
  {
    self.textItemEditErrorText("");

    if (newItemData.name === "")
    {
      self.textItemEditErrorText("Text must have a name!");
      return;
    }

    self.textItemEditLoading(true);

    murrix.server.emit("saveItem", newItemData, function(error, itemData)
    {
      self.textItemEditLoading(false);

      if (error)
      {
        self.textItemEditErrorText(error);
        return;
      }

      console.log("Saved item!");
      var item = murrix.cache.addItemData(itemData);

      if (!newItemData._id)
      {
        // TODO: this may be a hack...
        murrix.model.nodeModel.items.push(item);
      }

      self.textItemEditReset();

      $(".modal").modal('hide');
    });
  };

  self.textItemEditReset = function()
  {
    self.textItemEditLoading(false);
    self.textItemEditErrorText("");
    self.textItemEditId(false);
    self.textItemEditName("");
    self.textItemEditText("");
    self.textItemEditType("none");
    self.textItemEditYear("XXXX");
    self.textItemEditMonth("XX");
    self.textItemEditDay("XX");
    self.textItemEditHour("XX");
    self.textItemEditMinute("XX");
    self.textItemEditSecond("XX");
    self.textItemEditTimezone("(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna");
    self.textItemEditDaylightSavings(false);
    self.textItemEditPeople.removeAll();
  };

  self.textItemEditOpenNew = function()
  {
    self.textItemEditReset();

    self.textItemEditPeople.push(parentModel.node()._id());

    $("#textItemEditModal").modal('show');
  };

  self.textItemEditOpen = function(item)
  {
    self.textItemEditReset();

    itemData = ko.mapping.toJS(item);

    self.textItemEditSet(itemData);

    $("#textItemEditModal").modal('show');
  };

  self.textItemEditOpenType = function(type)
  {
    self.textItemEditReset();

    self.textItemEditType(type);

    $("#textItemEditModal").modal('show');
  };

};
