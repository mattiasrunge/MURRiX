
var AccessesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "accesses"; });
  self.enabled = ko.observable(true);
  
  self.accesses = ko.observableArray([ ]);

  parentModel.node.subscribe(function(node)
  {
    self.accesses.removeAll();

    if (!node)
    {
      console.log("Node is false, not looking for accesses!");
      return;
    }

    console.log("Looking for accesses...");
    node.getLinkedNodes("access", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else
      {
        self.accesses(nodeList);
      }
    });
  });
};
