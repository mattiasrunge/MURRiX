
function DialogComponentTextModel()
{
  var self = this;

  DialogComponentBaseModel(self, "dialogComponentTextTemplate");

  /* Public observables, disables the component or part of it */
  self.placeholder = ko.observable("Write something...");
  self.value = ko.observable("");

  self.reset = function()
  {
    self.value("");
  };
}
