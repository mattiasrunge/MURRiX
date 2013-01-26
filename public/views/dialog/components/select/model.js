
function DialogComponentSelectModel()
{
  var self = this;

  DialogComponentBaseModel(self, "dialogComponentSelectTemplate");

  /* Public observables, disables the component or part of it */
  self.options = ko.observableArray();
  self.value = ko.observable("");

  self.reset = function()
  {
    if (self.options().length > 0)
    {
      self.value(self.options()[0].value);
    }
    else
    {
      self.value("");
    }
  };

  /* Private stuff */
  self.selectHandler = function(data)
  {
    self.value(data.value);
  };

  self.options.subscribe(function(value)
  {
    var defaultValue = "";

    for (var n = value.length - 1; n >= 0; n--)
    {
      defaultValue = value[n].value;

      if (defaultValue === self.value())
      {
        return;
      }
    }

    self.value(defaultValue);
  });
};
