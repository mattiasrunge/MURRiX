
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "timeline"; });
  self.enabled = ko.observable(true);
};

 
