
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.user = settings.user;
    self.loading = settings.loading;
    self.errorText = settings.error;
    self.successText = settings.success;

    self.personId = ko.observable(false);
    self.name = ko.observable("");
    self.username = ko.observable("");
    self.email = ko.observable("");
    self.password1 = ko.observable("");
    self.password2 = ko.observable("");

    self.user.subscribe(function()
    {
      self.resetProfile();
    });

    self.resetProfile = function()
    {
      self.password1("");
      self.password2("");

      if (self.user() !== false)
      {
        self.personId(self.user()._person);
        self.name(self.user().name);
        self.username(self.user().username);
        self.email(self.user().email);
      }
      else
      {
        self.personId(false);
        self.name("");
        self.username("");
        self.email("");
      }
    };

    self.saveProfile = function()
    {
      if (self.username() === "")
      {
        self.errorText("Username can not be empty!");
        return;
      }

      self.errorText(false);
      self.loading(true);

      murrix.server.emit("user.saveProfile", {
        name: self.name(),
        username: self.username(),
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

        self.user(userData);
        self.successText("Profile saved successfully!");
      });
    };

    self.changePassword = function()
    {
      if (self.password1() !== self.password2())
      {
        self.errorText("Password does not match!");
        return;
      }
      else if (self.password1() === "")
      {
        self.errorText("Password can not be empty!");
        return;
      }

      self.errorText(false);
      self.loading(true);

      murrix.server.emit("user.changePassword", {
        password: self.password1()
      }, function(error, userData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        self.user(userData);
        self.successText("Password changed successfully!");
      });
    };

    self.resetProfile();
  };

  return ctor;
});
