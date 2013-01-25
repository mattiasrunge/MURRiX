
function DialogBaseModel(self, name)
{
  self.name = name;
  self.visible = ko.observable(false);

  $(self.name).on("shown", function()
  {
    self.visible(true);
  });

  $(self.name).on("hidden", function()
  {
    self.visible(false);
  });

  self.show = function()
  {
    $(self.name).modal("show");
  };

  self.hide = function()
  {
    $(self.name).modal("hide");
  };
};

function DialogExampleModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogExample");

  self.positionModel = new DialogComponentPositionModel(self);
  self.datetimeModel = new DialogComponentDatetimeModel(self);

  self.datetimeModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });

  self.positionModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });
};