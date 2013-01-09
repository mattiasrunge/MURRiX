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



  /* Create Camera */
  self.editCameraGoto = false;
  self.editCameraNode = ko.observable(false);
  self.editCameraName = ko.observable("");
  self.editCameraDescription = ko.observable("");
  self.editCameraOwner = ko.observable("");
  self.editCameraLoading = ko.observable(false);
  self.editCameraErrorText = ko.observable("");

  self.editCameraNewOpen = function()
  {
    self.editCameraOpen();
  };

  self.editCameraOpen = function(name, callback)
  {
    self.editCameraGoto = false;
    self.editCameraNode(false);
    self.editCameraName("");
    self.editCameraDescription("");
    self.editCameraOwner("");

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
    nodeData._owner = self.editCameraOwner();

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
      self.editCameraDescription("");
      self.editCameraOwner("");
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

  self.groupAccessLoading = ko.observable(false);
  self.groupAccessErrorText = ko.observable("");
  self.groupAccessName = ko.observable("");

  self.groupAccessSubmit = function()
  {
    // Do nothing
  };

  self.groupAccessRemove = function()
  {
    self.groupAccessLoading(true);
    self.groupAccessErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(this.toString(), nodeData._admins);

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

  self.groupAccessMakeAdmin = function()
  {
    self.groupAccessLoading(true);
    self.groupAccessErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.addToArray(this.toString(), nodeData._admins);

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

  self.groupAccessMakeReader = function()
  {
    self.groupAccessLoading(true);
    self.groupAccessErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.addToArray(this.toString(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(this.toString(), nodeData._admins);

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

  $("#groupAccessInput").typesearch({
    limit: 20,
    source: function(query, callback)
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
          var item = {};
          item.name = groupDataList[key].name;
          item.key = groupDataList[key]._id;
          item.html = "<li><a class='typesearch-name' href='#'></a></li>";

          if (!murrix.inArray(item.key, self.node()._readers()) && !murrix.inArray(item.key, self.node()._admins()))
          {
            resultList.push(item);
          }

          murrix.cache.addGroupData(groupDataList[key]);
        }

        callback(resultList);
      });
    },
    selectFn: function(key)
    {
      self.groupAccessLoading(true);
      self.groupAccessErrorText("");

      var nodeData = ko.mapping.toJS(self.node);

      nodeData._readers = nodeData._readers || [];

      if (murrix.inArray(key, nodeData._readers))
      {
        self.groupAccessLoading(false);
        self.groupAccessErrorText("Group is already in readers");
        return;
      }

      nodeData._readers = murrix.addToArray(key, nodeData._readers);

      murrix.server.emit("saveNode", nodeData, function(error, nodeData)
      {
        self.groupAccessLoading(false);

        if (error)
        {
          self.groupAccessErrorText(error);
          return;
        }

        self.groupAccessName("");

        murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
      });
    }
  });

  self.tagLoading = ko.observable(false);
  self.tagErrorText = ko.observable("");
  self.tagName = ko.observable("");

  self.tagSubmit = function()
  {
    self.tagLoading(true);
    self.tagErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    if (!nodeData.tags)
    {
      nodeData.tags = [];
    }

    if (murrix.inArray(self.tagName(), nodeData.tags))
    {
      self.tagLoading(false);
      self.tagErrorText("Can not save multiple tags with the same name");
      return;
    }

    nodeData.tags.push(self.tagName());

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      self.tagName("");

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.tagRemove = function(tagNode)
  {
    self.tagLoading(true);
    self.tagErrorText("");

    var nodeData = ko.mapping.toJS(self.node);

    if (!nodeData.tags)
    {
      nodeData.tags = [];
    }

    var tags = [];

    for (var n = 0; n < nodeData.tags.length; n++)
    {
      if (nodeData.tags[n] !== tagNode)
      {
        tags.push(nodeData.tags[n]);
      }
    }

    nodeData.tags = tags;

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.tagAutocomplete = function(query, callback)
  {
    murrix.server.emit("distinct", { query: "tags", options: "nodes" }, function(error, tagList)
    {
      if (error)
      {
        console.log(error);
        console.log("Failed to find tags!");
        callback([]);
        return;
      }

      if (self.node().tags)
      {
        var resultList = [];

        for (var n = 0; n < tagList.length; n++)
        {
          if (!murrix.inArray(tagList[n], self.node().tags()))
          {
            resultList.push(tagList[n]);
          }
        }

        callback(resultList);
      }
      else
      {
        callback(tagList);
      }
    });
  };

  $("[name=newTag]").typeahead({ source: function(query, callback) { self.tagAutocomplete(query, callback); } });


  $(".modal").on('hidden', function ()
  {
    self.createLoading(false);
    self.createErrorText("");

    self.tagLoading(false);
    self.tagErrorText("");
    self.tagName("");
  });

  self.dragStart = function(element, event)
  {
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
  {
    self.showDrop(false);
  };

  self.dragDrop = function(element, event)
  {
    self.showDrop(false);

    if (event.originalEvent.dataTransfer.getData("id") === "")
    {
      return;
    }

    var nodeData = ko.mapping.toJS(self.node);

    nodeData._profilePicture = event.originalEvent.dataTransfer.getData("id");

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
    self.showDrop(true);
    return true;
  };

  self.dragLeave = function(element, event)
  {
    self.showDrop(false);
    return true;
  };

  self.dragOver = function(element, event)
  {

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
