
var TodoModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.issues = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "todo"))
    {
      self.show(value.action === "todo");
    }

    if (self.show())
    {
      self.issues.removeAll();
      parentModel.title("TODO");

      jQuery.getJSON("https://api.github.com/repos/mattiasrunge/MURRiX/issues", function(data)
      {
        self.issues(data);
      });
    }
  });
};
