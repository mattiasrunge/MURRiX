
function DialogComponentSelectModel()
{
  var self = this;

  /* Public observables, disables the component or part of it */
  self.disabled = ko.observable(false); // Disables the whole component, while loading for instance
  self.options = ko.observableArray();
  self.value = ko.observable("");

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
