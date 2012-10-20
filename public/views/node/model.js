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

  self.firstDatetime = false;
  self.lastDatetime = false;

  /* This function is called every time the node changes and tries to
   * set up variables for required sub nodes and also try to fetch
   * the nodes to make sure the get cached.
   */
  self.node.subscribe(function(node)
  {
    var requiredNodeIdList = [];

    console.log("NodeModel: Clearing profile picture, tags and map");
    self.items.removeAll();
    //$.murrix.module.map.clearMap();

    if (!node)
    {
      console.log("NodeModel: Node is false, setting profile id to false!");
      return;
    }


    // TODO: Load all related nodes (look
    // 

    self.loadItems(function(error)
    {
      var n = 0;

      if (error)
      {
        return;
      }

      /* Get time range of files */
//       if (self.items().length > 0)
//       {
//         for (n = 0; n < self.items().length; n++)
//         {
//           if (self.items()[n].createdDatetime)
//           {
//             if (self.firstDatetime === false || self.firstDatetime > self.items()[n].createdDatetime)
//             {
//               self.firstDatetime = self.items()[n].createdDatetime;
//             }
// 
//             if (self.lastDatetime === false || self.lastDatetime < self.items()[n].createdDatetime)
//             {
//               self.lastDatetime = self.items()[n].createdDatetime;
//             }
//           }
//         }
//       }
// 
//       /* Get time range of texts */
//       if (self.node().texts && self.node().texts().length > 0)
//       {
//         for (n = 0; n < self.node().texts().length; n++)
//         {
//           if (self.node().texts()[n].createdDatetime)
//           {
//             if (self.firstDatetime === false || self.firstDatetime > self.node().texts()[n].createdDatetime)
//             {
//               self.firstDatetime = self.node().texts()[n].createdDatetime;
//             }
// 
//             if (self.lastDatetime === false || self.lastDatetime < self.node().texts()[n].createdDatetime)
//             {
//               self.lastDatetime = self.node().texts()[n].createdDatetime;
//             }
//           }
//         }
//       }

      


      if (self.node().type() === "event")
      {
        // Load files (direct parent link of file node)
        // Load persons (birth death, marrige, engagement or relation list of remote person)
        // Load things

        // Find start and stop datatimes if defined


        // Calculate start stop datetimes from files and texts datetimes
        
        // Compile a list of markers from files, texts and possibly locations
        // Compile a list of tracks for linked vehicles for the range above
      }
      else if (self.node().type() === "location")
      {
        // Load persons livining here (home of person node)
        // Load events (relationlist of remote event)
        // Load files connected to this location... (how to do this, search on position with radius?)


        // No start and stop datetimes exist


        // Compile a list of markers with the location itself
        // Empty tracks list
      }
      else if (self.node().type() === "person")
      {
        // Load pictures (relation list of remote file)
        // Load birth, death, marrige and engagement events (direct link)
        // Load events (relationslist of remote event)
        // Load home location (direct link)
        // Load mother, father, partner (direct link)


        // Calculate start stop datetimes from files or events

        // Compile a list of markers for connected events, files and home location
        // Empty tracks list
      }
      else if (self.node().type() === "thing")
      {
        // Load owners (list of direct links)
        // Load pictures (relation list of remote file)
        // Load events (relationslist of remote event)

        // Set start and stop datatimes to position range + events range

        // Compile a list of marker for connected files and events
        // Compile a track list for a "good" range
      }
      
    });

    //console.log("NodeModel: Setting node to map");
    //$.murrix.module.map.setNodes([ node ]);*/
  });

  self.loadItems = function(callback)
  {
    self.items.removeAll();

    if (self.node())
    {
      murrix.server.emit("find", { query: { _parents: self.node()._id(), what: "file" }, options: "items" }, function(error, itemDataList)
      {
        if (error)
        {
          console.log(error);
          console.log("NodeModel: Failed to get items!");

          if (callback)
          {
            callback(error);
          }
          return;
        }

        var count = 0;
        var itemList = [];

        for (var id in itemDataList)
        {
          itemList.push(murrix.cache.addItemData(itemDataList[id]));
          count++;
        }

        itemList.sort(function(a, b)
        {
          return (b.when && a.when) ? a.when.timestamp() - b.when.timestamp() : 0;
        });

        self.items(itemList);

        console.log("NodeModel: Found " + count + " items!");

        if (callback)
        {
          callback(null);
        }
      });

      return;
    }

    if (callback)
    {
      callback(null);
    }
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
  
  self.loadNode = function()
  {
    if (parentModel.path().primary().args.length === 0)
    {
      console.log("NodeModel: No node id specified setting node to false!");
      self.node(false);
      return;
    }

    var nodeId = parentModel.path().primary().args[0];

    console.log("NodeModel: Got nodeId = " + nodeId);

    /* Zero is not a valid id */
    if (parentModel.path().primary().action !== "node")
    {
      console.log("NodeModel: Node not shown, setting node to false");
      self.node(false);
      return;
    }
    else if (self.node() && nodeId === self.node()._id())
    {
      console.log("NodeModel: Node id is the same as before, will not update!");
      return;
    }

    murrix.cache.getNodes([ nodeId ], function(error, nodeList)
    {
      if (error)
      {
        console.log(error);
        console.log("NodeModel: Failed to find node!");
        return;
      }

      if (nodeList.length === 0 || !nodeList[nodeId])
      {
        console.log("NodeModel: No results returned, you probably do not have rights to this node!");
        return;
      }
      
      self.node(nodeList[nodeId]);
    });
  };



  /* Creating */
  self.createLoading = ko.observable(false);
  self.createErrorText = ko.observable("");
  self.createName = ko.observable("");
  self.createDescription = ko.observable("");

  self.createSubmit = function(form)
  {
    var nodeData = {};

    nodeData.type        = $(form).attr("data-murrix-node-type");
    nodeData.name        = self.createName();
    nodeData.description = self.createDescription();

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
          console.log("NodeModel: Failed to create album: " + error);
          self.createErrorText("Failed to create album, maybe you don't have rights");
          return;
        }

        var node = murrix.cache.addNodeData(nodeData);

        $(".modal").modal('hide');
        
        document.location.hash = murrix.createPath(0, "node", node._id());
      });
    }
  };

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
  $(".typeahead").css({ "z-index": 1051 }); // Hack to show the typeahead box

  $(".modal").on('hidden', function ()
  {
    self.createLoading(false);
    self.createErrorText("");
    self.createName("");
    self.createDescription("");

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
    console.log("enter");
    self.showDrop(true);
    return true;
  };

  self.dragLeave = function(element, event)
  {
    console.log("leave");
    self.showDrop(false);
    return true;
  };

  self.dragOver = function(element, event)
  {
  
  };

  self.publicLoading = ko.observable(false);
  
  self.changePublic = function(public, a, b, c, d)
  {
    self.publicLoading(true);
  
    var nodeData = ko.mapping.toJS(self.node);

    if (public)
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
        alert("Could not make node " + (public ? "public" : "private") + "!");
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };
  
  /* Define all sub views */
  self.summaryModel = new SummaryModel(self);
  self.timelineModel = new TimelineModel(self);
  self.picturesModel = new PicturesModel(self);
  self.relationsModel = new RelationsModel(self);
  self.logbookModel = new LogbookModel(self);
  self.commentsModel = new CommentsModel(self);
  self.connectionsModel = new ConnectionsModel(self);
  self.accessesModel = new AccessesModel(self);
  self.overlayModel = new OverlayModel(self);
};
