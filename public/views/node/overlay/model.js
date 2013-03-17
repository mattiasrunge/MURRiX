
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

    if (self.item() && itemId === self.item()._id())
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
      self.whereInitialize();
      self.withInitialize();
      self.showingInitialize();
      self.description(self.item().description ? self.item().description() : "");

      self.videoFile('/video?id=' + self.item()._id());
    });
  });

  self.videoFile = ko.observable("");

  self.count = ko.observable(0);
  self.index = ko.observable(0);
  self.nextId = ko.observable(false);
  self.prevId = ko.observable(false);
  self.loading = ko.observable(false);

  self.item.subscribe(function(value)
  {
    self.loadItemEnvironment();
  });

  self.loadItemEnvironment = function()
  {
    if (self.item() !== false)
    {
      murrix.server.emit("helper_itemGetEnvironment", { nodeId: parentModel.node()._id(), itemId: self.item()._id() }, function(error, environment)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        self.count(environment.count);
        self.index(environment.index);
        self.nextId(environment.nextId);
        self.prevId(environment.prevId);
      });
    }
    else
    {
      self.count(0);
      self.index(0);
      self.nextId(false);
      self.prevId(false);
    }
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

    self.saveItem(itemData);
  };

  self.remove = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    self.editLoading(true);

    murrix.server.emit("removeItem", itemData._id, function(error)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      if (self.nextId() === itemData._id)
      {
        document.location.hash = murrix.createPath(1, null, '');
      }
      else
      {
        document.location.hash = murrix.createPath(1, null, self.nextId());
      }

      murrix.model.nodeModel.loadNode();
    });
  };

  self.hideRaw = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    self.editLoading(true);

    murrix.server.emit("hideRaw", itemData, function(error, hidden, newItemData)
    {
      self.editLoading(false);

      if (error)
      {
        self.editErrorText(error);
        return;
      }

      if (hidden)
      {
        var item = murrix.cache.addItemData(newItemData);

        document.location.hash = murrix.createPath(1, null, item._id());

        murrix.model.nodeModel.loadNode();
      }
      else
      {
        self.editErrorText("Could not hide file!");
      }
    });
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

    self.saveItem(itemData);
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

    self.saveItem(itemData);
  };

  self.mirror = function()
  {
    var itemData = ko.mapping.toJS(self.item);

    itemData.mirror = !itemData.mirror;

    self.saveItem(itemData);
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
  };

  self.editFinishClicked = function()
  {
    self.showingModel.selected(false);

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    self.editType("");
  };



  /****************************************************************************
   * Showing: Stuff for selecting what is shown on a file
   ***************************************************************************/
  self.showingModel = new DialogComponentNodeListModel(self);
  self.showingModel.selectLast(true);
  self.showingModel.types([ "person", "camera", "vehicle" ]);
  self.showingInitializing = false;
  self.showingLoading = ko.observable(false);

  self.showingInitialize = function()
  {
    self.showingInitializing = true;

    self.showingModel.reset();

    if (self.item() !== false)
    {
      self.showingModel.selectable(self.item().whatDetailed() === "imageFile");

      if (self.item().showing && self.item().showing() !== false)
      {
        for (var n = 0; n < self.item().showing().length; n++)
        {
          self.showingModel.value.push(self.item().showing()[n]._id());
        }
      }

      self.showingLoadSuggestions();
    }

    self.showingInitializing = false;
  }

  self.showingModel.value.subscribe(function(value)
  {
    if (!self.showingInitializing)
    {
      var itemData = ko.mapping.toJS(self.item);

      var showing = [];

      for (var n = 0; n < value.length; n++)
      {
        var show = { _id: value[n] };

        for (var i = 0; i < itemData.showing.length; i++)
        {
          if (itemData.showing[i]._id === show._id)
          {
            show = itemData.showing[i];
            break;
          }
        }

        showing.push(show);
      }

      self.item().showing = ko.mapping.fromJS(showing);

      itemData.showing = showing;

      self.saveItem(itemData, true);

      self.showingLoadSuggestions();
    }
  });

  self.showingLoadSuggestions = function()
  {
    var suggestions = [];

    if (self.item() !== false)
    {
      self.showingLoading(true);

      murrix.server.emit("helper_nodeGetShowing", { nodeId: parentModel.node()._id() }, function(error, list)
      {
        self.showingLoading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        var takenIds = [];

        if (self.item().showing)
        {
          for (var n = 0; n < self.item().showing().length; n++)
          {
            takenIds.push(self.item().showing()[n]._id());
          }
        }

        for (var n = 0; n < list.length; n++)
        {
          if (!murrix.inArray(list[n], takenIds))
          {
            suggestions.push(list[n]);
          }
        }

        self.showingModel.suggestions(suggestions);
      });

      return;
    }

    self.showingModel.suggestions(suggestions);
  };

  self.showingCurrent = ko.computed(function()
  {
    if (self.showingModel.selected() === false)
    {
      return false;
    }

    var itemData = ko.mapping.toJS(self.item.peek());

    for (var n = 0; n < itemData.showing.length; n++)
    {
      if (itemData.showing[n]._id === self.showingModel.selected())
      {
        return itemData.showing[n];
      }
    }

    return false;
  });

  self.showingSelectionEnd = function(img, selection)
  {
    var show = { _id: self.showingCurrent()._id };

    if (selection.width > 0 && selection.height > 0)
    {
      var pos_x = selection.x1 + (selection.width / 2);
      var pos_y = selection.y1 + (selection.height / 2);

      show.x = pos_x / $(".imgContainer").width();
      show.y = pos_y / $(".imgContainer").height();

      show.width = selection.width / $(".imgContainer").width();
      show.height = selection.height / $(".imgContainer").height();
    }

    for (var i = 0; i < self.item().showing().length; i++)
    {
      if (self.item().showing()[i]._id() === show._id)
      {
        if (self.item().showing()[i].x)
        {
          self.item().showing()[i].width(show.width);
          self.item().showing()[i].height(show.height);
          self.item().showing()[i].x(show.x);
          self.item().showing()[i].y(show.y);
        }
        else
        {
          self.item().showing()[i].width = ko.observable(show.width);
          self.item().showing()[i].height = ko.observable(show.height);
          self.item().showing()[i].x = ko.observable(show.x);
          self.item().showing()[i].y = ko.observable(show.y);
        }
        break;
      }
    }

    var itemData = ko.mapping.toJS(self.item);

    self.saveItem(itemData, true);
  };

  self.showingCurrent.subscribe(function(value)
  {
    $(".imgContainer").imgAreaSelect({ "remove" : true });

    if (value === false)
    {
      return;
    }

    var options = {
      minWidth      : 32,
      minHeight     : 32,
      instance      : true,
      movable       : true,
      resizable     : true,
      handles       : true,
      keys          : false,
      onSelectEnd   : function(img, selection) { self.showingSelectionEnd(img, selection); }
    };

    if (value.x)
    {
      options.show = true;

      options.x1 = $(".imgContainer").width() * (value.x - value.width / 2);
      options.x2 = $(".imgContainer").width() * (value.x + value.width / 2);

      options.y1 = $(".imgContainer").height() * (value.y - value.height / 2);
      options.y2 = $(".imgContainer").height() * (value.y + value.height / 2);
    }

    $(".imgContainer").imgAreaSelect(options);
  });

  self.showingCreatePerson = function()
  {
    murrix.model.dialogModel.personNodeModel.showCreate(function(node)
    {
      self.showingModel.value.push(node._id());

      if (self.showingModel.selectable() && self.showingModel.selectLast())
      {
        self.showingModel.selected(node._id());
      }
    });
  };

  self.showingCreateVehicle = function()
  {
    murrix.model.dialogModel.vehicleNodeModel.showCreate(function(node)
    {
      self.showingModel.value.push(node._id());

      if (self.showingModel.selectable() && self.showingModel.selectLast())
      {
        self.showingModel.selected(node._id());
      }
    });
  };

  self.showingCreateCamera = function()
  {
    murrix.model.dialogModel.cameraNodeModel.showCreate(function(node)
    {
      self.showingModel.value.push(node._id());

      if (self.showingModel.selectable() && self.showingModel.selectLast())
      {
        self.showingModel.selected(node._id());
      }
    });
  };

  self.showingItemOver = function(showingItem)
  {
    if (self.showingCurrent() !== false)
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

    if (self.showingCurrent() !== false)
    {
      return;
    }

    self.showingTimer = setTimeout(function() { self.showingUnmark(); }, 300);
  };

  self.showingUnmark = function()
  {
    if (self.showingCurrent() !== false)
    {
      return;
    }

    $(".imgContainer").imgAreaSelect({ "remove" : true });

    self.showingTimer = null;
  };






  /****************************************************************************
   * Who: Stuff for selecting who created this item
   ***************************************************************************/
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
      if (self.item()._who && self.item()._who() !== false)
      {
        self.whoModel.value.push(self.item()._who());
      }

      self.whoLoadSuggestions();
    }

    self.whoInitializing = false;
  }

  self.whoModel.value.subscribe(function(value)
  {
    if (!self.whoInitializing)
    {
      var itemData = ko.mapping.toJS(self.item);

      itemData._who = value.length === 0 ? false : value[0];

      self.saveItem(itemData);
    }
  });

  self.whoLoadSuggestions = function()
  {
    var list = [];
    var takenIds = [];
// TODO
//     if (self.item() !== false)
//     {
//       if (self.item()._who && self.item()._who() !== false)
//       {
//         takenIds.push(self.item()._who());
//       }
//
//       for (var n = 0; n < parentModel.items().length; n++)
//       {
//         if (parentModel.items()[n]._who && parentModel.items()[n]._who() !== false)
//         {
//           if (!murrix.inArray(parentModel.items()[n]._who(), takenIds))
//           {
//             list.push(parentModel.items()[n]._who());
//             takenIds.push(parentModel.items()[n]._who());
//           }
//         }
//       }
//
//       self.whoModel.suggestions(list);
//     }
  };
