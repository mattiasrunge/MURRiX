
var TodoModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "todo", title: "TODO" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    jQuery.getJSON("https://api.github.com/repos/mattiasrunge/MURRiX/issues", function(data)
    {
      callback(null, data);
    });
  };
};
