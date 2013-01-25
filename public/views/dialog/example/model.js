
function DialogExampleModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogExample");

  self.nodeListModel = new DialogComponentNodeListModel(self);
  self.positionModel = new DialogComponentPositionModel(self);
  self.datetimeModel = new DialogComponentDatetimeModel(self);
  self.textModel = new DialogComponentTextModel(self);
  self.selectModel = new DialogComponentSelectModel(self);
  self.selectModel.options([
    { name: "Option #1", value: "option1", description: "This is the first option!" },
    { name: "Option #2", value: "option2", description: "" },
    { name: "Option #3", value: "option3", description: "This is the third option!" }
  ]);

  self.textModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });

  self.datetimeModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });

  self.positionModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });

  self.nodeListModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });

  self.selectModel.value.subscribe(function(value)
  {
    console.log("value", value);
  });
};