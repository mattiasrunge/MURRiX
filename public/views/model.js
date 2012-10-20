
murrix.model = function()
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "invalid", args: [] }), secondary: ko.observable("") });

  self.userModel = new UserModel(self);
  self.adminModel = new AdminModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.welcomeModel = new WelcomeModel(self);
  self.newsModel = new NewsModel(self);
  self.mapModel = new MapModel(self);

  return this;
}();
