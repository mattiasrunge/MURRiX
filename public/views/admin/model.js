
var AdminModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "admin"))
    {
      self.show(value.action === "admin");
    }
  });

  self.users = ko.observableArray();
  self.groups = ko.observableArray();

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self._loadGroups();
      self._loadUsers();
    }
    else
    {
      self.users.removeAll();
      self.groups.removeAll();
    }
  });

  parentModel.currentUser.subscribe(function(value)
  {
    if (self.show())
    {
      self._loadGroups();
      self._loadUsers();
    }
    else
    {
      self.users.removeAll();
      self.groups.removeAll();
    }
  });

  self._loadUsers = function()
  {
    self.users.removeAll();

    murrix.server.emit("getUsers", {}, function(error, userDataList)
    {
      if (error)
      {
        console.log(error);
        console.log("AdminModel: Failed to get users!");
        return;
      }

      var count = 0;
      var userList = [];

      for (var id in userDataList)
      {
        userList.push(ko.mapping.fromJS(userDataList[id]));
        count++;
      }

      userList.sort(function(a, b)
      {
        if (a.name() === b.name())
        {
          return 0;
        }

        return (a.name() < b.name()) ? -1 : 1;
      });

      self.users(userList);

      console.log("AdminModel: Found " + count + " users!");
    });
  }
  
  self._loadGroups = function()
  {
    self.groups.removeAll();
  
    murrix.server.emit("getGroups", {}, function(error, groupDataList)
    {
      if (error)
      {
        console.log(error);
        console.log("AdminModel: Failed to get groups!");
        return;
      }

      var count = 0;
      var groupList = [];

      for (var id in groupDataList)
      {
        groupList.push(ko.mapping.fromJS(groupDataList[id]));
        count++;
      }

      groupList.sort(function(a, b)
      {
        if (a.name() === b.name())
        {
          return 0;
        }

        return (a.name() < b.name()) ? -1 : 1;
      });

      self.groups(groupList);

      console.log("AdminModel: Found " + count + " groups!");
    });
  };

  self.groupSaveLoading = ko.observable(false);
  self.groupSaveErrorText = ko.observable("");
  self.groupSaveId = ko.observable(false);
  self.groupSaveName = ko.observable("");
  self.groupSaveDescription = ko.observable("");

  self.groupSaveSubmit = function()
  {
    var groupData = {};

    if (self.groupSaveId() !== false)
    {
      groupData._id = self.groupSaveId();
    }
    
    groupData.name        = self.groupSaveName();
    groupData.description = self.groupSaveDescription();

    self.groupSaveErrorText("");

    if (groupData.name === "")
    {
      self.groupSaveErrorText("Name is empty!");
    }
    else
    {
      self.groupSaveLoading(true);

      murrix.server.emit("saveGroup", groupData, function(error, groupData)
      {
        self.groupSaveLoading(false);

        if (error)
        {
          console.log("AdminModel: Failed to create group: " + error);
          self.groupSaveErrorText("Failed to create group, maybe you don't have rights");
          return;
        }

        self._loadGroups();
        self._loadUsers();

        $(".modal").modal('hide');
      });
    }
  };


  self.userSaveLoading = ko.observable(false);
  self.userSaveErrorText = ko.observable("");
  self.userSaveId = ko.observable(false);
  self.userSaveName = ko.observable("");
  self.userSaveUsername = ko.observable("");

  self.userSaveSubmit = function()
  {
    var userData = {};

    if (self.userSaveId() !== false)
    {
      userData._id = self.userSaveId();
    }

    userData.name = self.userSaveName();
    userData.username = self.userSaveUsername();

    self.userSaveErrorText("");

    if (userData.name === "")
    {
      self.userSaveErrorText("Name is empty!");
    }
    else
    {
      self.userSaveLoading(true);

      murrix.server.emit("saveUser", userData, function(error, userData)
      {
        self.userSaveLoading(false);

        if (error)
        {
          console.log("AdminModel: Failed to create user: " + error);
          self.userSaveErrorText("Failed to create user, maybe you don't have rights");
          return;
        }

        self._loadGroups();
        self._loadUsers();

        $(".modal").modal('hide');
      });
    }
  };

  self.changePasswordId = ko.observable(false);
  self.changePasswordLoading = ko.observable(false);
  self.changePasswordErrorText = ko.observable("");
  self.changePasswordPassword1 = ko.observable("");
  self.changePasswordPassword2 = ko.observable("");

  self.changePasswordClicked = function(id)
  {
    self.changePasswordId(ko.utils.unwrapObservable(id));
    return true;
  }

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

    var id = murrix.model.currentUser()._id();

    if (self.changePasswordId() !== false)
    {
      id = self.changePasswordId();
    }

    murrix.server.emit("changePassword", { id: id, password: self.changePasswordPassword1() }, function(error)
    {
      self.changePasswordLoading(false);

      if (error)
      {
        self.changePasswordErrorText("Failed to change password, please report this to the administrator");
        return;
      }

      self.changePasswordPassword1("");
      self.changePasswordPassword2("");
      self.changePasswordErrorText("");
      self.changePasswordId(false);

      $(".modal").modal('hide');

      $.cookie("userinfo", null, { path: "/" });
    });
  };


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
        console.log("AdminModel: Failed to logout!");
        self.errorText("Failed to sign out, try again");
        return;
      }

      $.cookie("userinfo", null, { path : "/" });

      $(".dropdown.open .dropdown-toggle").dropdown("toggle");
      
      murrix.model.setCurrentUserData(false);
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
        console.log("AdminModel: Failed to login!");
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

      murrix.model.setCurrentUserData(userData);
    });
  };
};