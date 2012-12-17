
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

  self.timeout = null;

  $(window).on("resize", function()
  {
    if (self.timeout === null)
    {
      self.timeout = setTimeout(function()
      {
        self.detectFaces();
      }, 500);
    }
  });

  self.detectFaces = function()
  {
    $(".face").remove();

//     murrix.server.emit("detectFaces", self.item()._id(), function(error, coords)
//     {
//       if (error)
//       {
//         console.log(error);
//         self.timeout = null;
//         return;
//       }
//
//       console.log("coords", coords);
// /*
//     coords.push({ x: 2047, y: 160, w: 116, h: 116 });
//     coords.push({ x: 1467, y: 2511, w: 105, h: 105 });
//     coords.push({ x: 2908, y: 2420, w: 117, h: 117 });
//     coords.push({ x: 1547, y: 679, w: 267, h: 267 });
//     coords.push({ x: 2043, y: 783, w: 246, h: 246 });
//     coords.push({ x: 2446, y: 804, w: 267, h: 267 });
//     coords.push({ x: 2956, y: 710, w: 292, h: 292 });
//     coords.push({ x: 1881, y: 1684, w: 286, h: 286 });*/
//
//
//     var imgHeight = murrix.intval(self.item().specific.exif.ImageHeight());
//     var imgWidth = murrix.intval(self.item().specific.exif.ImageWidth());
//
//
//     if (self.item().specific.angle && self.item().specific.angle === 90 || self.item().specific.angle === 270)
//     {
//       var t = imgHeight;
//       imgHeight = imgWidth;
//       imgWidth = t;
//     }
//
//  console.log(imgHeight, imgWidth);
//     var scaleHeight = $(".imgContainer:visible").height();
//     var scaleWidth = $(".imgContainer:visible").width();
//  console.log(scaleHeight, scaleWidth);
//     var ratioHeight = scaleHeight / imgHeight;
//     var ratioWidth = scaleWidth / imgWidth;
//  console.log(ratioHeight, ratioWidth);
//     for (var i = 0; i < coords.length; i++) {
//       console.log(coords[i].h, coords[i].w);
//        console.log(coords[i].y, coords[i].x);
//
//        console.log(coords[i].h * ratioHeight, coords[i].w * ratioWidth);
//        console.log(coords[i].y * ratioHeight, coords[i].x * ratioWidth);
//
//        console.log("==================");
//
//       $('<div>', {
//         'class':'face',
//         'css': {
//           'position': 'absolute',
//           'left':   Math.floor(coords[i].x * ratioWidth) +'px',
//           'top':    Math.floor(coords[i].y * ratioHeight) +'px',
//           'width':  Math.floor(coords[i].w * ratioWidth)   +'px',
//           'height':   Math.floor(coords[i].h * ratioHeight)  +'px',
//           'border': '1px solid red'
//         }
//       })
//       .appendTo('.imgContainer:visible');
//     }
//
//     self.timeout = null;
//     });
  };

/*
  self.detectFaces = function()
  {
    var coords = $('.imgContainer img:visible').faceDetection({
      complete:function(img, coords) {
        console.log('Done!');
        console.log(coords);
      },
      error:function(img, code, message) {
        console.log('Error: '+message);
      }
    });

    console.log(coords);

    for (var i = 0; i < coords.length; i++) {
      $('<div>', {
        'class':'face',
        'css': {
          'position': 'absolute',
          'left':   coords[i].positionX +'px',
          'top':    coords[i].positionY +'px',
          'width':  coords[i].width   +'px',
          'height':   coords[i].height  +'px',
          'border': '1px solid red'
        }
      })
      .appendTo('.imgContainer');
    }
  };
*/
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


  self.showingEditing = ko.observable(false);
  self.showingName = ko.observable("");
  self.showingLoading = ko.observable(false);
  self.showingErrorText = ko.observable("");

  self.showingEditClicked = function()
  {
    self.showingEditing(true);

    $("#showingInput").typesearch({
      source: function(query, callback)
      {
        murrix.server.emit("find", { query: { name: { $regex: ".*" + query + ".*", $options: "-i" } }, options: { collection: "nodes" } }, function(error, nodeDataList)
        {
          if (error)
          {
            console.log(error);
            callback([]);
          }

          var resultList = [];

          for (var key in nodeDataList)
          {
            if (self.item()._showing && murrix.inArray(nodeDataList[key]._id, self.item()._showing()))
            {
              continue;
            }

            var imgUrl = "http://placekitten.com/g/32/32";

            if (nodeDataList[key]._profilePicture)
            {
              imgUrl = "/preview?id=" + nodeDataList[key]._profilePicture + "&width=32&height=32&square=1";
            }

            var item = {};
            item.name = nodeDataList[key].name;
            item.key = nodeDataList[key]._id;
            item.html = "<li ><a href='#'><img src='" + imgUrl + "'><span class='typesearch-name' style='margin-left: 20px'></span></a></li>";

            resultList.push(item);
          }

          callback(resultList);
        });
      },
      selectFn: function(key)
      {
        self.showingAdd(key);
      }
    });
  };

  self.showingFinishClicked = function()
  {
    self.showingEditing(false);
  };

  self.showingOther = ko.computed(function()
  {
    var list = [];

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (!parentModel.items()[n]._showing || parentModel.items()[n]._id() === self.item()._id())
      {
        continue;
      }

      for (var i = 0; i < parentModel.items()[n]._showing().length; i++)
      {
        if (!self.item()._showing || !murrix.inArray(parentModel.items()[n]._showing()[i], self.item()._showing()))
        {
          if (!murrix.inArray(parentModel.items()[n]._showing()[i], list))
          {
            list.push(parentModel.items()[n]._showing()[i]);
          }
        }
      }
    }

    return ko.observableArray(list);
  });


  self.showingSubmit = function()
  {
    // Do nothing
  };

  self.showingAdd = function(key)
  {
    console.log(key);

    self.showingLoading(true);
    self.showingErrorText("");

    var itemData = ko.mapping.toJS(self.item);

    itemData._showing = itemData._showing || [];

    if (murrix.inArray(key, itemData._showing))
    {
      self.showingLoading(false);
      self.showingErrorText("Item is already in list");
      return;
    }

    itemData._showing = murrix.addToArray(key, itemData._showing);

    murrix.server.emit("saveItem", itemData, function(error, itemData)
    {
      self.showingLoading(false);

      if (error)
      {
        self.showingErrorText(error);
        return;
      }

      self.showingName("");

      murrix.cache.addItemData(itemData);
    });
  };

  self.showingRemove = function()
  {
    self.showingLoading(true);
    self.showingErrorText("");

    var itemData = ko.mapping.toJS(self.item);

    itemData._showing = itemData._showing || [];

    itemData._showing = murrix.removeFromArray(this.toString(), itemData._showing);

    murrix.server.emit("saveItem", itemData, function(error, itemData)
    {
      self.showingLoading(false);

      if (error)
      {
        self.showingErrorText(error);
        return;
      }

      murrix.cache.addItemData(itemData);
    });
  };
};
