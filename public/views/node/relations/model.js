
var RelationsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "relations"))
    {
      self.show(value.action === "relations");
    }
  });
  
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
