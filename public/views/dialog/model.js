
function DialogBaseModel(self, elementId)
{
  self.elementId = elementId;
  self.visible = ko.observable(false);

  $(self.elementId).on("shown", function()
  {
    self.visible(true);
  });

  $(self.elementId).on("hidden", function()
  {
    self.visible(false);
  });

  self.show = function()
  {
    $(self.elementId).modal("show");
  };

  self.hide = function()
  {
    $(self.elementId).modal("hide");
  };
};

function DialogComponentBaseModel(self, template)
{
  self.template = ko.observable(template);
  self.disabled = ko.observable(false);
};

function DialogModel()
{
  var self = this;

  self.exampleModel = new DialogExampleModel();
  self.textItemModel = new DialogTextItemModel();
  self.personNodeModel = new DialogPersonNodeModel();
  self.albumNodeModel = new DialogAlbumNodeModel();
  self.locationNodeModel = new DialogLocationNodeModel();
};
