
murrix.model = function()
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });

  self.userModel = new UserModel(self);
  self.adminModel = new AdminModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.homeModel = new HomeModel(self);

  return this;
}();
