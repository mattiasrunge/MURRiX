
var OverlayModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.node = ko.observable(false);
  this.show = ko.computed(function() { return self.node() !== false; }, this);

  /*parentModel.node.subscribe(function(node)
  {
    self.node(false);
  
    if (!node)
    {
      console.log("Node is false, not loading node for overlay!");
      return;
    }

  });*/

  parentModel.path().primary.subscribe(function(primary)
  {
    if (primary.args.length === 0)
    {
      console.log("OverlayModel: No node id specified setting node to false!");
      self.node(false);
      return;
    }

    var nodeId = primary.args[0];

    console.log("OverlayModel: Got nodeId = " + nodeId);

    /*if (primary.action !== "node")
    {
      console.log("OverlayModel: Node not shown, setting node to false");
      self.node(false);
      return;
    }
    else */if (self.node() && nodeId === self.node()._id())
    {
      console.log("OverlayModel: Node id is the same as before, will not update!");
      return;
    }

    murrix.model.server.emit("find", { _id: nodeId }, function(error, nodeDataList)
    {
      if (error)
      {
        console.log(error);
        console.log("OverlayModel: Failed to find node!");
        return;
      }

      if (nodeDataList.length === 0 || !nodeDataList[nodeId])
      {
        console.log("OverlayModel: No results returned, you probably do not have rights to this node!");
        return;
      }

      self.node(murrix.model.cacheNode(nodeDataList[nodeId]));

      for (var index = 0; index < murrix.model.nodeModel.fileNodes().length; index++)
      {
        if (murrix.model.nodeModel.fileNodes()[index]._id() === nodeId)
        {
          break;
        }
      }

      console.log("OverlayModel: Index is " + index);

      if (index < 0)
      {
        index = murrix.model.nodeModel.fileNodes().length - 1;
      }
      else if (index >= murrix.model.nodeModel.fileNodes().length)
      {
        index = 0;
      }

      console.log("OverlayModel: Index is " + index);

      $("#overlayCarousel").carousel(index);

      $("#overlayCarousel").one("slid", function()
      {
        $(this).carousel('pause');
      });
    });
  
/*    if (primary.args.length === 0)
    {
      console.log("OverlayModel: No overlay node id specified, setting node to false!");
      self.show(false);
      self.node(false);
      return;
    }

    console.log("OverlayModel: Got nodeId = " + nodeId);


    if (nodeId === 0)
    {
      console.log("OverlayModel: Node id is invalid, setting node to false");
      self.show(false);
      self.node(false);
      return;
    }
    else if (self.node() && nodeId === self.node()._id())
    {
      console.log("OverlayModel: Node id is the same as before, will not update!");
      return;
    }
*/

    /* Make sure the node is cached before setting the primary id */
/*    $.murrix.module.db.fetchNodesBufferedIndexed([ nodeId ], function(transactionId, resultCode, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("OverlayModel: Got error while trying to fetch node, resultCode = " + resultCode);
      }
      else if (typeof nodeList[nodeId] != 'undefined')
      {
        console.log("OverlayModel: Node found, setting node with id " + nodeId);

        self.node(nodeList[nodeId]);

        if (self.show() !== true)
        {
          self.show(true);
        }
        
        for (var index = 0; index < murrix.model.nodeModel.fileNodes().length; index++)
        {
          if (murrix.model.nodeModel.fileNodes()[index]._id() === nodeId)
          {
            break;
          }
        }

        console.log("OverlayModel: Index is " + index);
        
        if (index < 0)
        {
          index = murrix.model.nodeModel.fileNodes().length - 1;
        }
        else if (index >= murrix.model.nodeModel.fileNodes().length)
        {
          index = 0;
        }

        console.log("OverlayModel: Index is " + index);

        $("#overlayCarousel").carousel(index);

        $("#overlayCarousel").one("slid", function()
        {
          $(this).carousel('pause');
        });
      }
      else
      {
        console.log("OverlayModel: No nodes found with that node id, maybe you do not have rights to it!");
      }
    });*/
  });

  self.carouselLeft = function()
  {
    for (var index = 0; index < murrix.model.nodeModel.fileNodes().length; index++)
    {
      if (murrix.model.nodeModel.fileNodes()[index]._id() === self.node()._id())
      {
        break;
      }
    }

    index--; // Move left

    if (index < 0)
    {
      index = murrix.model.nodeModel.fileNodes().length - 1;
    }
    else if (index >= murrix.model.nodeModel.fileNodes().length)
    {
      index = 0;
    }

    document.location.hash = murrix.createPath(1, null, murrix.model.nodeModel.fileNodes()[index]._id());
  };

  self.carouselRight = function()
  {
    for (var index = 0; index < murrix.model.nodeModel.fileNodes().length; index++)
    {
      if (murrix.model.nodeModel.fileNodes()[index]._id() === self.node()._id())
      {
        break;
      }
    }

    index++; // Move right

    if (index < 0)
    {
      index = murrix.model.nodeModel.fileNodes().length - 1;
    }
    else if (index >= murrix.model.nodeModel.fileNodes().length)
    {
      index = 0;
    }

    document.location.hash = murrix.createPath(1, null, murrix.model.nodeModel.fileNodes()[index]._id());
  };

  self.commentText = ko.observable("");
  self.commentLoading = ko.observable(false);
  self.commentErrorText = ko.observable("");
  
  self.commentSubmit = function()
  {
    console.log(self.commentText());
  };
};

 
