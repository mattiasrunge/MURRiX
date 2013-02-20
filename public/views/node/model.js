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

    parentModel.title("MURRiX - " + node.name());

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

      query.what = { $in : [ "file", "text" ] };
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
          query.what.$in.push("position");
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

    murrix.server.emit("find", { query: query, options: { collection: "nodes", limit: inst.options.items + 5 } }, function(error, nodeDataList)
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
      murrix.model.dialogModel.cameraNodeModel.showEdit(self.node()._id());
    }
    else if (self.node().type() === "vehicle")
    {
      murrix.model.dialogModel.vehicleNodeModel.showEdit(self.node()._id());
    }
    else if (self.node().type() === "person")
    {
      murrix.model.dialogModel.personNodeModel.showEdit(self.node()._id());
    }
    else if (self.node().type() === "album")
    {
      murrix.model.dialogModel.albumNodeModel.showEdit(self.node()._id());
    }
    else if (self.node().type() === "location")
    {
      murrix.model.dialogModel.locationNodeModel.showEdit(self.node()._id());
    }
  };


  /* Edit Camera */
  self.editCameraNewOpen = function()
  {
    murrix.model.dialogModel.cameraNodeModel.showCreate(function(node)
    {
      document.location.hash = murrix.createPath(0, "node", node._id());
    });
  };


  /* Edit Vehicle */
  self.editVehicleNewOpen = function()
  {
    murrix.model.dialogModel.vehicleNodeModel.showCreate(function(node)
    {
      document.location.hash = murrix.createPath(0, "node", node._id());
    });
  };


  /* Edit Person */
  self.editPersonNewOpen = function()
  {
    murrix.model.dialogModel.personNodeModel.showCreate(function(node)
    {
      document.location.hash = murrix.createPath(0, "node", node._id());
    });
  };


  /* Edit Album */
  self.editAlbumNewOpen = function()
  {
    murrix.model.dialogModel.albumNodeModel.showCreate(function(node)
    {
      document.location.hash = murrix.createPath(0, "node", node._id());
    });
  };


  /* Edit Location */
  self.editLocationNewOpen = function()
  {
    murrix.model.dialogModel.locationNodeModel.showCreate(function(node)
    {
      document.location.hash = murrix.createPath(0, "node", node._id());
    });
  };


  /* Remove Node */
  self.removeNode = function()
  {
    if (window.confirm("Are you sure you want to remove " + self.node().name() + "?"))
    {
      murrix.server.emit("removeNode", self.node()._id(), function(error)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        document.location.hash = "";
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
