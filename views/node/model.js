
var NodeModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });
  
  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "node"))
    {
      self.show(value.action === "node");
    }
  });


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


    node.getLinkedNodes("file_profile", function(resultCode, nodeIdList, nodeList)
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
    else if (self.node() && nodeId === self.node().id())
    {
      console.log("NodeModel: Node id is the same as before, will not update!");
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


  /* Creating */

  self.createLoading = ko.observable(false);
  self.createErrorText = ko.observable("");
  self.createName = ko.observable("");
  self.createDescription = ko.observable("");

  self.createSubmit = function(form)
  {
    var nodeData = {};

    nodeData["type"]        = $(form).attr("data-murrix-node-type");
    nodeData["name"]        = self.createName();
    nodeData["description"] = self.createDescription();

    self.createErrorText("");

    if (nodeData["name"] == "")
    {
      self.createErrorText("Name is empty!");
    }
    else
    {
      self.createLoading(true);
      
      console.log(nodeData);
  
      $(".modal").modal('hide');
    }
  };

  self.tagLoading = ko.observable(false);
  self.tagErrorText = ko.observable("");
  self.tagName = ko.observable("");

  self.tagSubmit = function()
  {
    self.tagLoading(true);
  
    console.log(self.tagName());
  };

  self.tagRemove = function(tagNode)
  {
    self.tagLoading(true)
  
    console.log(tagNode.name());
  };

  self.tagAutocomplete = function(query, callback)
  {
    $.murrix.module.db.searchNodeIds({ types: [ "tag" ] }, function(transactionId, resultCode, nodeIdList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("Got error while trying to run query, resultCode = " + resultCode);
        callback([]);
      }
      else if (nodeIdList.length > 0)
      {
        $.murrix.module.db.fetchNodesBuffered(nodeIdList, function(transactionId, resultCode, nodeList)
        {
          if (resultCode != MURRIX_RESULT_CODE_OK)
          {
            console.log("Got error while trying to run query, resultCode = " + resultCode);
            callback([]);
          }
          else if (nodeList.length === 0)
          {
            callback([]);
          }
          else
          {
            var resultList = [];
            
            jQuery.each(nodeList, function(id, node)
            {
              var alreadyTagged = false;

              for (var n = 0; n < self.tagNodeList().length; n++)
              {
                if (self.tagNodeList()[n].name() === node.name())
                {
                  alreadyTagged = true;
                  break;
                }
              }

              if (!alreadyTagged)
              {
                resultList.push(node.name());
              }
            });

            callback(resultList);
          }
        });
      }
      else
      {
        callback([]);
      }
    });
  };

  $("[name=newTag]").typeahead({ source: function(query, callback) { self.tagAutocomplete(query, callback); } });

  $(".modal").on('hidden', function ()
  {
    self.createLoading(false);
    self.createErrorText("");
    self.createName("");
    self.createDescription("");

    self.tagLoading(false);
    self.tagErrorText("")
    self.tagName("");
  });
  

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
