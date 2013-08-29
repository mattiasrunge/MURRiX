
function DialogDownloadModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogDownload");

  self.loading = ko.observable(false);
  self.archiveId = ko.observable(false);
  self.errorText = ko.observable("");

  self.create = function()
  {
    self.loading(true);
    self.errorText("");

    murrix.server.emit("helper_nodePrepareDownload", { nodeId: murrix.model.nodeModel.node()._id() }, function(error, archiveId)
    {
      self.loading(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      self.archiveId(archiveId);
    });
  };

  $(self.elementId).on("hidden.bs.modal", function()
  {
    self.loading(false);
    self.archiveId(false);
    self.errorText("");
  });
}
