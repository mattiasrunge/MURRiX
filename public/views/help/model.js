
var HelpModel = function(parentModel)
{
  var self = this;

  self.show = ko.observable(false);
  self.chapter = ko.observable("overview");

  self.hideClicked = function()
  {
    self.show(false);
  };

  self.showClicked = function()
  {
    self.showChapter("overview");
  };

  self.showChapter = function(name)
  {
    self.show(true);

    self.chapter(name);
  };
};
