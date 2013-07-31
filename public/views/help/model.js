
var HelpModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "help"))
    {
      self.show(value.action === "help");
    }

    if (self.show())
    {
      self.chapter(value.args.length === 0 ? "overview" : value.args[0]);
    }
  });

  self.chapter = ko.observable("overview");
};
