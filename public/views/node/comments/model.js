
var CommentsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.enabled = ko.observable(true);
  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "comments"))
    {
      self.show(value.action === "comments");
    }
  });
};
