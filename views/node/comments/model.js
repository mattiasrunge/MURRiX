
var CommentsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "comments"; });
  self.enabled = ko.observable(true);
  
  self.entries = ko.observableArray([ ]);

  parentModel.node.subscribe(function(node)
  {
    self.entries.removeAll();

    if (!node)
    {
      console.log("Node is false, not looking for comments!");
      return;
    }

    console.log("Looking for comments...");
    node.getLinkedNodes("comment", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else
      {
        var entries = [];

        jQuery.each(nodeList, function(id, commentNode)
        {
          entries.sort(function(a, b)
          {
            return Date.parse(a.modified) - Date.parse(b.modified);
          });

          self.entries(entries);
        });
      }
    });
  });
};
