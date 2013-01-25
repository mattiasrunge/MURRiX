
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

function DialogModel()
{
  var self = this;
  
  self.exampleModel = new DialogExampleModel();
};
