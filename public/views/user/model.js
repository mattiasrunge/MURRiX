
var UserModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "user"; });


  self.currentUser = ko.observable(false);
  self.groupNodeList = ko.observableArray([]);
  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.inputRemember = ko.observable(false);
  self.usernameFocused = ko.observable(true);
  self.errorText = ko.observable("");
  self.loading = ko.observable(false);


  self.signOutClicked = function()
  {
    self.loading(true);
    self.errorText("");

    murrix.server.emit("logout", { }, function(error)
    {
      self.loading(false);

      if (error)
      {
        console.log("UserModel: Failed to logout!");
        self.errorText("Failed to sign out, try again");
        return;
      }

      $.cookie("userinfo", null, { path : "/" });

      $(".dropdown.open .dropdown-toggle").dropdown("toggle");
      self.currentUser(false);
    });
  };

  self.loginSubmit = function()
  {
    self.loading(true);
    self.errorText("");

    murrix.server.emit("login", { username: self.inputUsername(), password: self.inputPassword() }, function(error, userData)
    {
      self.loading(false);
      
      if (error || userData === false)
      {
        self.usernameFocused(true);
        console.log("UserModel: Failed to login!");
        self.errorText("Failed to sign in, try again");
        return;
      }

      if (self.inputRemember() === true)
      {
        $.cookie("userinfo", JSON.stringify({ username: self.inputUsername(), password: self.inputPassword() }), { expires: 365, path: '/' });
      }
      else
      {
        $.cookie("userinfo", null, { path: "/" });
      }

      self.inputUsername("");
      self.inputPassword("");
      self.inputRemember(false);

      $(".dropdown.open .dropdown-toggle").dropdown("toggle");
      
      self.currentUser(ko.mapping.fromJS(userData));
    });
  };

  self.setInitialUser = function(user)
  {
    self.currentUser(user);
  };


  self.changePasswordLoading = ko.observable(false);
  self.changePasswordErrorText = ko.observable("");
  self.changePasswordPassword1 = ko.observable("");
  self.changePasswordPassword2 = ko.observable("");

  self.changePasswordSubmit = function(form)
  {
    if (self.changePasswordPassword1() === "")
    {
      self.changePasswordErrorText("Password can not be empty");
      return;
    }

    if (self.changePasswordPassword1() !== self.changePasswordPassword2())
    {
      self.changePasswordErrorText("Password do not match");
      return;
    }

    self.changePasswordLoading(true);
    self.changePasswordErrorText("");

    murrix.server.emit("changePassword", { password: self.changePasswordPassword1() }, function(error)
    {
      self.changePasswordLoading(false);

      if (error)
      {
        self.changePasswordPassword1(true);
        self.changePasswordErrorText("Failed to change password, please report this to the administrator");
        return;
      }

      self.changePasswordPassword1("");
      self.changePasswordPassword2("");
      self.changePasswordErrorText("");

      $(".modal").modal('hide');

      $.cookie("userinfo", null, { path: "/" });
    });
  };
};
