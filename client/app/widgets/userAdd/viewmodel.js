
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.loading = settings.loading;
    self.errorText = settings.error;
    self.successText = settings.success;

    self.personId = ko.observable(false);
    self.name = ko.observable("");
    self.username = ko.observable("");
    self.email = ko.observable("");
    self.password = ko.observable("");

    function clear()
    {
      self.personId(false);
      self.name("");
      self.username("");
      self.email("");
      self.password("");
    }

    self.saveProfile = function()
    {
      if (self.username() === "")
      {
        self.errorText("Username can not be empty!");
        return;
      }
      else if (self.password() === "")
      {
        self.errorText("Password can not be empty!");
        return;
      }

      self.errorText(false);
      self.loading(true);

      murrix.server.emit("user.save", {
        name: self.name(),
        username: self.username(),
        password: self.password(),
        email: self.email(),
        _person: self.personId()
      }, function(error, userData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        settings.user(userData);
        self.successText("User created successfully!");
        clear();
      });
    };
  };

  return ctor;
});
