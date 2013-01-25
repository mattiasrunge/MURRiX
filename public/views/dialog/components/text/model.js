
function DialogComponentTextModel()
{
  var self = this;

  /* Public observables, disables the component or part of it */
  self.disabled = ko.observable(false); // Disables the whole component, while loading for instance
  self.placeholder = ko.observable("Write something...");
  self.value = ko.observable("");
};
