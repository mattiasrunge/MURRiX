
var HomeViewModel = function(parentViewModel)
{
  var self = this;

  self.show = ko.computed(function() { return parentViewModel.currentView() === ""; });

  self.hideClicked = function()
  {
    document.location.hash = "none";
    return false;
  };
};
