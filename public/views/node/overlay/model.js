
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

    self.videoFile("");

    murrix.cache.getItem(itemId, function(error, item)
    {
      if (error)
      {
        console.log(error);
        console.log("OverlayModel: Failed to find item!");
        return;
      }

      self.item(item);
      self.whoInitialize();
      self.initializeOverlayMap();
      self.description(self.item().description ? self.item().description() : "");

      self.videoFile('/video?id=' + self.item()._id());
    });
  });

  self.videoFile = ko.observable("");









//   self.timeout = null;
//
//   $(window).on("resize", function()
//   {
//     if (self.timeout === null)
//     {
//       self.timeout = setTimeout(function()
//       {
//         self.detectFaces();
//       }, 500);
//     }
//   });

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
//     var imgHeight = murrix.intval(self.item().exif.ImageHeight());
//     var imgWidth = murrix.intval(self.item().exif.ImageWidth());
//
//
//     if (self.item().angle && self.item()..angle === 90 || self.item().angle === 270)
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

  self.itemIndex = ko.computed(function()
  {
    var index = -1;

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n] === self.item())
      {
        index = n;
        break;
      }
    }

    return index;
  });

  self.carouselLeft = function()
  {
    self.showingData(false);
    self.showingItemOut();

    if (self.itemIndex() === -1)
    {
      console.log("Invalid index!");
      return;
    }

    var newIndex = self.itemIndex() - 1;

    if (newIndex < 0)
    {
      newIndex = parentModel.items().length - 1;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    document.location.hash = murrix.createPath(1, null, parentModel.items()[newIndex]._id());
  };

  self.carouselRight = function()
  {
    self.showingData(false);
    self.showingItemOut();

    if (self.itemIndex() === -1)
    {
      console.log("Invalid index!");
      return;
    }

    var newIndex = self.itemIndex() + 1;

    if (newIndex >= parentModel.items().length)
    {
      newIndex = 0;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    document.location.hash = murrix.createPath(1, null, parentModel.items()[newIndex]._id());
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

  self.description = ko.observable("");
  self.descriptionSave = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    itemData.description = self.description();

    self.saveItem(itemData, true);
  };

  self.setThumbPosition = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    itemData.thumbPosition = $(".overlayVideo").get(0).currentTime;

    itemData.previewTimestamp = murrix.timestamp();

    self.saveItemClearCache(itemData);
  };

  self.rotateRight = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    if (!itemData.angle)
    {
      itemData.angle = 0;
    }

    itemData.angle -= 90;

    if (itemData.angle < 0)
    {
      itemData.angle = 270;
    }

    itemData.previewTimestamp = murrix.timestamp();

    self.saveItemClearCache(itemData);
  };

  self.rotateLeft = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    if (!itemData.angle)
    {
      itemData.angle = 0;
    }

    itemData.angle += 90;

    if (itemData.angle > 270)
    {
      itemData.angle = 0;
    }

    itemData.previewTimestamp = murrix.timestamp();

    self.saveItemClearCache(itemData);
  };

  self.mirror = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    itemData.mirror = !itemData.mirror;

    itemData.previewTimestamp = murrix.timestamp();

    self.saveItemClearCache(itemData);
  };

  self.whereLatitude = ko.observable("");
  self.whereLongitude = ko.observable("");







  self.showingData = ko.observable(false);

  self.showingItemOver = function(showingItem)
  {
    if (self.showingData() !== false)
    {
      return;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    if (self.showingTimer)
    {
      clearTimeout(self.showingTimer);
      self.showingTimer = null;
    }

    showingItem = ko.mapping.toJS(showingItem);

    var options = {
      minWidth      : 32,
      minHeight     : 32,
      instance      : true,
      movable       : false,
      resizable     : false,
      handles       : false,
      keys          : false,
      classPrefix   : 'imgareamark',
      fadeSpeed     : 200
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

  self.showingTimer = null;

  self.showingItemOut = function(showingItem)
  {
    if (self.showingTimer)
    {
      clearTimeout(self.showingTimer);
      self.showingTimer = null;
    }

    if (self.showingData() !== false)
    {
      return;
    }

    self.showingTimer = setTimeout(function() { self.showingUnmark(); }, 300);
  };

  self.showingUnmark = function()
  {
    if (self.showingData() !== false)
    {
      return;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    self.showingTimer = null;
  };

  self.showingonSelectEnd = function(img, selection)
  {
    var showingItem = { _id: self.showingData()._id() };

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

  self.imageRemoved = function(elements)
  {
    console.log("imageRemoved", elements);
  };

  self.showingItemClicked = function(data)
  {
    if (self.item() === false || self.item().whatDetailed() !== "imageFile")
    {
      return;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    if (self.showingData() !== false && self.showingData()._id() === data._id())
    {
      self.showingData(false);
      return;
    }

    self.showingData(data);

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
  };

  self.whoEditClicked = function()
  {
    self.editType("who");
  };

  self.withEditClicked = function()
  {
    self.editType("with");
  };

  self.whenEditClicked = function()
  {
    self.editType("when");
  };

  self.whereEditClicked = function()
  {
    self.editType("where");
    self.initializeOverlayMap();
  };

  self.initializeOverlayMap = function()
  {
    if (self.editType() !== "where" || (self.item().where && self.item().where._id && self.item().where._id() !== false))
    {
      console.log("Not where or have location!");
      self.whereMap = null;
      return;
    }

    var position = new google.maps.LatLng(57.6706907666667, 11.9375348333333);

    self.whereLatitude("");
    self.whereLongitude("");

    if (self.item().where && self.item().where.latitude && self.item().where.latitude() !== false && self.item().where.longitude && self.item().where.longitude() !== false)
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

    if (self.item().where && self.item().where.latitude && self.item().where.latitude() !== false && self.item().where.longitude && self.item().where.longitude() !== false)
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



  self.whereTypeaheadFilter = function(item)
  {
    return (!self.item()._where || !self.item()._where._id || self.item()._where._id() != item._id());
  };

  self.whereTypeaheadUpdater = function(key)
  {
    self.whereSet(key);
  };

  self.withTypeaheadFilter = function(item)
  {
    return (!self.item()._with || self.item()._with() != item._id());
  };

  self.withTypeaheadUpdater = function(key)
  {
    self.withSet(key);
  };

  self.showingTypeaheadFilter = function(item)
  {
    if (!self.item().showing)
    {
      return true;
    }

    for (var n = 0; n < self.item().showing().length; n++)
    {
      if (self.item().showing()[n]._id() === item._id())
      {
        return false;
      }
    }

    return true;
  };

  self.showingTypeaheadUpdater = function(key)
  {
    self.showingAdd({ _id: key });
  };


  self.editFinishClicked = function()
  {
    self.showingData(false);
    self.showingItemOut();

    $(".imgContainer").imgAreaSelect({ "remove" : true });

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





  self.whoModel = new DialogComponentNodeListModel(self);
  self.whoModel.max(1);
  self.whoModel.types([ "person" ]);
  self.whoInitializing = false;

  self.whoInitialize = function()
  {
    self.whoInitializing = true;

    self.whoModel.reset();

    if (self.item() !== false)
    {
      if (self.item()._who() !== false)
      {
        self.whoModel.value.push(self.item()._who());
      }

      self.whoLoadSuggestions();
    }

    self.whoInitializing = false;
  }

  self.whoModel.value.subscribe(function(value)
  {
    if (self.whoInitializing)
    {
      return;
    }

    var itemData = ko.mapping.toJS(self.item);

    if (value.length === 0)
    {
      itemData._who = false;
    }
    else
    {
      itemData._who = value[0];
    }

    self.saveItem(itemData);
  });

  self.whoLoadSuggestions = function()
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

      self.whoModel.suggestions(list);
    }
  };

  parentModel.items.subscribe(function()
  {
    self.whoLoadSuggestions();
  });










  self.withOther = ko.observableArray();

  self.withOther2 = ko.computed(function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item()._with)
      {
        takenIds.push(self.item()._with());
      }

      if (self.item().exif && self.item().exif.Model)
      {
        murrix.server.emit("find", { query: { name: self.item().exif.Model(), type: "camera" }, options: "nodes" }, function(error, nodeDataList)
        {
          if (error)
          {
            console.log(error);
            return;
          }

          for (var n in nodeDataList)
          {
            var node = murrix.cache.addNodeData(nodeDataList[n]);

            if (!murrix.inArray(node._id(), takenIds))
            {
              list.push(node._id());
              takenIds.push(node._id());
            }
          }

          self.withOther(list);
        });
      }
      else
      {
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
    }

    self.withOther(list);
  });

  self.withCreateFromExif = function()
  {
    murrix.model.dialogModel.cameraNodeModel.showCreate(function(node)
    {
      self.withSet(node._id());
    });

    murrix.model.dialogModel.cameraNodeModel.name(self.item().exif.Model());
  };

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
        if (!parentModel.items()[n].where || !parentModel.items()[n].where._id || parentModel.items()[n].where._id() === false)
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


  self.showingCreatePerson = function()
  {
    murrix.model.dialogModel.personNodeModel.showCreate(function(node)
    {
      self.showingAdd({ _id: node._id() });
    });
  };

  self.showingCreateVehicle = function()
  {
     murrix.model.dialogModel.vechicleNodeModel.showCreate(function(node)
    {
      self.showingAdd({ _id: node._id() });
    });
  };

  self.showingCreateCamera = function()
  {
    parentModel.editCameraOpen(function(node)
    {
      self.showingAdd({ _id: node._id() });
    });
  };

  self.showingAdd = function(showingItem)
  {
    showingItem = ko.mapping.toJS(showingItem);

    showingItem = { _id: showingItem._id };

    self.showingUpdate(showingItem, showingItem);
  };

  self.showingRemove = function(showingItem)
  {
    $(".imgContainer").imgAreaSelect({ "remove" : true });
    self.showingData(false);

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

    self.saveItem(itemData, true);
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
    self.whereLatitude(self.item().exif.GPSLatitude());
    self.whereLongitude(self.item().exif.GPSLongitude());

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

  self.saveItem = function(itemData, noreload, callback)
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

      var item = murrix.cache.addItemData(itemData);

      if (!noreload)
      {
        self.item(item);
      }

      self.initializeOverlayMap();
      self.whoInitialize();

      if (callback)
      {
        callback();
      }
    });
  };

  self.saveItemClearCache = function(itemData)
  {
    self.editLoading(true);
    self.editErrorText("");

    murrix.server.emit("clearCache", itemData._id, function(error)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      self.editLoading(true);

      murrix.server.emit("saveItem", itemData, function(error, itemData)
      {
        self.editLoading(false);

        if (error)
        {
          self.editErrorText(error);
          return;
        }

        var item = murrix.cache.addItemData(itemData);

        self.initializeOverlayMap();
      });
    });
  };







  self.whenType = ko.observable("manual");
  self.whenYear = ko.observable("XXXX");
  self.whenMonth = ko.observable("XX");
  self.whenDay = ko.observable("XX");
  self.whenHour = ko.observable("XX");
  self.whenMinute = ko.observable("XX");
  self.whenSecond = ko.observable("XX");
  self.whenReference = ko.observable("X");
  self.whenTimezone = ko.observable("Unknown");
  self.whenDaylightSavings = ko.observable(false);
  self.whenComment = ko.observable("");

  self.whenYearDisabled = ko.observable(false);
  self.whenMonthDisabled = ko.observable(false);
  self.whenDayDisabled = ko.observable(false);
  self.whenHourDisabled = ko.observable(false);
  self.whenMinuteDisabled = ko.observable(false);
  self.whenSecondDisabled = ko.observable(false);
  self.whenReferenceDisabled = ko.observable(false);
  self.whenTimezoneDisabled = ko.observable(false);
  self.whenDaylightSavingsDisabled = ko.observable(false);

  self.item.subscribe(function(value)
  {
    if (value === false)
    {
      self.whenReset();
      return;
    }

    self.whenInitialize(ko.mapping.toJS(value.when.source));
  });

  self.whenReferenceVisible = ko.computed(function()
  {
    if (self.item() === false)
    {
      return false;
    }

    if (self.item().what() !== "file")
    {
      return false;
    }

    if (typeof self.item().when.source === "function")
    {
      return false;
    }

    if (self.item().when.source.type() !== "gps" && self.item().when.source.type() !== "manual")
    {
      return false;
    }

    if (self.whenType() === "manual")
    {
      if (self.whenSecond() === "X" || self.whenTimezone() === "Unknown")
      {
        return false;
      }
    }

    if (!self.item().exif.DateTimeOriginal)
    {
      return false;
    }

    if (self.item().with() === false)
    {
      return false;
    }

    return true;
  });

  self.whenReferenceSelf = ko.computed(function()
  {
    if (self.whenReferenceVisible() === false)
    {
      return false;
    }

    if (self.item().with().referenceTimelines)
    {
      for (var n = 0; n < self.item().with().referenceTimelines().length; n++)
      {
        if (self.item().with().referenceTimelines()[n]._id() === self.item()._id())
        {
          return self.item().with().referenceTimelines()[n];
        }
      }
    }

    return false;
  });

  self.whenReferenceCreateAllowed = ko.computed(function()
  {
    if (self.whenReferenceVisible() === false || self.whenReferenceSelf() === true)
    {
      return false;
    }

    var cameraTimestamp = self.whenCreateExifCameraTimestamp();

    if (cameraTimestamp === false)
    {
      return false;
    }

    var offset = self.item().when.timestamp() - cameraTimestamp;

    if (self.item().with().referenceTimelines)
    {
      for (var n = 0; n < self.item().with().referenceTimelines().length; n++)
      {
        if (self.item().with().referenceTimelines()[n].offset() === offset)
        {
          return false;
        }
      }
    }

    return true;
  });

  self.whenReferences = ko.computed(function()
  {
    var list = [];

    if (self.item() === false || self.item().with() === false)
    {
      return false;
    }

    list.push({ id: "X", name: "Default" });

    for (var n = 0; n < self.item().with().referenceTimelines().length; n++)
    {
      list.push({ id: self.item().with().referenceTimelines()[n]._id(), name: self.item().with().referenceTimelines()[n].name() });
    }

    list.push({ id: "None", name: "Use manual timezone" });

    return list;
  });

  self.whenCreateExifCameraTimestamp = function()
  {
    if (self.item() === false || !self.item().exif.DateTimeOriginal)
    {
      return false;
    }

    return murrix.timestamp(murrix.cleanDatestring(self.item().exif.DateTimeOriginal()) + " +00:00");
  };

  self.whenCreateReference = function()
  {
    self.editLoading(false);
    self.editErrorText("");

    if (self.whenReferenceCreateAllowed() === false)
    {
       self.editErrorText("Not allowed to create reference timeline!");
       return;
    }

    var reference = {};

    reference._id = self.item()._id();
    reference.type = "utc";
    reference.offset = self.item().when.timestamp() - self.whenCreateExifCameraTimestamp();
    reference.name = "(UTC " + reference.offset + "s) from " + self.item().name();
    console.log(reference);

    self.editLoading(true);

    murrix.server.emit("createReferenceTimeline", { id: self.item()._with(), reference: reference}, function(error, nodeData)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      murrix.cache.addNodeData(nodeData);
    });
  };

  self.whenRemoveReference = function()
  {
    self.editLoading(false);
    self.editErrorText("");

    self.editLoading(true);

    murrix.server.emit("removeReferenceTimeline", { id: self.item()._with(), referenceId: self.whenReferenceSelf()._id()}, function(error, nodeData)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      murrix.cache.addNodeData(nodeData);
    });
  };

  self.whenManualTimezoneAllowed = ko.computed(function()
  {
    // If we have no item it does not really matter
    if (self.item() === false)
    {
      return true;
    }

    // If we have no with, only manual remains
    if (self.item().with() === false)
    {
      return true;
    }
    else
    {
      // If we have no reference timelines or have selected none
      if ((!self.item().with().referenceTimelines || self.item().with().referenceTimelines().length === 0) || self.whenReference() === 'None')
      {
        return true;
      }
    }

    // If we are in manual mode
    if (self.whenType() === 'manual')
    {
      return true;
    }

    return false;
  });

  self.whenManualDaylightSavingsAllowed = ko.computed(function()
  {
    // If we have no item it does not really matter
    if (self.item() === false)
    {
      return true;
    }

    // If we have no with, only manual remains
    if (self.item().with() === false)
    {
      return true;
    }
    // If we have a camera and are in camera mode, daylight savings will be handled by camera setting
    else if (self.whenType() === 'camera')
    {
      return false
    }

    // If we have no reference timelines we or have selected none
    if (!self.item().with().referenceTimelines || self.item().with().referenceTimelines().length === 0 || self.whenReference() === 'None')
    {
      return true;
    }

    // If we are in manual mode
    if (self.whenType() === 'manual')
    {
      return true;
    }

    return false;
  });

  self.whenUpdatedValue = function()
  {
    if (self.whenType() === "manual" || (self.whenType() === "camera" && self.whenReference() === "None") || (self.whenType() === "camera" && self.item().with() !== false && (self.item().with().mode() === 'autoDatetime' || self.item().with().mode() === 'autoDaylightSavings')))
    {
      var datestring = self.whenYear() + "-" + self.whenMonth() + "-" + self.whenDay() + " " + self.whenHour() + ":" + self.whenMinute() + ":" + self.whenSecond();

      self.whenDaylightSavings(murrix.isDaylightSavings(datestring));
    }
  };

  self.whenSetDatestring = function(datestring)
  {
    var data = murrix.parseDatestring(datestring);

    self.whenYear(data.year);
    self.whenMonth(data.month);
    self.whenDay(data.day);
    self.whenHour(data.hour);
    self.whenMinute(data.minute);
    self.whenSecond(data.second);
  };

  self.whenReset = function()
  {
    self.whenType("manual");
    self.whenYear("XXXX");
    self.whenMonth("XX");
    self.whenDay("XX");
    self.whenHour("XX");
    self.whenMinute("XX");
    self.whenSecond("XX");
    self.whenReference("X");
    self.whenTimezone("Unknown");
    self.whenDaylightSavings(false);
    self.whenComment("");

    self.whenYearDisabled(false);
    self.whenMonthDisabled(false);
    self.whenDayDisabled(false);
    self.whenHourDisabled(false);
    self.whenMinuteDisabled(false);
    self.whenSecondDisabled(false);
    self.whenReferenceDisabled(false);
    self.whenTimezoneDisabled(false);
    self.whenDaylightSavingsDisabled(false);
  };

  self.whenInitialize = function(source)
  {
    self.whenReset();

    if (self.item() === false)
    {
      return;
    }

    if (source.type === "gps")
    {
      self.whenType("gps");

      self.whenSetDatestring(source.datestring);

      self.whenTimezone("(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London");
      self.whenDaylightSavings(false);
      self.whenReference("X");
      self.whenComment("");

      self.whenYearDisabled(true);
      self.whenMonthDisabled(true);
      self.whenDayDisabled(true);
      self.whenHourDisabled(true);
      self.whenMinuteDisabled(true);
      self.whenReferenceDisabled(true);
      self.whenSecondDisabled(true);
      self.whenTimezoneDisabled(true);
      self.whenDaylightSavingsDisabled(true);
    }
    else if (source.type === "camera")
    {
      self.whenType("camera");

      self.whenSetDatestring(source.datestring);

      self.whenTimezone(source.timezone);
      self.whenDaylightSavings(source.daylightSavings);
      console.log(source.reference);
      self.whenReference(source.reference === false ? "X" : source.reference);
      console.log(self.whenReference());
      self.whenComment("");

      self.whenYearDisabled(true);
      self.whenMonthDisabled(true);
      self.whenDayDisabled(true);
      self.whenHourDisabled(true);
      self.whenMinuteDisabled(true);
      self.whenSecondDisabled(true);
      self.whenReferenceDisabled(false);
      self.whenTimezoneDisabled(false);
      self.whenDaylightSavingsDisabled(false);

    }
    else if (source.type === "manual")
    {
      self.whenType("manual");

      self.whenSetDatestring(source.datestring);

      self.whenTimezone(source.timezone);
      self.whenDaylightSavings(source.daylightSavings);
      self.whenReference(source.reference === false ? "X" : source.reference);
      self.whenComment(source.comment);

      self.whenYearDisabled(false);
      self.whenMonthDisabled(false);
      self.whenDayDisabled(false);
      self.whenHourDisabled(false);
      self.whenMinuteDisabled(false);
      self.whenSecondDisabled(false);
      self.whenReferenceDisabled(false);
      self.whenTimezoneDisabled(false);
      self.whenDaylightSavingsDisabled(false);
    }
  };

  self.whenSave = function()
  {
    var source = {};

    source.type = self.whenType();
    source.datestring = self.whenYear() + "-" + self.whenMonth() + "-" + self.whenDay() + " " + self.whenHour() + ":" + self.whenMinute() + ":" + self.whenSecond();

    if (source.type === "camera")
    {
      source.reference = self.whenReference() === "X" ? false : self.whenReference();
    }

    if (source.type === "camera" || source.type === "manual")
    {
      console.log(self.whenDaylightSavings());
      console.log(self.whenTimezone());
      source.daylightSavings = self.whenDaylightSavings();
      source.timezone = self.whenTimezone();
    }

    if (source.type === "manual")
    {
      source.comment = self.whenComment();
    }


    var itemData = ko.mapping.toJS(self.item);

    itemData.when = {};
    itemData.when.source = source;
    itemData.when.timestamp = false;

    console.log(itemData);

    self.saveItem(itemData);
  };

  self.whenSetManual = function()
  {
     self.whenReset();
  };

  self.whenSetExifGps = function(data)
  {
    var source = {};

    source.type = "gps";
    source.datestring = murrix.cleanDatestring(self.item().exif.GPSDateTime());

    self.whenInitialize(source);

    self.whenUpdatedValue();
  };

  self.whenSetExifCamera = function(data)
  {
    var source = {};

    source.type = "camera";
    source.datestring = murrix.cleanDatestring(self.item().exif.DateTimeOriginal());
    source.reference = false;
    source.timezone = false;

    self.whenInitialize(source);

    self.whenUpdatedValue();
  };