// TODO
//   parentModel.items.subscribe(function()
//   {
//     self.whoLoadSuggestions();
//   });

  self.whoCreatePerson = function()
  {
    murrix.model.dialogModel.personNodeModel.showCreate(function(node)
    {
      self.whoModel.value([ node._id() ]);
    });
  };





  /****************************************************************************
   * With: Stuff for selecting what device this item was created with
   ***************************************************************************/
  self.withModel = new DialogComponentNodeListModel(self);
  self.withModel.max(1);
  self.withModel.types([ "camera" ]);
  self.withInitializing = false;

  self.withInitialize = function()
  {
    self.withInitializing = true;

    self.withModel.reset();

    if (self.item() !== false)
    {
      if (self.item()._with && self.item()._with() !== false)
      {
        self.withModel.value.push(self.item()._with());
      }

      self.withLoadSuggestions();
    }

    self.withInitializing = false;
  }

  self.withModel.value.subscribe(function(value)
  {
    if (!self.withInitializing)
    {
      var itemData = ko.mapping.toJS(self.item);

      itemData._with = value.length === 0 ? false : value[0];

      self.saveItem(itemData);
    }
  });

  self.withLoadSuggestions = function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item()._with && self.item()._with() !== false)
      {
        takenIds.push(self.item()._with());
      }

      if (self.item().exif && (self.item().exif.Model || self.item().exif.SerialNumber))
      {
        var query = {};

        query.type = "camera";
        query.$or = [];

        if (self.item().exif.SerialNumber)
        {
          query.$or.push({ serial: self.item().exif.SerialNumber() });
        }

        if (self.item().exif.Model)
        {
          query.$or.push({ name: self.item().exif.Model() });
        }

        murrix.server.emit("find", { query: query, options: "nodes" }, function(error, nodeDataList)
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

          self.withModel.suggestions(list);
        });
      }
      else
      {// TODO
//         for (var n = 0; n < parentModel.items().length; n++)
//         {
//           if (parentModel.items()[n]._with && parentModel.items()[n]._with() !== false)
//           {
//             if (!murrix.inArray(parentModel.items()[n]._with(), takenIds))
//             {console.log(parentModel.items()[n]._with());
//               list.push(parentModel.items()[n]._with());
//               takenIds.push(parentModel.items()[n]._with());
//             }
//           }
//         }
      }

      self.withModel.suggestions(list);
    }
  };
