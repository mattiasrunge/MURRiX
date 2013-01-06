
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

  self.textItemEditSubmit = function(form)
  {
    var itemData = {};

    if (self.textItemEditId() !== false)
    {
      murrix.cache.getItem(self.textItemEditId(), function(error, item)
      {
        itemData = ko.mapping.toJS(item);

        itemData.text = self.textItemEditText();
        itemData.name = self.textItemEditName();

        self.textItemEditSave(itemData);
      });

      return;
    }

    itemData._parents = [ parentModel.node()._id() ];
    itemData.showing = [ { _id: parentModel.node()._id() } ];
    itemData.what = "text";
    itemData.when = { timestamp: false, source: false };
    itemData.text = self.textItemEditText();
    itemData.name = self.textItemEditName();

    self.textItemEditSave(itemData);
  };

  self.textItemEditSave = function(newItemData)
  {
    self.textItemEditLoading(true);
    self.textItemEditErrorText("");

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

      self.textItemEditId(false);
      self.textItemEditName("");
      self.textItemEditText("");

      $(".modal").modal('hide');
    });
  };

  self.textItemEditOpen = function(data)
  {
    self.textItemEditId(data._id());
    self.textItemEditName(data.name());
//     self.textItemEditDatetime(moment(data.whenTimestamp()).format("YYYY-MM-dd HH:mm:ss"));
//     self.textItemEditTimezone(0);
//     self.textItemEditDaylightSavings(false);
    self.textItemEditText(data.text());

    $("#textItemEditModal").modal("show");
  };

};