/*
  // This variable should contain best guess for timezone UTC offset
  self.whenManualTimezone = ko.observable(-(new Date()).getTimezoneOffset() * 60);
  self.whenManualDaylightSavings = ko.observable(false);
  self.whenManualDatetime = ko.observable("");
  self.whenManualSource = ko.observable("manual");

  self.whenManualSubmit = function()
  {
    if (self.whenManualDatetime() === "")
    {
      self.editErrorText = ko.observable("Can not set empty manual date and time!");
      return;
    }

    var itemData = ko.mapping.toJS(self.item);

    itemData.when = {};

    itemData.when.timestamp = (new Date(self.whenManualDatetime() + " +00:00")).getTime() / 1000;

    itemData.when.timestamp += parseInt(self.whenManualTimezone(), 10);

    if (self.whenManualDaylightSavings())
    {
      itemData.when.timestamp += 3600;
    }

    itemData.when.source = self.whenManualSource();
    itemData.when._syncId = false;

    self.saveItem(itemData);
  };

  self.whenUpdateTimezone = function()
  {
    return; // TODO: Decide how to do this if it should be done
//     if (self.item().where)
//     {
//       if (self.item().where.latitude && self.item().where.latitude() !== false &&
//           self.item().where.longitude && self.item().where.longitude() !== false
//       )
//       {
//         var options = {};
//         options.location = self.item().where.latitude() + "," + self.item().where.longitude();
//         options.timestamp = 0;
//         options.sensor = false;
//
//         jQuery.getJSON("https://maps.googleapis.com/maps/api/timezone/json", options, function(data)
//         {
//           if (data.status !== "OK")
//           {
//             console.log("Lookup of timezone failed", options, data);
//             self.whenTimezone((new Date()).getTimezoneOffset() * 60);
//             return;
//           }
//
//           console.log(options, data);
//
//           self.whenTimezone(data.rawOffset);
//         });
//
//         return;
//       }
//       else if (self.item().where._id && self.item().where._id() !== false)
//       {
//         console.log("TODO - Location timezone lookup");
//         // Check location and if location has coordinates use them to finde timezone
//         self.whenTimezone((new Date()).getTimezoneOffset() * 60);
//       }
//     }
  };*/


