
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.group = settings.group;
    self.loading = settings.loading;
    self.errorText = settings.error;
    self.successText = settings.success;

    self.name = ko.observable("");
    self.description = ko.observable("");

    self.group.subscribe(function()
    {
      self.reset();
    });

    self.reset = function()
    {
      if (self.group() !== false)
      {
        self.name(self.group().name);
        self.description(self.group().description);
      }
      else
      {
        self.name("");
        self.description("");
      }
    };

    self.save = function()
    {
      if (self.name() === "")
      {
        self.errorText("Name can not be empty!");
        return;
      }

      self.errorText(false);
      self.loading(true);

      var groupToSave = jQuery.extend(true, {}, self.group());
      groupToSave.name = self.name();
      groupToSave.description = self.description();

      murrix.server.emit("group.save", groupToSave, function(error, groupData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        settings.group(groupData);
        self.successText("Group saved successfully!");
        self.reset();
      });
    };

    self.reset();
  };

  return ctor;
});
