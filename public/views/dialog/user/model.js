
function DialogUserModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogUser");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.name = ko.observable("");

  self.username = ko.observable("");

  self.personModel = new DialogComponentNodeListModel(self);
  self.personModel.max(1);
  self.personModel.types([ "person" ]);

  self.reset = function()
  {
    var tabElements = $(self.elementId).find("ul.nav-tabs li");
    var tabPanes = $(self.elementId).find("div.tab-pane");

    tabElements.removeClass("active");
    tabPanes.removeClass("active");

    $(tabElements[0]).addClass("active");
    $(tabPanes[0]).addClass("active");

    self.id(false);
    self.errorText("");
    self.disabled(false);
    self.name("");
    self.username("");
    self.personModel.reset();

    self.finishCallback = null;
  };

  self.disabled.subscribe(function(value)
  {
    self.personModel.disabled(value);
  });

  self.finishCallback = null;

  self.showCreate = function(callback)
  {
    self.reset();

    self.finishCallback = callback;

    self.disabled(false);
    self.show();
  };

  self.showEdit = function(id, callback)
  {
    self.reset();

    self.finishCallback = callback;

    self.errorText("");
    self.disabled(true);
    self.id(id);

    self.show();

    murrix.cache.getUser(id, function(error, user)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      var userData = ko.mapping.toJS(user);

      self.id(userData._id);
      self.name(userData.name);
      self.username(userData.username);

      if (userData._person && userData._person !== false)
      {
        self.personModel.value([ userData._person ]);
      }
    });
  };

  self.saveNode = function(userData)
  {
    if (self.id() !== false)
    {
      userData._id = self.id();
    }

    userData.name = self.name();
    userData.username = self.username();
    userData._person = false;

    if (self.personModel.value().length > 0)
    {
      userData._person = self.personModel.value()[0];
    }

    self.errorText("");
    self.disabled(true);

    murrix.server.emit("saveUser", userData, function(error, userDataNew)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      console.log("Saved node!", userDataNew);
      var node = murrix.cache.addUserData(userDataNew);

      if (self.finishCallback)
      {
        self.finishCallback(node);
      }

      self.reset();
      self.hide();
    });
  };

  self.saveHandler = function(callback)
  {
    if (self.name() === "")
    {
      self.errorText("Can not save with an empty name!");
      return;
    }

    if (self.username() === "")
    {
      self.errorText("Can not save with an empty username!");
      return;
    }

    self.errorText("");
    self.disabled(true);

    if (self.id() !== false)
    {
      murrix.cache.getUser(self.id(), function(error, user)
      {
        self.disabled(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        var userData = ko.mapping.toJS(user);

        self.saveNode(userData);
      });
    }
    else
    {
      self.saveNode({});
    }
  };
}
