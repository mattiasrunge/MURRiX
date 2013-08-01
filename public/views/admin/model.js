
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

    if (self.show())
    {
      self.type(value.args.length === 0 ? "groups" : value.args[0]);
    }
  });

  self.type = ko.observable("groups");

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
    //self.users.removeAll();

    murrix.server.emit("findUsers", {}, function(error, userDataList)
    {
      if (error)
      {
        console.log(error);
        console.log("AdminModel: Failed to get users!");
        return;
      }

      var count = 0;

      for (var id in userDataList)
      {
        var user = murrix.cache.addUserData(userDataList[id]);
        var found = false;

        for (var n = 0; n < self.users().length; n++)
        {
          if (self.users()[n]._id() === user._id())
          {
            found = true;
            break;
          }
        }

        if (!found)
        {
          self.users.push(user);
        }

        count++;
      }

      self.users.sort(function(a, b)
      {
        if (a.name() === b.name())
        {
          return 0;
        }

        return (a.name() < b.name()) ? -1 : 1;
      });

      console.log("AdminModel: Found " + count + " users!");
    });
  };

  self._loadGroups = function()
  {
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
        var group = murrix.cache.addGroupData(groupDataList[id]);
        var found = false;

        for (var n = 0; n < self.groups().length; n++)
        {
          if (self.groups()[n]._id() === group._id())
          {
            found = true;
            break;
          }
        }

        if (!found)
        {
          self.groups.push(group);
        }

        count++;
      }

      self.groups.sort(function(a, b)
      {
        if (a.name() === b.name())
        {
          return 0;
        }

        return (a.name() < b.name()) ? -1 : 1;
      });

      console.log("AdminModel: Found " + count + " groups!");
    });
  };

  self.createHandle = function()
  {
    if (self.type() === "groups")
    {
      murrix.model.dialogModel.groupModel.showCreate(function()
      {
        self._loadGroups();
      });
    }
    else if (self.type() === "users")
    {
      murrix.model.dialogModel.userModel.showCreate(function()
      {
        self._loadUsers();
      });
    }
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

  self.groupTypeaheadUpdater = function(id)
  {
    var groupId = this.options.data._id();
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

    userData._groups = murrix.addToArray(groupId, userData._groups);

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

  self.groupTypeaheadSource = function(queryString, callback)
  {
    var resultList = [];
    var toString = function() { return this._id(); };
    var currentUserIds = [];
    var currentUsers = self.groupUsers(this.options.data);

    for (var n = 0; n < currentUsers().length; n++)
    {
      currentUserIds.push(currentUsers()[n]._id());
    }

    for (var n in self.users())
    {
      var item = self.users()[n];
      item.toString = toString;

      if (!murrix.inArray(item._id(), currentUserIds))
      {
        resultList.push(item);
      }
    }

    return resultList;
  };

  self.groupTypeaheadMatcher = function(item)
  {
    return ~item.name().toLowerCase().indexOf(this.query.toLowerCase());
  };

  self.groupTypeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    var name = item.name().replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>";
    });

    return "<div>" + name + "</div>";
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
    if (confirm("Are you sure you want to remove the group!"))
    {
      murrix.server.emit("removeGroup", element._id(), function(error)
      {
        if (error)
        {
          console.log("AdminModel: Failed to remove group: " + error);
          return;
        }

        self.groups.remove(element);
      });
    }
  };

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


  self.userTypeaheadUpdater = function(id)
  {
    var userId = this.options.data._id();
    var userData = {};

    for (var n = 0; n < self.users().length; n++)
    {
      if (self.users()[n]._id() === userId)
      {
        userData = ko.mapping.toJS(self.users()[n]);
      }
    }

    if (!userData)
    {
      console.log("No user with id " + userId + " found!");
      return;
    }

    userData._groups = userData._groups || [];

    userData._groups = murrix.addToArray(id, userData._groups);

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

  self.userTypeaheadSource = function(queryString, callback)
  {
    var resultList = [];
    var toString = function() { return this._id(); };
    var currentGroupIds = this.options.data._groups();

    for (var n in self.groups())
    {
      var item = self.groups()[n];
      item.toString = toString;

      if (!murrix.inArray(item._id(), currentGroupIds))
      {
        resultList.push(item);
      }
    }

    return resultList;
  };

  self.userTypeaheadMatcher = function(item)
  {
    return ~item.name().toLowerCase().indexOf(this.query.toLowerCase());
  };

  self.userTypeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    var name = item.name().replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>";
    });

    return "<div>" + name + "</div>";
  };

  self.userEditClicked = function(element)
  {
    murrix.model.dialogModel.userModel.showEdit(element._id(), function()
    {
      self._loadUsers();
    });
  };

  self.userPasswordClicked = function(element)
  {
    if (typeof element._id === "undefined")
    {
      element = murrix.model.currentUser();
    }

    murrix.model.dialogModel.passwordModel.showEdit(element._id(), function()
    {
      self._loadUsers();
    });
  };


  self.userRemoveClicked = function(element)
  {
    if (confirm("Are you sure you want to remove the user!"))
    {
      murrix.server.emit("removeUser", element._id(), function(error)
      {
        if (error)
        {
          console.log("AdminModel: Failed to remove user: " + error);
          return;
        }

        self.users.remove(element);
      });
    }
  };

  self.userRemoveGroupHandler = function(user, groupId)
  {
    userData = ko.mapping.toJS(user);

    userData._groups = userData._groups || [];
    userData._groups = murrix.removeFromArray(groupId, userData._groups);

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


  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.inputRemember = ko.observable(false);
  self.errorText = ko.observable("");
  self.loading = ko.observable(false);

  // TODO: This is ugly, it works, but there must be a better way like an dropdown event
  self.inputUsernameFocusTimer = null;

  self.userMenuClicked = function()
  {
    if (self.inputUsernameFocusTimer)
    {
      clearInterval(self.inputUsernameFocusTimer);
      self.inputUsernameFocusTimer = null;
    }

    if (parentModel.currentUser() === false && !$(".userMenu").is(":visible"))
    {
      self.inputUsernameFocusTimer = setInterval(function()
      {
        if ($(".signInUsername").is(":visible"))
        {
          clearInterval(self.inputUsernameFocusTimer);
          self.inputUsernameFocusTimer = null;

          $(".signInUsername").focus();
        }
      }, 100);
    }
  };

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
