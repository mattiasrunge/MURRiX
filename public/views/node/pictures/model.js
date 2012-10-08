
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

    murrix.model.server.emit("createFile", { name: self.uploadedFiles[index].name, uploadId: self.uploadedFiles[index].uploadId, parentId: self.uploadedFiles[index].parentId }, function(error, fileNodeData, parentNodeData)
    {
      if (error)
      {
        console.log(self.uploadedFiles);
        console.log(error);
        console.log("Failed to save file node!");
        return;
      }

      console.log("Saved node!");
      var fileNode = murrix.model.cacheNode(fileNodeData);
      murrix.model.cacheNode(parentNodeData); // TODO: Is there any point to this?

      // TODO: this may be a hack...
      murrix.model.nodeModel.fileNodes.push(fileNode);

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

  self.dragNoopHandler = function(element, event)
  {
    event.stopPropagation();
    event.preventDefault();
  };

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
