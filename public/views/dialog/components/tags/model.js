
function DialogComponentTagsModel()
{
  var self = this;

  DialogComponentBaseModel(self, "dialogComponentTagsTemplate");

  /* Public observables, disables the component or part of it */
  self.value = ko.observableArray();

  self.tagName = ko.observable("");

  self.reset = function()
  {
    self.tagName("");
    self.value([]);
  };

  /* Private stuff */
  self.submitHandler = function()
  {
    self.addHandler(self.tagName());
    self.tagName("");
  };

  self.removeHandler = function(data)
  {
    var index = self.value.indexOf(ko.utils.unwrapObservable(data));

    if (index !== -1)
    {
      self.value.splice(index, 1);
    }
  };

  self.addHandler = function(data)
  {
    if (self.value.indexOf(data) === -1)
    {
      self.value.push(data);
    }
  };
}
