
var NodeModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { updatePath(value, self.path); });
  
  self.show = ko.computed(function() { return parentModel.path().primary().action === "node"; });



  self.primaryNodeId = ko.observable(false);
  self.profilePictureNodeId = ko.observable(false);
  self.tagNodeIdList = ko.observableArray([]);
  
  /* This function is called when the primary node id changes
   * or the node list has been updated.
   */
  self.node = ko.computed(function()
  {
    console.log("NodeModel: Primary id is now " + self.primaryNodeId());

    if (!parentModel.dbModel.nodes[self.primaryNodeId()])
    {
      console.log("NodeModel: Index was -1, returning false as node!");
      return false;
    }
    
    console.log("NodeModel: Node is cached, returning!");
    return parentModel.dbModel.nodes[self.primaryNodeId()];
  });
  

  /* This function is called when the profile id changes or the
   * node list has been updated.
   */
  self.profilePictureNode = ko.computed(function()
  {
    if (!parentModel.dbModel.nodes[self.profilePictureNodeId()])
    {
      console.log("NodeModel: Index was -1, returning false profile picture node!");
      return false;
    }

    console.log("NodeModel: Profile picture node is cached, returning!");
    return parentModel.dbModel.nodes[self.profilePictureNodeId()];
  });


  self.tagNodeList = ko.computed(function()
  {
    var tagList = [];

    for (var n = 0; n < self.tagNodeIdList().length; n++)
    {
      if (parentModel.dbModel.nodes[self.tagNodeIdList()[n]])
      {
        console.log("NodeModel: Tag node is cached, adding to list, id = " + self.tagNodeIdList()[n] + "!");

        tagList.push(parentModel.dbModel.nodes[self.tagNodeIdList()[n]]);
      }
    }

    return tagList;
  });


  /* This function is called every time the node changes and tries to
   * set up variables for required sub nodes and also try to fetch
   * the nodes to make sure the get cached.
   */
  self.node.subscribe(function(node)
  {
    var requiredNodeIdList = [];

    console.log("NodeModel: Clearing profile picture id and map");
    self.profilePictureNodeId(false);
    self.tagNodeIdList.removeAll();
    $.murrix.module.map.clearMap();

    if (!node)
    {
      console.log("NodeModel: Node is false, setting profile id to false!");
      return;
    }


    console.log("NodeModel: Looking at the links for required nodes");

    for (var n = 0; n < node.links().length; n++)
    {
      var link = node.links()[n];

      if (link.role() === "profilePicture")
      {
        console.log("NodeModel: Setting profile picture id to " + link.node_id());
        requiredNodeIdList.push(link.node_id());
        self.profilePictureNodeId(link.node_id());
      }
      else if (link.role() === "tag")
      {
        console.log("NodeModel: Found tag with id " + link.node_id());
        requiredNodeIdList.push(link.node_id());
        self.tagNodeIdList.push(link.node_id());
      }
    }


    console.log("NodeModel: Fetching required subnodes if there are any");
    if (requiredNodeIdList.length > 0)
    {
      parentModel.dbModel.fetchNodesBuffered(requiredNodeIdList, function(transactionId, resultCode)
      {
        if (resultCode != MURRIX_RESULT_CODE_OK)
        {
          console.log("NodeModel: Got error while trying to fetch required nodes, resultCode = " + resultCode);
        }
      });
    }

    console.log("NodeModel: Setting node to map");
    $.murrix.module.map.setNodes([ node ]);
  });
  

  /* This function is run when the primary path is changed
   * and a new node id has been set. It tries to cache
   * the node and set the primary node id observable.
   */
  parentModel.path().primary.subscribe(function(primary)
  {
    console.log(primary);
    if (primary.args.length == 0)
    {
      console.log("NodeModel: No node id specified!");
      return;
    }

    var nodeId = primary.args[0];

    if (typeof nodeId != "number")
    {
      try
      {
        nodeId = parseInt(nodeId, 10);
      }
      catch (e)
      {
        nodeId = 0;
      }
    }

    console.log("NodeModel: Got nodeId = " + nodeId);

    /* Zero is not a valid id */
    if (nodeId == 0)
    {
      console.log("NodeModel: Setting primary node id to false");
      self.primaryNodeId(false);
      return;
    }


    /* Make sure the node is cached before setting the primary id */
    parentModel.dbModel.fetchNodesBuffered([ nodeId ], function(transactionId, resultCode)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("NodeModel: Got error while trying to fetch node, resultCode = " + resultCode)
      }
      else
      {
        console.log("NodeModel: Setting primary id to " + nodeId);
        self.primaryNodeId(nodeId);
      }
    });
  });


  /* Define all sub views */
  self.summaryModel = new SummaryModel(self);
  self.timelineModel = new TimelineModel(self);
  self.picturesModel = new PicturesModel(self);
  self.relationsModel = new RelationsModel(self);
  self.logbookModel = new LogbookModel(self);
  self.commentsModel = new CommentsModel(self);
  self.connectionsModel = new ConnectionsModel(self);
  self.rightsModel = new RightsModel(self);
};
