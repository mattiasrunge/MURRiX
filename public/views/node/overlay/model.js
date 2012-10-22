
var OverlayModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.item = ko.observable(false);

  self.show = ko.observable(false);

  self.item.subscribe(function(value)
  {
    if (self.show() !== (value !== false))
    {
      self.show(value !== false);
    }
  });

  parentModel.path().primary.subscribe(function(primary)
  {
    if (primary.args.length === 0)
    {
      console.log("OverlayModel: No item id specified setting item to false!");
      self.item(false);
      return;
    }

    var itemId = primary.args[0];

    console.log("OverlayModel: Got itemId = " + itemId);

    /*if (primary.action !== "node")
    {
      console.log("OverlayModel: Node not shown, setting node to false");
      self.node(false);
      return;
    }
    else */if (self.item() && itemId === self.item()._id())
    {
      console.log("OverlayModel: Item id is the same as before, will not update!");
      return;
    }

    murrix.cache.getItems([ itemId ], function(error, itemList)
    {
      if (error)
      {
        console.log(error);
        console.log("OverlayModel: Failed to find item!");
        return;
      }

      if (itemList.length === 0 || !itemList[itemId])
      {
        console.log("OverlayModel: No results returned, you probably do not have rights to this item!");
        return;
      }

      self.item(itemList[itemId]);
    });
  });

  self.carouselLeft = function()
  {
    var element = $(".carousel-inner").children(":visible").prev();

    if (element.length === 0)
    {
      element = $(".carousel-inner").children(":last");
    }

    document.location.hash = murrix.createPath(1, null, element.attr("data-murrix-id"));
  };

  self.carouselRight = function()
  {
    var element = $(".carousel-inner").children(":visible").next();

    if (element.length === 0)
    {
      element = $(".carousel-inner").children(":first");
    }

    document.location.hash = murrix.createPath(1, null, element.attr("data-murrix-id"));
  };

  self.commentText = ko.observable("");
  self.commentLoading = ko.observable(false);
  self.commentErrorText = ko.observable("");
  
  self.commentSubmit = function()
  {
    
    if (self.commentText() === "")
    {
      self.commentErrorText("Comment field can not be empty!");
      return;
    }

    self.commentErrorText("");
    self.commentLoading(true);

    var itemData = ko.mapping.toJS(self.item);

    if (!itemData.comments)
    {
      itemData.comments = [];
    }

    murrix.server.emit("commentItem", { id: self.item()._id(), text: self.commentText() }, function(error, itemData)
    {
      self.commentLoading(false);

      if (error)
      {
        self.commentErrorText(error);
        return;
      }

      self.commentText("");

      murrix.cache.addItemData(itemData); // This should update self.node() by reference
    });
  };
};
