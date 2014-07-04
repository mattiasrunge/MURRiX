
define(['ko-ext', 'murrix'], function(ko, murrix)
{
  var commentText = ko.observable("");
  var errorText = ko.observable(false);
  var loading = ko.observable(false);
  
  return {
    node: murrix.node,
    commentText: commentText,
    errorText: errorText,
    loading: loading,
    user: murrix.user,
    activate: function()
    {
      console.log("node", murrix.node());
    },
    submitComment: function()
    {
      if (commentText() === "") 
      {
        errorText("Can not submit an empty comment.");
        return;
      }
      
      loading(true);
      errorText(false);
      
      murrix.server.emit("node.comment", { _id: murrix.node()._id, text: commentText() }, function(error, nodeData)
      {
        loading(false);
        
        if (error)
        {
          errorText(error);
          return;
        }
        
        commentText("");

        murrix.node(nodeData);
      });
    }
  }
});
