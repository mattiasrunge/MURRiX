
var ConfigModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "config"))
    {
      self.show(value.action === "config");
    }
  });

  self.configuration = ko.observable();

  self.show.subscribe(function(value)
  {
    if (value)
    {
      parentModel.title("MURRiX - Configuration");
      self._load();
    }
    else
    {
      self.configuration(false);
    }
  });

  parentModel.currentUser.subscribe(function(value)
  {
    if (value)
    {
      self._load();
    }
    else
    {
      self.configuration(false);
    }
  });

  self._load = function()
  {
    self.configuration(false);

    murrix.server.emit("getConfiguration", {}, function(error, configurationData)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      self.configuration(ko.mapping.fromJS(configurationData));
    });
  };
};
