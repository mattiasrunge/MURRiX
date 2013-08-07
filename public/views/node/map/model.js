
var MapModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    var show = value.action === "map";

    if (self.show() !== show)
    {
      self.show(show);
    }
  });

  self.enabled = ko.observable(true);

  self.show.subscribe(function(value)
  {
    if (value && parentModel.node() !== false)
    {/*
      self.loadAge();
      self.loadHomes();
      self.loadOwnerOf();
      self.loadShowing();
      self.loadWhos();*/
    }
  });

  parentModel.node.subscribe(function(value)
  {
    if (self.show() && value !== false)
    {
//       self.loadAge();
//       self.loadHomes();
//       self.loadOwnerOf();
//       self.loadShowing();
//       self.loadWhos();
    }
  });


};
