
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
        self.currentUser(ko.mapping.fromJS(userData));
      }
    }
    else
    {
      if (userData === false)
      {
        self.currentUser(userData);
      }
      else
      {
        ko.mapping.fromJS(userData, self.currentUser);
      }
    }
  };
    
  self.adminModel = new AdminModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.welcomeModel = new WelcomeModel(self);
  self.newsModel = new NewsModel(self);
  self.mapModel = new MapModel(self);

  return this;
}();
