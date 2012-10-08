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
  self.fileNodes = ko.observableArray();


  /* This function is called every time the node changes and tries to
   * set up variables for required sub nodes and also try to fetch
   * the nodes to make sure the get cached.
   */
  self.node.subscribe(function(node)
  {
    var requiredNodeIdList = [];

    console.log("NodeModel: Clearing profile picture, tags and map");
    self.fileNodes.removeAll();
    //$.murrix.module.map.clearMap();

    if (!node)
    {
      console.log("NodeModel: Node is false, setting profile id to false!");
      return;
    }

    self.loadFiles();

    //console.log("NodeModel: Setting node to map");
    //$.murrix.module.map.setNodes([ node ]);*/
  });

  self.loadFiles = function()
  {
    self.fileNodes.removeAll();

    if (self.node())
    {
      murrix.model.server.emit("find", { _parentNode: { $in: [ self.node()._id() ] }, type: "file" }, function(error, nodeDataList)
      {
        if (error)
        {
          console.log(error);
          console.log("NodeModel: Failed to get files!");
          return;
        }
        
        var count = 0;
        
        for (var id in nodeDataList)
        {
          self.fileNodes.push(murrix.model.cacheNode(nodeDataList[id]));
          count++;
        }
        
        console.log("NodeModel: Found " + count + " files!");
      });
    }
  };
  

  /* This function is run when the primary path is changed
   * and a new node id has been set. It tries to cache
   * the node and set the primary node id observable.
   */
  parentModel.path().primary.subscribe(function(primary)
  {
    if (primary.args.length === 0)
    {
      console.log("NodeModel: No node id specified setting node to false!");
      self.node(false);
      return;
    }

    var nodeId = primary.args[0];

    console.log("NodeModel: Got nodeId = " + nodeId);

    /* Zero is not a valid id */
    if (primary.action !== "node")
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

    murrix.model.server.emit("find", { _id: nodeId }, function(error, nodeDataList)
    {
      if (error)
      {
        console.log(error);
        console.log("NodeModel: Failed to find node!");
        return;
      }

      if (nodeDataList.length === 0 || !nodeDataList[nodeId])
      {
        console.log("NodeModel: No results returned, you probably do not have rights to this node!");
        return;
      }
      
      self.node(murrix.model.cacheNode(nodeDataList[nodeId]));
    });
  });



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

      murrix.model.server.emit("save", nodeData, function(error, nodeData)
      {
        self.createLoading(false);

        if (error)
        {
          console.log("NodeModel: Failed to create album: " + error);
          self.createErrorText("Failed to create album, maybe you don't have rights");
          return;
        }

        var node = murrix.model.cacheNode(nodeData);

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

    nodeData.tags.push(self.tagName());

    murrix.model.server.emit("save", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      self.tagName("");

      murrix.model.cacheNode(nodeData); // This should update self.node() by reference
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

    murrix.model.server.emit("save", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      murrix.model.cacheNode(nodeData); // This should update self.node() by reference
    });
  };

  self.tagAutocomplete = function(query, callback)
  {
    murrix.model.server.emit("distinct", "tags", function(error, tagList)
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
/*    console.log(event.originalEvent.dataTransfer.getData("URL"));
    console.log(event.originalEvent.dataTransfer.getData("DownloadURL"));
    console.log(event.originalEvent.dataTransfer.getData("text/plain"));
    console.log(event.originalEvent.dataTransfer.getData("text/uri-list"));
*/
    //console.log(event.originalEvent.dataTransfer.setData("DownloadURL", "/preview?id=" + element._id() + "&width=1024&height=1024"));
/*    console.log("dragStart", "application/octet-stream:" + element.name() + ":/preview?id=" + element._id() + "&width=1024&height=1024");
*/
    event.originalEvent.dataTransfer.setData("id", element._id());
    return true;
  };

  self.dragDrop = function(element, event)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._profilePicture = event.originalEvent.dataTransfer.getData("id");

    murrix.model.server.emit("save", nodeData, function(error, nodeData)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      murrix.model.cacheNode(nodeData); // This should update self.node() by reference
    });
  };

  self.dragOver = function(a, b, c)
  {
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