// TODO
//   parentModel.items.subscribe(function()
//   {
//     self.withLoadSuggestions();
//   });

  self.withCreateFromExif = function()
  {
    murrix.model.dialogModel.cameraNodeModel.showCreate(function(node)
    {
      self.withModel.value([ node._id() ]);
    });

    if (self.item().exif && self.item().exif.Model)
    {
      murrix.model.dialogModel.cameraNodeModel.name(self.item().exif.Model());
    }

    if (self.item().exif && self.item().exif.SerialNumber)
    {
      murrix.model.dialogModel.cameraNodeModel.serial(self.item().exif.SerialNumber());
    }
  };















  /****************************************************************************
   * Where: Stuff for selecting where this item was created
   ***************************************************************************/
  self.where = {};
  self.where.visible = ko.computed(function()
  {
    return self.editType() == "where";
  });

  self.whereHideLocation = ko.observable(false);
  self.whereHidePosition = ko.observable(false);

  self.wherePositionModel = new DialogComponentPositionModel(self.where);
  self.wherePositionModel.value.subscribe(function(value)
  {
    if (value.latitude === false)
    {
      self.whereHideLocation(false);
    }
    else
    {
      self.whereHideLocation(true);
      self.whereLocationModel.reset();
    }

    self.whereSave();
  });

  self.whereLocationModel = new DialogComponentNodeListModel(self);
  self.whereLocationModel.types([ "location" ]);
  self.whereLocationModel.max(1);
  self.whereLocationModel.value.subscribe(function(value)
  {
    if (value.length === 0)
    {
      self.whereHidePosition(false);
    }
    else
    {
      self.whereHidePosition(true);
      self.wherePositionModel.reset();
    }

    self.whereSave();
  });


  self.whereInitializing = false;

  self.whereInitialize = function()
  {
    self.whereInitializing = true;

    self.whereLocationModel.reset();
    self.wherePositionModel.reset();

    if (self.item() !== false)
    {
      if (self.item().where && self.item().where !== false)
      {
        if (self.item().where._id && self.item().where._id() !== false)
        {
          self.whereLocationModel.value.push(self.item().where._id());
        }
        else if (self.item().where.latitude && self.item().where.latitude() !== false)
        {
          self.wherePositionModel.value(ko.mapping.toJS(self.item().where));
        }
      }

      self.whereLoadSuggestions();
    }

    self.whereInitializing = false;
  };

  self.whereSave = function()
  {
    if (self.whereInitializing)
    {
      return;
    }

    var itemData = ko.mapping.toJS(self.item);

    itemData.where = { latitude: self.wherePositionModel.value().latitude, longitude: self.wherePositionModel.value().longitude, _id: false, source: self.wherePositionModel.value().latitude !== false ? "manual" : false };

    if (self.wherePositionModel.value().source)
    {
      itemData.where.source = self.wherePositionModel.value().source;
    }

    if (self.whereLocationModel.value().length > 0)
    {
      itemData.where._id = self.whereLocationModel.value()[0];
    }

    self.saveItem(itemData);
  };

  self.whereLoadSuggestions = function()
  {
    var list = [];
    var takenIds = [];

    if (self.item() !== false)
    {
      if (self.item().where && self.item().where._id && self.item().where._id() !== false)
      {
        takenIds.push(self.item().where._id());
      }
// TODO
//       for (var n = 0; n < parentModel.items().length; n++)
//       {
//         if (!parentModel.items()[n].where || !parentModel.items()[n].where._id || parentModel.items()[n].where._id() === false)
//         {
//           continue;
//         }
//
//         if (!murrix.inArray(parentModel.items()[n].where._id(), takenIds))
//         {
//           list.push(parentModel.items()[n].where._id());
//           takenIds.push(parentModel.items()[n].where._id());
//         }
//       }

      self.whereLocationModel.suggestions(list);
    }
  };
