
var HelpModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "help", title: "Help" });

  self.chapter = ko.observable("overview");

  self.args.subscribe(function(value)
  {
    self.chapter(value.length > 0 ? value[0] : "overview");
  });
};
