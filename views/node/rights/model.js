
var RightsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "rights"; });
  self.enabled = ko.observable(true);
  
  self.rights = ko.observableArray([ ]);

  parentModel.node.subscribe(function(node)
  {
    self.rights.removeAll();

    if (!node)
    {
      console.log("Node is false, not looking for rights!");
      return;
    }

    console.log("Looking for rights...");
    node.getLinkedNodes("right", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else
      {
        self.rights(nodeList);
      }
    });
  });
};
