
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
      parentModel.title("MURRiX - Administration");
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

    murrix.server.emit("findUsers", {}, function(error, userDataList)
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
        userList.push(murrix.cache.addUserData(userDataList[id]));
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
  };

  self._loadGroups = function()
  {
    self.groups.removeAll();

    murrix.server.emit("findGroups", {}, function(error, groupDataList)
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
        groupList.push(murrix.cache.addGroupData(groupDataList[id]));
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

  self.groupUsers = function(group)
  {
    var filtered = ko.observableArray();

    for (var n = 0; n < self.users().length; n++)
    {
      if (murrix.inArray(group._id(), self.users()[n]._groups()))
      {
        filtered.push(self.users()[n]);
      }
    }

    return filtered;
  };

  self.groupMarkDropZone = ko.observable(false);

  self.groupRemoveUserHandler = function(group, user)
  {
    userData = ko.mapping.toJS(user);

    userData._groups = userData._groups || [];

    userData._groups = murrix.removeFromArray(group._id(), userData._groups);

    murrix.server.emit("saveUser", userData, function(error, userData)
    {
      if (error)
      {
        console.log("AdminModel: Failed to remove group from user: " + error);
        return;
      }

      self._loadUsers();
    });
  };

  self.groupDropUserHandler = function(element, event)
  {
    var id = event.originalEvent.dataTransfer.getData("id");

    var userData = {};

    for (var n = 0; n < self.users().length; n++)
    {
      if (self.users()[n]._id() === id)
      {
        userData = ko.mapping.toJS(self.users()[n]);
      }
    }

    if (!userData)
    {
      console.log("No user with id " + id + " found!");
      return;
    }

    userData._groups = userData._groups || [];

    userData._groups = murrix.addToArray(element._id(), userData._groups);

    murrix.server.emit("saveUser", userData, function(error, userData)
    {
      if (error)
      {
        console.log("AdminModel: Failed to add group to user: " + error);
        return;
      }

      self._loadUsers();
    });
  };

  self.userDragStart = function(element, event)
  {
    self.groupMarkDropZone(true);
    event.originalEvent.dataTransfer.setData("id", element._id());
    return true;
  };

  self.userDragEnd = function(element, event)
  {
    self.groupMarkDropZone(false);
  };

  self.groupSaveLoading = ko.observable(false);
  self.groupSaveErrorText = ko.observable("");
  self.groupSaveId = ko.observable(false);
  self.groupSaveName = ko.observable("");
  self.groupSaveDescription = ko.observable("");

  self.groupCreateClicked = function(element)
  {
    murrix.model.dialogModel.groupModel.showCreate(function()
    {
      self._loadGroups();
    });
  };

  self.groupEditClicked = function(element)
  {
    murrix.model.dialogModel.groupModel.showEdit(element._id(), function()
    {
      self._loadGroups();
    });
  };

  self.groupRemoveClicked = function(element)
  {
    murrix.server.emit("removeGroup", element._id(), function(error)
    {
      if (error)
      {
        console.log("AdminModel: Failed to remove group: " + error);
        return;
      }

      self._loadGroups();
    });
  };

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

        self.groupSaveName("");
        self.groupSaveDescription("");
        self.groupSaveId(false);
        self.groupSaveErrorText("");

        self._loadGroups();

        $(".modal").modal('hide');
      });
    }
  };


  self.userSaveLoading = ko.observable(false);
  self.userSaveErrorText = ko.observable("");
  self.userSaveId = ko.observable(false);
  self.userSaveName = ko.observable("");
  self.userSaveUsername = ko.observable("");
  self.userSavePerson = ko.observable(false);

  self.userSaveClearPerson = function()
  {
    self.userSavePerson(false);
  };

  self.userEditClicked = function(element)
  {
    self.userSaveId(element._id());
    self.userSaveName(element.name());
    self.userSaveUsername(element.username());
    self.userSavePerson(element._person());
    return true;
  };

  self.userRemoveClicked = function(element)
  {
    murrix.server.emit("removeUser", element._id(), function(error)
    {
      if (error)
      {
        console.log("AdminModel: Failed to remove user: " + error);
        return;
      }

      self._loadUsers();
    });
  };

  self.userSaveSubmit = function()
  {
    var userData = {};

    if (self.userSaveId() !== false)
    {
      userData._id = self.userSaveId();

      for (var n = 0; n < self.users().length; n++)
      {
        if (self.users()[n]._id() === self.userSaveId())
        {
          userData = ko.mapping.toJS(self.users()[n]);
        }
      }
    }

    userData.name = self.userSaveName();
    userData.username = self.userSaveUsername();
    userData._person = self.userSavePerson();

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

        self.userSaveId(false);
        self.userSaveName("");
        self.userSaveUsername("");
        self.userSavePerson(false);
        self.userSaveErrorText("");

        self._loadUsers();

        $(".modal").modal('hide');
      });
    }
  };

  self.userSaveTypeaheadUpdater = function(key)
  {
    self.userSavePerson(key);
  };

  self.userSaveTypeaheadNodeFilter = function(item)
  {
    return self.userSavePerson() !== item._id();
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
  };

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

      murrix.cache.clearNodes();
      murrix.cache.clearItems();
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

      murrix.cache.clearNodes();
      murrix.cache.clearItems();
      murrix.model.setCurrentUserData(userData);
    });
  };
};