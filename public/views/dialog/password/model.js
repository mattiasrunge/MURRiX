
function DialogPasswordModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogPassword");

  self.errorText = ko.observable("");
  self.disabled = ko.observable(false);

  self.id = ko.observable(false);

  self.password1 = ko.observable("");
  self.password2 = ko.observable("");

  self.reset = function()
  {
    self.id(false);
    self.errorText("");
    self.disabled(false);
    self.password1("");
    self.password2("");

    self.finishCallback = null;
  };

  self.finishCallback = null;

  self.showEdit = function(id, callback)
  {
    self.reset();

    self.finishCallback = callback;

    self.errorText("");
    self.id(id);

    self.show();
  };

  self.saveHandler = function(callback)
  {
    if (self.password1() === "")
    {
      self.errorText("Can not save with an empty password!");
      return;
    }

    if (self.password2() !== self.password1())
    {
      self.errorText("Password must match!");
      return;
    }

    self.errorText("");
    self.disabled(true);

    murrix.server.emit("changePassword", { id: self.id(), password: self.password1() }, function(error)
    {
      self.disabled(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      if (self.finishCallback)
      {
        self.finishCallback();
      }

      self.reset();
      self.hide();

      $.cookie("userinfo", null, { path: "/" });
    });
  };
}
