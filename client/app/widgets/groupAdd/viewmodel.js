
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.loading = settings.loading;
    self.errorText = settings.error;
    self.successText = settings.success;

    self.name = ko.observable("");
    self.description = ko.observable("");

    function clear()
    {
      self.name("");
      self.description("");
    }

    self.save = function()
    {
      if (self.name() === "")
      {
        self.errorText("Name can not be empty!");
        return;
      }

      self.errorText(false);
      self.loading(true);

      murrix.server.emit("group.save", {
        name: self.name(),
        description: self.description()
      }, function(error, groupData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        settings.group(groupData);
        self.successText("Group created successfully!");
        clear();
      });
    };
  };

  return ctor;
});
