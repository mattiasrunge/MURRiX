
var RelationsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "relations"; });
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

    console.log("TODO: Find relations");
  });
};
