
murrix.model = function()
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "invalid", args: [] }), secondary: ko.observable("") });

  self.currentUser = ko.observable(false);

  self.setCurrentUserData = function(userData)
  {
    if (self.currentUser() === false)
    {
      if (userData !== false)
      {
        murrix.cache.clear();
        self.currentUser(ko.mapping.fromJS(userData));
      }
    }
    else
    {
      if (userData === false)
      {
        murrix.cache.clear();
        self.currentUser(userData);
      }
      else
      {
        murrix.cache.clear();
        ko.mapping.fromJS(userData, self.currentUser);
      }
    }
  };

  self.dummySubmit = function() {};

  self.randomClicked = function()
  {
    murrix.server.emit("findRandom", "nodes", function(error, nodeData)
    {
      if (error)
      {
        console.log(error); // TODO: Display this to the user somehow
        return;
      }

      murrix.cache.addNodeData(nodeData);

      document.location.hash = "node:" + nodeData._id;
    });
  };

  $("form.modal").on("show", function(form)
  {
    //murrix.resetForm(form.target);
  });

  $("form.modal").on("shown", function(form)
  {
    $(form.target).find("input, textarea, select").get(0).focus();
  });

  $("form.modal").on("hidden", function(form)
  {
    murrix.resetForm(form.target);
  });

  self.adminModel = new AdminModel(self);
  self.configModel = new ConfigModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.welcomeModel = new WelcomeModel(self);
  self.newsModel = new NewsModel(self);
  self.mapModel = new MapModel(self);

  return this;
}();
