var NodeModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "node"))
    {
      self.show(value.action === "node");
    }
  });


  self.node = ko.observable(false);
  self.items = ko.observableArray();
  self.itemsLoading = ko.observable(false);

  self.firstDatetime = false;
  self.lastDatetime = false;

  /* This function is called every time the node changes and tries to
   * set up variables for required sub nodes and also try to fetch
   * the nodes to make sure the get cached.
   */
  self.node.subscribe(function(node)
  {
    var requiredNodeIdList = [];

    console.log("NodeModel: Clearing items");
    self.items.removeAll();

    if (!node)
    {
      console.log("NodeModel: Node is false, do nothing more!");
      return;
    }

    self.loadItems(function(error)
    {
      if (error)
      {
        console.log(error);
        return;
      }
    });
  });

  self.loadItems = function(callback)
  {
    self.items.removeAll();

    if (self.node())
    {
      var query = { $or: [] };

      query.what = { $in : ["file", "text" ] };
      query.$or.push({ _parents: self.node()._id()});


      switch (self.node().type())
      {
        case "album":
        {
          break;
        }
        case "person":
        {
          query.$or.push({ "showing._id": self.node()._id()});
          break;
        }
        case "location":
        {
          query.$or.push({ "showing._id": self.node()._id()});
          query.$or.push({ "where._id": self.node()._id()});
          // TODO: Search on coordinates
          break;
        }
        case "camera":
        {
          query.$or.push({ "showing._id": self.node()._id()});
          query.$or.push({ "_with": self.node()._id()});
          break;
        }
        case "vehicle":
        {
          query.$or.push({ "showing._id": self.node()._id()});
          break;
        }
      };

      self.itemsLoading(true);

      murrix.server.emit("find", { query: query, options: "items" }, function(error, itemDataList)
      {
        self.itemsLoading(false);

        if (error)
        {
          console.log(error);
          console.log("NodeModel: Failed to get items!");
          callback(error);
          return;
        }

        var count = 0;
        var itemList = [];

        for (var id in itemDataList)
        {
          itemList.push(murrix.cache.addItemData(itemDataList[id]));
          count++;
        }

        itemList.sort(murrix.compareItemFunction);

//         for (var n = 0; n < itemList.length; n++)
//         {
//           console.log(n, itemList[n].whenTimestamp(), itemList[n].name());
//         }

        self.items(itemList);

        console.log("NodeModel: Found " + count + " items!");

        callback(null);
      });

      return;
    }

    callback(null);
  };

  self.files = ko.computed(function()
  {
    var results = [];

    for (var n = 0; n < self.items().length; n++)
    {
      var item = self.items()[n];

      if (item.what() === "file")
      {
        results.push(item);
      }
    }

    results.sort(murrix.compareItemFunction);

    return results;
  });

  self.logItems = ko.computed(function()
  {
    var results = {};

    for (var n = 0; n < self.items().length; n++)
    {
      var item = self.items()[n];

      var datestamp = false;

      if (item.whenTimestamp() === false)
      {
        datestamp = "Missing date information";
      }
      else
      {
        datestamp = Math.floor(item.whenTimestamp() / 86400) * 86400;
      }

      if (!results[datestamp])
      {
        results[datestamp] = {};
        results[datestamp].datestamp = datestamp;
        results[datestamp]["texts"] = [];
        results[datestamp]["media"] = [];
        results[datestamp]["audio"] = [];
      }

      if (item.whatDetailed() === "audioFile")
      {
        results[datestamp]["audio"].push(item);
      }
      if (item.whatDetailed() === "imageFile" || item.whatDetailed() === "videoFile")
      {
        results[datestamp]["media"].push(item);
      }
      else if (item.whatDetailed() === "text")
      {
        results[datestamp]["texts"].push(item);
      }
    }

    var list = [];

    for (var datestamp in results)
    {
      var item = {};

      item.datestamp = results[datestamp].datestamp;
      item.texts = results[datestamp].texts;
      item.media = results[datestamp].media;
      item.audio = results[datestamp].audio;

      list.push(item);
    }

    list.sort(function(a, b)
    {
      if (typeof b.datestamp === 'string' || typeof a.datestamp === 'string')
      {
        return 0;
      }

      var offset = 0;

      if (a.datestamp < 0 || b.datestamp < 0)
      {
        offset = Math.abs(Math.min(a.datestamp, b.datestamp));
      }

      return (a.datestamp + offset) - (b.datestamp + offset);
    });

//     for (var n = 0; n < list.length; n++)
//     {
//       console.log(list[n].datestamp);
//     }

    return list;
  });

  self.nodeTypeaheadSource = function(query, callback)
  {
    var inst = this;
    var query = { name: { $regex: ".*" + query + ".*", $options: "-i" } };

    if (inst.options.nodeTypes)
    {
      query.type = { $in: inst.options.nodeTypes };
    }

    murrix.server.emit("find", { query: query, options: { collection: "nodes", limit: inst.options.limit + 5 } }, function(error, nodeDataList)
    {
      if (error)
      {
        console.log(error);
        callback([]);
      }

      var resultList = [];

      for (var key in nodeDataList)
      {
        var item = murrix.cache.addNodeData(nodeDataList[key]);

        item.toString = function() { return this._id(); };

        if (!inst.options.nodeFilter || inst.options.nodeFilter(item))
        {
          resultList.push(item);
        }
      }

      callback(resultList);
    });
  };

  self.nodeTypeaheadMatcher = function(item)
  {
    return ~item.name().toLowerCase().indexOf(this.query.toLowerCase());
  };

  self.nodeTypeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    var name = item.name().replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>"
    });

    var imgUrl = "http://placekitten.com/g/32/32";

    if (item._profilePicture && item._profilePicture() !== false)
    {
      imgUrl = "/preview?id=" + item._profilePicture() + "&width=32&height=32&square=1";
    }

    return "<img style='margin-right: 20px;' class='pull-left' src='" + imgUrl + "'/><span style='padding: 6px; display: block; width: 250px;'>" + name + "</span>";
  };

  /* This function is run when the primary path is changed
   * and a new node id has been set. It tries to cache
   * the node and set the primary node id observable.
   */
  parentModel.path().primary.subscribe(function(value)
  {
    self.loadNode();
  });

  parentModel.currentUser.subscribe(function(value)
  {
    self.node(false);
    self.loadNode();
  });

  self.loadingNode = ko.observable(false);

  self.loadNode = function()
  {
    if (parentModel.path().primary().args.length === 0)
    {
      console.log("NodeModel: No node id specified setting node to false!");
      self.node(false);
      self.loadingNode(false);
      return;
    }

    var nodeId = parentModel.path().primary().args[0];

    console.log("NodeModel: Got nodeId = " + nodeId);

    /* Zero is not a valid id */
    if (parentModel.path().primary().action !== "node")
    {
      console.log("NodeModel: Node not shown, setting node to false");
      self.node(false);
      self.loadingNode(false);
      return;
    }
    else if (self.node() && nodeId === self.node()._id())
    {
      console.log("NodeModel: Node id is the same as before, will not update!");
      self.loadingNode(false);
      return;
    }

    self.loadingNode(true);
    murrix.cache.clearItems();

    murrix.cache.getNode(nodeId, function(error, node)
    {
      if (error)
      {
        console.log(error);
        console.log("NodeModel: Failed to find node!");
        self.node(false);
        self.loadingNode(false);
        return;
      }

      self.node(node);
      self.loadingNode(false);
    });
  };


  self.editNode = function()
  {
    if (self.node() === false)
    {
      return;
    }

    if (self.node().type() === "camera")
    {
      self.editCameraNode(self.node());
      self.editCameraGoto = function() { };
      self.editCameraName(self.node().name());
      self.editCameraDescription(self.node().description());
      self.editCameraMode(self.node().mode ? self.node().mode() : "manual");
      self.editCameraOwner(self.node()._owner());

      self.editCameraTimezone("Unknown");

      if (self.node().referenceTimelines)
      {
        for (var n = 0; n < self.node().referenceTimelines().length; n++)
        {
          if (self.node().referenceTimelines()[n].type() === "timezone")
          {
            self.editCameraTimezone(self.node().referenceTimelines()[n].name());
            break;
          }
        }
      }

      $("#editCameraModal").modal('show');
    }
    else if (self.node().type() === "vehicle")
    {
      self.editVehicleNode(self.node());
      self.editVehicleGoto = function() { };
      self.editVehicleName(self.node().name());
      self.editVehicleDescription(self.node().description());
      self.editVehicleOwner(self.node()._owner());

      $("#editVehicleModal").modal('show');
    }
    else if (self.node().type() === "person")
    {
      self.editPersonNode(self.node());
      self.editPersonGoto = function() { };
      self.editPersonName(self.node().name());
      self.editPersonBirthname(self.node().birthname());
      self.editPersonDescription(self.node().description());
      self.editPersonGender(self.node().gender());

      $("#editPersonModal").modal('show');
    }
    else if (self.node().type() === "album")
    {
      self.editAlbumNode(self.node());
      self.editAlbumGoto = function() { };
      self.editAlbumName(self.node().name());
      self.editAlbumDescription(self.node().description());

      $("#editAlbumModal").modal('show');
    }
  };


  /* Edit Camera */
  self.editCameraGoto = false;
  self.editCameraNode = ko.observable(false);
  self.editCameraName = ko.observable("");
  self.editCameraDescription = ko.observable("");
  self.editCameraMode = ko.observable("manual");
  self.editCameraTimezone = ko.observable("(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna");
  self.editCameraOwner = ko.observable(false);
  self.editCameraLoading = ko.observable(false);
  self.editCameraErrorText = ko.observable("");

  self.editCameraNewOpen = function()
  {
    self.editCameraOpen();
  };

  self.editCameraOpen = function(callback, name)
  {
    self.editCameraGoto = false;
    self.editCameraNode(false);
    self.editCameraName("");
    self.editCameraMode("manual");
    self.editCameraTimezone("(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna");
    self.editCameraDescription("");
    self.editCameraOwner(false);

    if (name)
    {
      self.editCameraName(name);
    }

    if (callback)
    {
      self.editCameraGoto = callback;
    }

    $("#editCameraModal").modal('show');
  };

  self.editCameraComplete = function(node)
  {
    document.location.hash = murrix.createPath(0, "node", node._id());

    $("#createNodeDoneModal").modal('show');
  };

  self.editCameraClearOwner = function()
  {
    self.editCameraOwner(false);
  };

  self.editCameraSubmit = function()
  {
    self.editCameraErrorText("");

    if (self.editCameraName() === "")
    {
      self.editCameraErrorText("Name is empty!");
      return;
    }

    var nodeData = {};

    if (self.editCameraNode() !== false)
    {
      nodeData = ko.mapping.toJS(self.editCameraNode());
    }

    nodeData.type = "camera";
    nodeData.name = self.editCameraName();
    nodeData.description = self.editCameraDescription();
    nodeData.mode = self.editCameraMode();
    nodeData._owner = self.editCameraOwner();

    nodeData.referenceTimelines = nodeData.referenceTimelines || [];

    nodeData.referenceTimelines = nodeData.referenceTimelines.filter(function(element)
    {
      return (element.type !== "timezone")
    });


    if (self.editCameraTimezone() !== "Unknown")
    {
      var reference = {};

      reference._id = "defaultTimezone";
      reference.type = "timezone";
      reference.offset = -murrix.timezoneStringToOffset(self.editCameraTimezone());
      reference.name = self.editCameraTimezone();

      nodeData.referenceTimelines.push(reference);
    }


    self.editCameraLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.editCameraLoading(false);

      if (error)
      {
        console.log(error);
        self.editCameraErrorText(error);
        return;
      }

      var node = murrix.cache.addNodeData(nodeData);

      $(".modal").modal('hide');

      if (!self.editCameraGoto)
      {
        self.editCameraComplete(node);
      }
      else
      {
        self.editCameraGoto(node);
      }

      self.editCameraGoto = false;
      self.editCameraNode(false);
      self.editCameraName("");
      self.editCameraMode("manual");
      self.editCameraTimezone("(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna");
      self.editCameraDescription("");
      self.editCameraOwner(false);
    });
  };

  self.editCameraTypeaheadUpdater = function(key)
  {
    self.editCameraOwner(key);
  };

  self.editCameraTypeaheadNodeFilter = function(item)
  {
    return self.editCameraOwner() !== item._id();
  };



  /* Edit Vehicle */
  self.editVehicleGoto = false;
  self.editVehicleNode = ko.observable(false);
  self.editVehicleName = ko.observable("");
  self.editVehicleDescription = ko.observable("");
  self.editVehicleOwner = ko.observable(false);
  self.editVehicleLoading = ko.observable(false);
  self.editVehicleErrorText = ko.observable("");

  self.editVehicleNewOpen = function()
  {
    self.editVehicleOpen();
  };

  self.editVehicleOpen = function(callback)
  {
    self.editVehicleGoto = false;
    self.editVehicleNode(false);
    self.editVehicleName("");
    self.editVehicleDescription("");
    self.editVehicleOwner(false);

    if (callback)
    {
      self.editVehicleGoto = callback;
    }

    $("#editVehicleModal").modal('show');
  };

  self.editVehicleComplete = function(node)
  {
    document.location.hash = murrix.createPath(0, "node", node._id());

    $("#createNodeDoneModal").modal('show');
  };

  self.editVehicleClearOwner = function()
  {
    self.editVehicleOwner(false);
  };

  self.editVehicleSubmit = function()
  {
    self.editVehicleErrorText("");

    if (self.editVehicleName() === "")
    {
      self.editVehicleErrorText("Name is empty!");
      return;
    }

    var nodeData = {};

    if (self.editVehicleNode() !== false)
    {
      nodeData = ko.mapping.toJS(self.editVehicleNode());
    }

    nodeData.type = "vehicle";
    nodeData.name = self.editVehicleName();
    nodeData.description = self.editVehicleDescription();
    nodeData._owner = self.editVehicleOwner();

    self.editVehicleLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.editVehicleLoading(false);

      if (error)
      {
        console.log(error);
        self.editVehicleErrorText(error);
        return;
      }

      var node = murrix.cache.addNodeData(nodeData);

      $(".modal").modal('hide');

      if (!self.editVehicleGoto)
      {
        self.editVehicleComplete(node);
      }
      else
      {
        self.editVehicleGoto(node);
      }

      self.editVehicleGoto = false;
      self.editVehicleNode(false);
      self.editVehicleName("");
      self.editVehicleDescription("");
      self.editVehicleOwner(false);
    });
  };

  self.editVehicleTypeaheadUpdater = function(key)
  {
    self.editVehicleOwner(key);
  };

  self.editVehicleTypeaheadNodeFilter = function(item)
  {
    return self.editVehicleOwner() !== item._id();
  };



  /* Edit Person */
  self.editPersonGoto = false;
  self.editPersonNode = ko.observable(false);
  self.editPersonName = ko.observable("");
  self.editPersonBirthname = ko.observable("");
  self.editPersonDescription = ko.observable("");
  self.editPersonGender = ko.observable("male");
  self.editPersonLoading = ko.observable(false);
  self.editPersonErrorText = ko.observable("");

  self.editPersonNewOpen = function()
  {
    self.editPersonOpen();
  };

  self.editPersonOpen = function(callback)
  {
    self.editPersonGoto = false;
    self.editPersonNode(false);
    self.editPersonName("");
    self.editPersonBirthname("");
    self.editPersonDescription("");
    self.editPersonGender("male");

    if (callback)
    {
      self.editPersonGoto = callback;
    }

    $("#editPersonModal").modal('show');
  };

  self.editPersonComplete = function(node)
  {
    document.location.hash = murrix.createPath(0, "node", node._id());

    $("#createNodeDoneModal").modal('show');
  };

  self.editPersonMaleClicked = function()
  {
    self.editPersonGender("male");
  };

  self.editPersonFemaleClicked = function()
  {
    self.editPersonGender("female");
  };

  self.editPersonSubmit = function()
  {
    self.editPersonErrorText("");

    if (self.editPersonName() === "")
    {
      self.editPersonErrorText("Name is empty!");
      return;
    }

    var nodeData = {};

    if (self.editPersonNode() !== false)
    {
      nodeData = ko.mapping.toJS(self.editPersonNode());
    }

    nodeData.type = "person";
    nodeData.name = self.editPersonName();
    nodeData.birthname = self.editPersonBirthname();
    nodeData.description = self.editPersonDescription();
    nodeData.gender = self.editPersonGender();

    self.editPersonLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.editPersonLoading(false);

      if (error)
      {
        console.log(error);
        self.editPersonErrorText(error);
        return;
      }

      var node = murrix.cache.addNodeData(nodeData);

      $(".modal").modal('hide');

      if (!self.editPersonGoto)
      {
        self.editPersonComplete(node);
      }
      else
      {
        self.editPersonGoto(node);
      }

      self.editPersonGoto = false;
      self.editPersonNode(false);
      self.editPersonName("");
      self.editPersonBirthname("");
      self.editPersonDescription("");
      self.editPersonGender("male");
    });
  };



  /* Edit Album */
  self.editAlbumGoto = false;
  self.editAlbumNode = ko.observable(false);
  self.editAlbumName = ko.observable("");
  self.editAlbumDescription = ko.observable("");
  self.editAlbumLoading = ko.observable(false);
  self.editAlbumErrorText = ko.observable("");

  self.editAlbumNewOpen = function()
  {
    self.editAlbumOpen();
  };

  self.editAlbumOpen = function(callback)
  {
    self.editAlbumGoto = false;
    self.editAlbumNode(false);
    self.editAlbumName("");
    self.editAlbumDescription("");

    if (callback)
    {
      self.editAlbumGoto = callback;
    }

    $("#editAlbumModal").modal('show');
  };

  self.editAlbumComplete = function(node)
  {
    document.location.hash = murrix.createPath(0, "node", node._id());

    $("#createNodeDoneModal").modal('show');
  };

  self.editAlbumSubmit = function()
  {
    self.editAlbumErrorText("");

    if (self.editAlbumName() === "")
    {
      self.editAlbumErrorText("Name is empty!");
      return;
    }

    var nodeData = {};

    if (self.editAlbumNode() !== false)
    {
      nodeData = ko.mapping.toJS(self.editAlbumNode());
    }

    nodeData.type = "album";
    nodeData.name = self.editAlbumName();
    nodeData.description = self.editAlbumDescription();

    self.editAlbumLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.editAlbumLoading(false);

      if (error)
      {
        console.log(error);
        self.editAlbumErrorText(error);
        return;
      }

      var node = murrix.cache.addNodeData(nodeData);

      $(".modal").modal('hide');

      if (!self.editAlbumGoto)
      {
        self.editAlbumComplete(node);
      }
      else
      {
        self.editAlbumGoto(node);
      }

      self.editAlbumGoto = false;
      self.editAlbumNode(false);
      self.editAlbumName("");
      self.editAlbumDescription("");
    });
  };



  /* Creating */
  self.createLoading = ko.observable(false);
  self.createErrorText = ko.observable("");

  self.createSubmit = function(form)
  {
    var nodeData = murrix.getFormData(form);

    self.createErrorText("");

    if (nodeData.name === "")
    {
      self.createErrorText("Name is empty!");
    }
    else
    {
      self.createLoading(true);

      murrix.server.emit("saveNode", nodeData, function(error, nodeData)
      {
        self.createLoading(false);

        if (error)
        {
          console.log(error);
          self.createErrorText(error);
          return;
        }

        var node = murrix.cache.addNodeData(nodeData);

        $(".modal").modal('hide');

        document.location.hash = murrix.createPath(0, "node", node._id());

        $("#createNodeDoneModal").modal('show');
      });
    }
  };


  /* Accesses */
  self.groupAccessLoading = ko.observable(false);
  self.groupAccessErrorText = ko.observable("");
  self.groupAccessName = ko.observable("");

  self.groupAccessSaveNode = function(nodeData)
  {
    self.groupAccessLoading(true);
    self.groupAccessErrorText("");

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.groupAccessLoading(false);

      if (error)
      {
        self.groupAccessErrorText(error);
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.groupAccessRemove = function()
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(this.toString(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);
  };

  self.groupAccessMakeAdmin = function()
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.addToArray(this.toString(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);
  };

  self.groupAccessMakeReader = function()
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.addToArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(this.toString(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);
  };

  self.groupAccessTypeaheadSource = function(query, callback)
  {
    murrix.server.emit("findGroups", { query: { name: { $regex: ".*" + query + ".*", $options: "-i" } }, options: { limit: 20 } }, function(error, groupDataList)
    {
      if (error)
      {
        console.log(error);
        callback([]);
      }

      var resultList = [];

      for (var key in groupDataList)
      {
        var item = murrix.cache.addGroupData(groupDataList[key]);

        item.toString = function() { return this._id(); };

        if (!murrix.inArray(item._id(), self.node()._readers()) && !murrix.inArray(item._id(), self.node()._admins()))
        {
          resultList.push(item);
        }
      }

      callback(resultList);
    });
  };

  self.groupAccessTypeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    return item.name().replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>"
    });
  };

  self.groupAccessTypeaheadUpdater = function(key)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];

    if (murrix.inArray(key, nodeData._readers))
    {
      self.groupAccessErrorText("Group is already in readers!");
      return;
    }

    nodeData._readers = murrix.addToArray(key, nodeData._readers);
    self.groupAccessSaveNode(nodeData);
  };





  self.tagLoading = ko.observable(false);
  self.tagErrorText = ko.observable("");
  self.tagName = ko.observable("");
  self.tagHasFocus = ko.observable(true);

  self.tagSaveNode = function(nodeData)
  {
    self.tagErrorText("");
    self.tagLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      self.tagName("");
      self.tagErrorText("");
      self.tagHasFocus(true);

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.tagSubmit = function()
  {
    self.tagErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    nodeData.tags = nodeData.tags || [];

    if (murrix.inArray(self.tagName(), nodeData.tags))
    {
      self.tagErrorText("Can not save multiple tags with the same name");
      return;
    }

    nodeData.tags.push(self.tagName().toLowerCase().replace(/ /g, "_"));

    self.tagSaveNode(nodeData);
  };

  self.tagRemove = function(tagName)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData.tags = nodeData.tags || [];

    nodeData.tags = nodeData.tags.filter(function(tagNameTest)
    {
      return tagNameTest !== tagName;
    });

    self.tagSaveNode(nodeData);
  };

  self.tagTypeaheadSource = function(query, callback)
  {
    murrix.server.emit("distinct", { query: "tags", options: "nodes" }, function(error, tagList)
    {
      if (error)
      {
        console.log(error);
        callback([]);
        return;
      }

      if (self.node().tags)
      {
        tagList = tagList.filter(function(tagNameTest)
        {
          return !murrix.inArray(tagNameTest, self.node().tags());
        });
      }

      callback(tagList);
    });
  };

  self.tagTypeaheadUpdater= function(item)
  {
    self.tagName(item);
    self.tagSubmit();
  };



  self.dragStart = function(element, event)
  {//console.log("dragStart");
    self.showDrop(true);
/*    console.log(event.originalEvent.dataTransfer.getData("URL"));
    console.log(event.originalEvent.dataTransfer.getData("DownloadURL"));
    console.log(event.originalEvent.dataTransfer.getData("text/plain"));
    console.log(event.originalEvent.dataTransfer.getData("text/uri-list"));

    console.log(event.originalEvent.dataTransfer.setData("DownloadURL", "/preview?id=" + element._id() + "&width=1024&height=1024"));
    console.log("dragStart", "application/octet-stream:" + element.name() + ":/preview?id=" + element._id() + "&width=1024&height=1024");
*/
    event.originalEvent.dataTransfer.setData("id", element._id());
    return true;
  };

  self.dragEnd = function(element, event)
  {//console.log("dragEnd");
    self.showDrop(false);
  };

  self.dragDrop = function(element, event)
  {//console.log("dragDrop");
    self.showDrop(false);

    if (event.originalEvent.dataTransfer.getData("id") === "")
    {
      return;
    }

    var nodeData = ko.mapping.toJS(self.node);

    nodeData._profilePicture = event.originalEvent.dataTransfer.getData("id");
console.log(nodeData);
    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.showDrop = ko.observable(false);

  self.dragEnter = function(element, event)
  {
    //console.log("dragEnter");
    self.showDrop(true);
    return true;
  };

  self.dragLeave = function(element, event)
  {
    //console.log("dragLeave");
    self.showDrop(false);
    return true;
  };

  self.dragOver = function(element, event)
  {
    //console.log("dragOver");
  };

  self.publicLoading = ko.observable(false);

  self.changePublic = function(publicFlag, a, b, c, d)
  {
    self.publicLoading(true);

    var nodeData = ko.mapping.toJS(self.node);

    if (publicFlag)
    {
      nodeData.public = true;
    }
    else
    {
      nodeData.public = false;
    }

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.publicLoading(false);

      if (error)
      {
        console.log(error);
        alert("Could not make node " + (publicFlag ? "public" : "private") + "!");
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };


  /* Define all sub views */
  self.filesModel = new FilesModel(self);
  self.aboutModel = new AboutModel(self);
  self.relationsModel = new RelationsModel(self);
  self.commentsModel = new CommentsModel(self);
  self.overlayModel = new OverlayModel(self);
  self.timelineModel = new TimelineModel(self);
  self.issuesModel = new IssuesModel(self);
};