// TODO
//   parentModel.items.subscribe(function()
//   {
//     self.whereLoadSuggestions();
//   });

  self.whereFileSet = function()
  {
    self.wherePositionModel.value({ latitude: self.item().exif.GPSLatitude(), longitude: self.item().exif.GPSLongitude(), source: "gps" });
  };

  self.whereCreateLocation = function()
  {
    murrix.model.dialogModel.locationNodeModel.showCreate(function(node)
    {
      self.whereLocationModel.value([ node._id() ]);
    });
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
        self.showingInitialize();
      }

      self.whereInitialize();
      self.whoInitialize();
      self.withInitialize();
      parentModel.loadNode();

      if (callback)
      {
        callback();
      }
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

    var nodeData = ko.mapping.toJS(self.item()._with);

    var reference = {};

    reference._id = self.item()._id();
    reference.type = "utc";
    reference.offset = self.item().when.timestamp() - self.whenCreateExifCameraTimestamp();
    reference.name = "(UTC " + reference.offset + "s) from " + self.item().name();
    console.log(reference);

    nodeData.referenceTimelines = nodeData.referenceTimelines || [];
    nodeData.referenceTimelines.push(reference);

    self.editLoading(true);

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
  };

  self.whenRemoveReference = function()
  {
    self.editLoading(false);
    self.editErrorText("");

    var nodeData = ko.mapping.toJS(self.item()._with);

    nodeData.referenceTimelines = nodeData.referenceTimelines || [];

    nodeData.referenceTimelines = nodeData.referenceTimelines.filter(function(element)
    {
      return element._id !== self.whenReferenceSelf()._id();
    });


    self.editLoading(true);

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
      //console.log(source.reference);
      self.whenReference(source.reference === false ? "X" : source.reference);
      //console.log(self.whenReference());
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

};
