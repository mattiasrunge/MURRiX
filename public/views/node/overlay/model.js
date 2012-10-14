
var OverlayModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.node = ko.observable(false);

  self.show = ko.observable(false);

  self.node.subscribe(function(value)
  {
    if (self.show() !== (value !== false))
    {
      self.show(value !== false);
    }
  });

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

    murrix.cache.getNodes([ nodeId ], function(error, nodeList)
    {
      if (error)
      {
        console.log(error);
        console.log("OverlayModel: Failed to find node!");
        return;
      }

      if (nodeList.length === 0 || !nodeList[nodeId])
      {
        console.log("OverlayModel: No results returned, you probably do not have rights to this node!");
        return;
      }

      self.node(nodeList[nodeId]);
    });
  });

  self.carouselLeft = function()
  {
    var element = $(".carousel-inner").children(":visible").prev();

    if (element.length === 0)
    {
      element = $(".carousel-inner").children(":last");
    }

    document.location.hash = murrix.createPath(1, null, element.attr("data-murrix-id"));
  };

  self.carouselRight = function()
  {
    var element = $(".carousel-inner").children(":visible").next();

    if (element.length === 0)
    {
      element = $(".carousel-inner").children(":first");
    }

    document.location.hash = murrix.createPath(1, null, element.attr("data-murrix-id"));
  };

  self.commentText = ko.observable("");
  self.commentLoading = ko.observable(false);
  self.commentErrorText = ko.observable("");
  
  self.commentSubmit = function()
  {
    
    if (self.commentText() === "")
    {
      self.commentErrorText("Comment field can not be empty!");
      return;
    }

    self.commentErrorText("");
    self.commentLoading(true);

    var nodeData = ko.mapping.toJS(self.node);

    if (!nodeData.comments)
    {
      nodeData.comments = [];
    }

    murrix.server.emit("comment", { nodeId: self.node()._id(), text: self.commentText() }, function(error, nodeData)
    {
      self.commentLoading(false);

      if (error)
      {
        self.commentErrorText(error);
        return;
      }

      self.commentText("");

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };
};
