
var CommentsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "comments"))
    {
      self.show(value.action === "comments");
    }
  });



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

    var nodeData = ko.mapping.toJS(parentModel.node);

    if (!nodeData.comments)
    {
      nodeData.comments = [];
    }

    murrix.server.emit("commentNode", { nodeId: parentModel.node()._id(), text: self.commentText() }, function(error, nodeData)
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
