
var PicturesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "pictures"))
    {
      self.show(value.action === "pictures");
    }
  });
  
  self.enabled = ko.observable(true);

  self.uploadFiles = [];
  self.uploadedFiles = [];

  function saveFile(index)
  {
    if (index >= self.uploadedFiles.length)
    {
      console.log("All files saved!");
      self.uploadedFiles = [];
//        murrix.model.nodeModel.loadFiles();
      return;
    }

    murrix.server.emit("createFileItem", { name: self.uploadedFiles[index].name, uploadId: self.uploadedFiles[index].uploadId, parentId: self.uploadedFiles[index].parentId }, function(error, itemData)
    {
      if (error)
      {
        console.log(self.uploadedFiles);
        console.log(error);
        console.log("Failed to save file item!");
        return;
      }

      console.log("Saved item!");
      var item = murrix.cache.addItemData(itemData);

      // TODO: this may be a hack...
      murrix.model.nodeModel.items.push(item);

      saveFile(index + 1);
    });
  }


  function uploadFile(index)
  {
    if (index >= self.uploadFiles.length)
    {
      console.log("All files uploaded!");

      self.uploadFiles = [];

      saveFile(0);

      return;
    }

    murrix.file.upload(self.uploadFiles[index], function(error, id, progress)
    {
      if (error)
      {
        console.log(error);
        console.log("Failed to upload files!");
        return;
      }

      console.log("Upload " + id + "(index " + index + ") at " + progress + "%");

      if (progress === 100)
      {
        console.log("Upload " + id + " complete!");

        self.uploadedFiles.push({ name: self.uploadFiles[index].name, uploadId: id, parentId: murrix.model.nodeModel.node()._id() });

        uploadFile(index + 1);
      }
    });
  }

  self.dragDropHandler = function(element, event)
  {
    event.stopPropagation();
    event.preventDefault();

    if (event.originalEvent.dataTransfer.files.length === 0)
    {
      return false;
    }

    self.uploadFiles = event.originalEvent.dataTransfer.files;
    uploadFile(0);

    return false;
  };
};
