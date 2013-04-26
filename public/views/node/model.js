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
  self.loadingNode = ko.observable(false);

  self.node.subscribe(function(node)
  {
    if (!node)
    {
      console.log("NodeModel: Node is false, do nothing more!");
      return;
    }

    parentModel.title("MURRiX - " + node.name());
  });

  parentModel.path().primary.subscribe(function(value)
  {
    console.log("path load node");
    self.loadNode();
    self.loadGroups();
  });

  self.node.subscribe(function(value)
  {
    console.log("node load");
    self.loadGroups();
  });

  parentModel.currentUser.subscribe(function(value)
  {
    console.log("currentUser load node");
    self.loadNode();
    self.loadGroups();
  });

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
//     else if (self.node() && nodeId === self.node()._id())
//     {
//       console.log("NodeModel: Node id is the same as before, will not update!");
//       self.loadingNode(false);
//       return;
//     }

    self.loadingNode(true);

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

      console.log("Node loaded!");
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
    else if (self.node().type() === "tags")
    {
      murrix.model.dialogModel.tagsNodeModel.showEdit(self.node()._id());
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

  /* Edit Tag Collection */
  self.editTagsNewOpen = function()
  {
    murrix.model.dialogModel.tagsNodeModel.showCreate(function(node)
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

  self.groupAccessListAdmins = ko.observableArray();
  self.groupAccessListReaders = ko.observableArray();
  self.groupAccessListOthers = ko.observableArray();

  self.loadGroups = function()
  {
    self.groupAccessListAdmins.removeAll();
    self.groupAccessListReaders.removeAll();
    self.groupAccessListOthers.removeAll();

    if (self.node() !== false && parentModel.currentUser() !== false)
    {
      var groupIdList = parentModel.currentUser()._groups();
      groupIdList.concat(self.node()._readers(), self.node()._admins());

      murrix.cache.getGroups(groupIdList, function(error, groupList)
      {
        if (error)
        {
          console.log("NodeModel: " + error);
          return;
        }

        var listAdmins = [];
        var listReaders = [];
        var listOthers = [];

        for (var n in groupList)
        {
          if (murrix.inArray(groupList[n]._id(), self.node()._admins()))
          {
            listAdmins.push(groupList[n]);
          }
          else if (murrix.inArray(groupList[n]._id(), self.node()._readers()))
          {
            listReaders.push(groupList[n]);
          }
          else
          {
            listOthers.push(groupList[n]);
          }
        }

        self.groupAccessListAdmins(listAdmins);
        self.groupAccessListReaders(listReaders);
        self.groupAccessListOthers(listOthers);
      });
    }
  };

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
      self.loadGroups();
    });
  };

  self.groupAccessRemove = function(data)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(data._id(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);

    event.preventDefault();
    event.stopPropagation();
  };

  self.groupAccessMakeAdmin = function(data)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.addToArray(data._id(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);

    event.preventDefault();
    event.stopPropagation();
  };

  self.groupAccessMakeReader = function(data)
  {
    var nodeData = ko.mapping.toJS(self.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.addToArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(data._id(), nodeData._admins);

    self.groupAccessSaveNode(nodeData);

    event.preventDefault();
    event.stopPropagation();
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
  {console.log("tagTypeaheadSource");
    murrix.server.emit("distinct", { query: "tags", options: "nodes" }, function(error, tagList)
    {console.log(tagList);
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



  self.profilePictureDropHandler = function(id)
  {
    if (nodeModel.node().hasAdminAccess())
    {
      var nodeData = ko.mapping.toJS(self.node);

      nodeData._profilePicture = id;

      murrix.server.emit("saveNode", nodeData, function(error, nodeData)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
      });
    }
  };



  self.publicLoading = ko.observable(false);

  self.changePublic = function(publicFlag, a, b, c, d)
  {
    self.publicLoading(true);

    var nodeData = ko.mapping.toJS(self.node);

    if (publicFlag)
    {
      nodeData["public"] = true;
    }
    else
    {
      nodeData["public"] = false;
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


  self.nodeTypeaheadSource = function(queryString, callback)
  {
    var inst = this;
    var query = { name: { $regex: ".*" + queryString + ".*", $options: "-i" } };

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

      var toString = function() { return this._id(); };

      for (var key in nodeDataList)
      {
        var item = murrix.cache.addNodeData(nodeDataList[key]);

        item.toString = toString;

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
      return "<strong>" + match + "</strong>";
    });

    var imgUrl = "http://placekitten.com/g/32/32";

    if (item._profilePicture && item._profilePicture() !== false)
    {
      imgUrl = "/preview?id=" + item._profilePicture() + "&width=32&height=32&square=1";
    }

    return "<img style='margin-right: 20px;' class='pull-left' src='" + imgUrl + "'/><span style='padding: 6px; display: block; width: 250px;'>" + name + "</span>";
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
