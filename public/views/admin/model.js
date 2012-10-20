
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
};