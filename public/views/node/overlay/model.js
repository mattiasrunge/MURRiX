
var OverlayModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.item = ko.observable(false);
  self.itemPictureUrl = ko.observable("");

  self.show = ko.observable(false);

  self.item.subscribe(function(value)
  {
    if (self.show() !== (value !== false))
    {
      self.show(value !== false);
    }
  });

  self.show.subscribe(function(value)
  {
    if (!value)
    {
      self.editFinishClicked();
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
      self.itemPictureUrl("");
      self.initializeOverlayNodeQuery();
      self.initializeOverlayMap();



      var image = new Image();

      image.onload = function()
      {
        self.itemPictureUrl(image.src);
      };

      image.src = "preview?id=" + self.item()._id() + "&width=1440";
//      console.log(image.src);
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
    var newItem = null;

    self.showingId(false);
    self.showingItemOut();

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n] === self.item())
      {
        n--;

        if (n < 0)
        {
          n = parentModel.items().length - 1;
        }

        newItem = parentModel.items()[n];

        break;
      }
    }

    document.location.hash = murrix.createPath(1, null, newItem._id());
  };

  self.carouselRight = function()
  {
    var newItem = null;

    self.showingId(false);
    self.showingItemOut();

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n] === self.item())
      {
        n++;

        if (n >= parentModel.items().length)
        {
          n = 0;
        }

        newItem = parentModel.items()[n];

        break;
      }
    }

    document.location.hash = murrix.createPath(1, null, newItem._id());
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

      self.item(murrix.cache.addItemData(itemData)); // This should update self.node() by reference
    });
  };

  self.editType = ko.observable("");
  self.editLoading = ko.observable(false);
  self.editErrorText = ko.observable("");

  self.whereLatitude = ko.observable("");
  self.whereLongitude = ko.observable("");

  self.showingId = ko.observable(false);

  self.showingItemOver = function(showingItem)
  {
    if (self.showingId() !== false)
    {
      return;
    }

    showingItem = ko.mapping.toJS(showingItem);

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    var options = {
      minWidth      : 32,
      minHeight     : 32,
      instance      : true,
      movable       : false,
      resizable     : false,
      handles       : false,
      keys          : false,
      classPrefix   : 'imgareamark'
    };

    if (showingItem.x)
    {
      options.show = true;

      options.x1 = $(".imgContainer").width() * (showingItem.x - showingItem.width / 2);
      options.x2 = $(".imgContainer").width() * (showingItem.x + showingItem.width / 2);

      options.y1 = $(".imgContainer").height() * (showingItem.y - showingItem.height / 2);
      options.y2 = $(".imgContainer").height() * (showingItem.y + showingItem.height / 2);


      $(".imgContainer").imgAreaSelect(options);
    }
  };

  self.showingItemOut = function(showingItem)
  {
    if (self.showingId() !== false)
    {
      return;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });
  };

  self.showingonSelectEnd = function(img, selection)
  {
    var showingItem = { _id: self.showingId() };

    if (selection.width > 0 && selection.height > 0)
    {
      var pos_x = selection.x1 + (selection.width / 2);
      var pos_y = selection.y1 + (selection.height / 2);

      showingItem.x = pos_x / $(".imgContainer").width();
      showingItem.y = pos_y / $(".imgContainer").height();

      showingItem.width = selection.width / $(".imgContainer").width();
      showingItem.height = selection.height / $(".imgContainer").height();
    }

    self.showingUpdate(showingItem, showingItem);
  };

  self.showingItemClicked = function(data)
  {
    $(".imgContainer").imgAreaSelect({ "remove" : true });

    if (self.showingId() === data._id())
    {
      self.showingId(false);
      return;
    }

    self.showingId(data._id());

    var options = {
      minWidth      : 32,
      minHeight     : 32,
      instance      : true,
      movable       : true,
      resizable     : true,
      handles       : true,
      keys          : false,
      onSelectEnd   : function(img, selection) { self.showingonSelectEnd(img, selection); }
    };

    if (data.x)
    {
      options.show = true;

      options.x1 = $(".imgContainer").width() * (data.x() - data.width() / 2);
      options.x2 = $(".imgContainer").width() * (data.x() + data.width() / 2);

      options.y1 = $(".imgContainer").height() * (data.y() - data.height() / 2);
      options.y2 = $(".imgContainer").height() * (data.y() + data.height() / 2);
    }

    $(".imgContainer").imgAreaSelect(options);
  };

  self.showingEditClicked = function()
  {
    self.editType("showing");
    self.initializeOverlayNodeQuery();
  };

  self.whoEditClicked = function()
  {
    self.editType("who");
    self.initializeOverlayNodeQuery();
  };

  self.withEditClicked = function()
  {
    self.editType("with");
    self.initializeOverlayNodeQuery();
  };

  self.whenEditClicked = function()
  {
    self.editType("when");
  };

  self.whereEditClicked = function()
  {
    self.editType("where");
    self.initializeOverlayNodeQuery();
    self.initializeOverlayMap();
  };

  self.initializeOverlayMap = function()
  {
    if (self.editType() !== "where" || (self.item().where._id && self.item().where._id() !== false))
    {
      console.log("Not where or have location!");
      self.whereMap = null;
      return;
    }

    var position = new google.maps.LatLng(57.6706907666667, 11.9375348333333);

    self.whereLatitude("");
    self.whereLongitude("");

    if (self.item().where.latitude && self.item().where.latitude() && self.item().where.longitude && self.item().where.longitude())
    {
      position = new google.maps.LatLng(self.item().where.latitude(), self.item().where.longitude());
      self.whereLatitude(self.item().where.latitude());
      self.whereLongitude(self.item().where.longitude());
    }

    var options = {
      zoom: 13,
      center: position,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      streetViewControl: false,
      panControl: false,
      mapTypeControl: false,
      zoomControl: true,
    };

    self.whereMap = new google.maps.Map($(".overlayWhereMap").get(0), options);

    var marker = new google.maps.Marker({
      position: position,
      map: self.whereMap,
      draggable: true,
      visible: false
    });

    google.maps.event.addListener(marker, "dragend", function(data)
    {
      self.whereLatitude(marker.getPosition().lat());
      self.whereLongitude(marker.getPosition().lng());

      self.whereSavePosition("manual");
    });

    if (self.item().where.latitude && self.item().where.latitude() && self.item().where.longitude && self.item().where.longitude())
    {
      marker.setVisible(true);
    }

    google.maps.event.addListener(self.whereMap, "click", function(data)
    {
      marker.setPosition(data.latLng);
      marker.setVisible(true);

      self.whereLatitude(marker.getPosition().lat());
      self.whereLongitude(marker.getPosition().lng());

      self.whereSavePosition("manual");
    });
  };

  self.initializeOverlayNodeQuery = function()
  {
    $(".overlayNodeQuery").val("");

    $(".overlayNodeQuery").typesearch({
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
            if (self.item().showing && murrix.inArray(nodeDataList[key]._id, self.item().showing()))
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
        $(".overlayNodeQuery").val("");

        if (self.editType() === "showing")
        {
          self.showingAdd({ _id: key });
        }
        else if (self.editType() === "who")
        {
          self.whoSet(key);
        }
        else if (self.editType() === "with")
        {
          self.withSet(key);
        }
        else if (self.editType() === "where")
        {
          self.whereSet(key);
        }
      }
    });
  };

  self.editFinishClicked = function()
  {
    self.showingId(false);
    self.showingItemOut();

    self.editType("");
  };

  self.showingOther = ko.computed(function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item().showing)
      {
        for (var n = 0; n < self.item().showing().length; n++)
        {
          takenIds.push(self.item().showing()[n]._id());
        }
      }

      for (var n = 0; n < parentModel.items().length; n++)
      {
        if (!parentModel.items()[n].showing)
        {
          continue;
        }

        for (var i = 0; i < parentModel.items()[n].showing().length; i++)
        {
          if (!murrix.inArray(parentModel.items()[n].showing()[i]._id(), takenIds))
          {
            list.push(parentModel.items()[n].showing()[i]);
            takenIds.push(parentModel.items()[n].showing()[i]._id());
          }
        }
      }
    }

    return ko.observableArray(list);
  });

  self.whoOther = ko.computed(function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item()._who)
      {
        takenIds.push(self.item()._who());
      }

      for (var n = 0; n < parentModel.items().length; n++)
      {
        if (!parentModel.items()[n]._who || parentModel.items()[n]._who() === false)
        {
          continue;
        }

        if (!murrix.inArray(parentModel.items()[n]._who(), takenIds))
        {
          list.push(parentModel.items()[n]._who());
          takenIds.push(parentModel.items()[n]._who());
        }
      }
    }

    return ko.observableArray(list);
  });

  self.withOther = ko.computed(function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item()._with)
      {
        takenIds.push(self.item()._with());
      }

      for (var n = 0; n < parentModel.items().length; n++)
      {
        if (!parentModel.items()[n]._with || parentModel.items()[n]._with() === false)
        {
          continue;
        }

        if (!murrix.inArray(parentModel.items()[n]._with(), takenIds))
        {
          list.push(parentModel.items()[n]._with());
          takenIds.push(parentModel.items()[n]._with());
        }
      }
    }

    return ko.observableArray(list);
  });

  self.whereOther = ko.computed(function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item().where && self.item().where._id)
      {
        takenIds.push(self.item().where._id());
      }

      for (var n = 0; n < parentModel.items().length; n++)
      {
        if (!parentModel.items()[n].where || !parentModel.items()[n].where._id)
        {
          continue;
        }

        if (!murrix.inArray(parentModel.items()[n].where._id(), takenIds))
        {
          list.push(parentModel.items()[n].where._id());
          takenIds.push(parentModel.items()[n].where._id());
        }
      }
    }

    return ko.observableArray(list);
  });

  self.showingAdd = function(showingItem)
  {
    showingItem = ko.mapping.toJS(showingItem);

    showingItem = { _id: showingItem._id };

    self.showingUpdate(showingItem, showingItem);
  };

  self.showingRemove = function(showingItem)
  {
    self.showingItemOut();
    self.showingUpdate(showingItem, null);
  };

  self.showingUpdate = function(oldShowingItem, newShowingItem)
  {
    oldShowingItem = oldShowingItem ? ko.mapping.toJS(oldShowingItem) : null;
    newShowingItem = newShowingItem ? ko.mapping.toJS(newShowingItem) : null;

    var itemData = ko.mapping.toJS(self.item);

    itemData.showing = itemData.showing || [];

    if (oldShowingItem)
    {
      itemData.showing = itemData.showing.filter(function(showingItemTest)
      {
        return showingItemTest._id !== oldShowingItem._id;
      });
    }

    if (newShowingItem)
    {
      itemData.showing.push(newShowingItem);
    }

    self.saveItem(itemData);
  };

  self.whoRemove = function()
  {
    self.whoSet(false);
  };

  self.whoSet = function(id)
  {
    id = id ? ko.mapping.toJS(id) : false;

    var itemData = ko.mapping.toJS(self.item);

    itemData._who = id ? ko.mapping.toJS(id) : false;

    self.saveItem(itemData);
  };

  self.withRemove = function()
  {
    self.withSet(false);
  };

  self.whereRemove = function()
  {
    self.whereSet(false);
  };

  self.withSet = function(id)
  {
    id = id ? ko.mapping.toJS(id) : false;

    var itemData = ko.mapping.toJS(self.item);

    itemData._with = id ? ko.mapping.toJS(id) : false;

    self.saveItem(itemData);
  };

  self.whereSet = function(id)
  {
    id = id ? ko.mapping.toJS(id) : false;

    var itemData = ko.mapping.toJS(self.item);

    itemData.where = {};

    itemData.where._id = id;
    itemData.where.latitude = false;
    itemData.where.longitude = false;
    itemData.where.source = false;

    self.saveItem(itemData);
  };

  self.whereFileSet = function()
  {
    self.whereLatitude(self.item().specific.exif.GPSLatitude());
    self.whereLongitude(self.item().specific.exif.GPSLongitude());

    self.whereSavePosition("gps");
  };

  self.whereSavePosition = function(source)
  {
    var itemData = ko.mapping.toJS(self.item);

    itemData.where = {};

    itemData.where._id = false;
    itemData.where.latitude = self.whereLatitude();
    itemData.where.longitude = self.whereLongitude();
    itemData.where.source = source;

    self.saveItem(itemData);
  };

  self.saveItem = function(itemData)
  {
    self.editLoading(true);
    self.editErrorText("");

    murrix.server.emit("saveItem", itemData, function(error, itemData)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      self.item(murrix.cache.addItemData(itemData));
      self.initializeOverlayNodeQuery();
      self.initializeOverlayMap();
    });
  };


};