/*
  self.whenCreateOffsetName = ko.observable("");

  self.whenSetOffset = function(data)
  {
    var itemData = ko.mapping.toJS(self.item);

    if (itemData.when._syncId === data._id())
    {
      itemData.when._syncId = false;
    }
    else
    {
      itemData.when._syncId = data._id();
    }

    self.saveItem(itemData);
  };

  self.whenRemoveOffset = function(data)
  {
    self.whenSaveOffset(data._id());
  };

  self.whenCreateOffsetSubmit = function()
  {
    if (self.whenCreateOffsetName() === "")
    {
      self.editErrorText("Can not create offset without name!");
      return;
    }

    self.whenSaveOffset(null);
  };

  self.whenCreateOffsetAllowed = ko.computed(function()
  {
//     var value = true;
//
//     if (self.item() === false || !self.item().exif || !self.item().exif.DateTimeOriginal || !self.item().when || !self.item().when.source || self.item().when.source() !== 'gps' || self.item().with() === false)
//     {
//       value = false;
//     }
//     else
//     {
//       if (self.item().with().whenOffsets)
//       {
//         var offsetValue = self.item().when.timestamp() - murrix.parseExifCamera(self.item().exif.DateTimeOriginal());
//
//         for (var n = 0; n < self.item().with().whenOffsets().length; n++)
//         {
//           if (self.item().with().whenOffsets()[n]._id() === self.item()._id() ||
//               self.item().with().whenOffsets()[n].value() === offsetValue)
//           {
//             value = false;
//             break;
//           }
//         }
//       }
//     }
//
//     return value;
  });

  self.whenSaveOffset = function(removeId)
  {
    if (self.item() === false || self.item().with() === false)
    {
      self.editErrorText("Can not save with no item or with nodes!");
      return;
    }

    if (!removeId && !self.whenCreateOffsetAllowed())
    {
      self.editErrorText("Not allowed to create offsets with equal value, one is enough!");
      return;
    }

    var nodeData = ko.mapping.toJS(self.item().with());

    nodeData.whenOffsets = nodeData.whenOffsets || [];

    if (!removeId) // Add offset
    {
      var newOffset = {};
      newOffset._id = self.item()._id();
      newOffset.name = self.whenCreateOffsetName();
      newOffset.value = self.item().when.timestamp() - murrix.parseExifCamera(self.item().exif.DateTimeOriginal());

      nodeData.whenOffsets.push(newOffset);
    }
    else
    {
      nodeData.whenOffsets = nodeData.whenOffsets.filter(function(offset)
      {
        return offset._id !== removeId;
      });
    }

    self.editLoading(true);
    self.editErrorText("");

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      murrix.cache.addNodeData(nodeData);
    });
  };*/
};
