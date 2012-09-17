
var NodeModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });
  
  self.show = ko.computed(function() { return parentModel.path().primary().action === "node"; });



  self.node = ko.observable(false);
  self.profilePictureNode = ko.observable(false);
  self.tagNodeList = ko.observableArray([]);

  /* This function is called every time the node changes and tries to
   * set up variables for required sub nodes and also try to fetch
   * the nodes to make sure the get cached.
   */
  self.node.subscribe(function(node)
  {
    var requiredNodeIdList = [];

    console.log("NodeModel: Clearing profile picture, tags and map");
    self.profilePictureNode(false);
    self.tagNodeList.removeAll();
    $.murrix.module.map.clearMap();

    if (!node)
    {
      console.log("NodeModel: Node is false, setting profile id to false!");
      return;
    }


    node.getLinkedNodes("profilePicture", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("NodeModel: Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else if (nodeList.length > 0)
      {
        self.profilePictureNode(nodeList[0]);
      }
      else
      {
        console.log("NodeModel: No profile picture set.");
      }
    });

    node.getLinkedNodes("tag", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("NodeModel: Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else if (nodeList.length > 0)
      {
        self.tagNodeList(nodeList);
      }
      else
      {
        console.log("NodeModel: No tags found.");
      }
    });

    console.log("NodeModel: Setting node to map");
    $.murrix.module.map.setNodes([ node ]);
  });
  

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

    var nodeId = $.murrix.intval(primary.args[0]);

    console.log("NodeModel: Got nodeId = " + nodeId);

    /* Zero is not a valid id */
    if (nodeId === 0)
    {
      console.log("NodeModel: Node id is invalid, setting node to false");
      self.node(false);
      return;
    }


    /* Make sure the node is cached before setting the primary id */
    $.murrix.module.db.fetchNodesBufferedIndexed([ nodeId ], function(transactionId, resultCode, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("NodeModel: Got error while trying to fetch node, resultCode = " + resultCode);
      }
      else if (typeof nodeList[nodeId] != 'undefined')
      {
        console.log("NodeModel: Node found, setting node with id " + nodeId);
        self.node(nodeList[nodeId]);
      }
      else
      {
        console.log("NodeModel: No nodes found with that node id, maybe you do not have rights to it!");
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
