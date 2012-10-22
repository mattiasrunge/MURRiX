
var ContentModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "content"))
    {
      self.show(value.action === "content");
    }
  });

  self.uploadErrorText = ko.observable("");
  self.uploadFiles = ko.observableArray();
  self.uploadComplete = ko.observable(false);
  
  self._saveFile = function(fileItem, callback)
  {
    murrix.server.emit("createFileItem", { name: fileItem.name(), uploadId: fileItem.uploadId(), parentId: murrix.model.nodeModel.node()._id() }, function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      console.log("Saved item!");
      var item = murrix.cache.addItemData(itemData);

      // TODO: this may be a hack...
      murrix.model.nodeModel.items.push(item);

      callback(null);
    });
  };

  self._uploadFile = function(callback)
  {
    var index = false;

    for (var n = 0; n < self.uploadFiles().length; n++)
    {
      console.log(self.uploadFiles()[n].progress() === 0);
      if (!self.uploadFiles()[n].failed() && self.uploadFiles()[n].progress() === 0)
      {
        index = n;
        break;
      }
    }

    if (index === false)
    {
      console.log("All files done!");
      callback(null, false);
      return;
    }

    murrix.file.upload(self.uploadFiles()[index].file, function(error, id, progress)
    {
      if (error)
      {
        self.uploadFiles()[index].statusText(error);
        self.uploadFiles()[index].failed(true);
        callback(error, true);
        return;
      }

      console.log("Upload " + id + "(index " + index + ") at " + progress + "%");
      self.uploadFiles()[index].uploadId(id);
      self.uploadFiles()[index].progress(progress);

      if (progress === 100)
      {
        console.log("Upload " + id + " complete!");

        self._saveFile(self.uploadFiles()[index], function(error)
        {
          if (error)
          {
            self.uploadFiles()[index].statusText(error);
            self.uploadFiles()[index].failed(true);
            callback(error, true);
            return;
          }

          self.uploadFiles()[index].statusText("File item created!");
          callback(null, true);
        });
      }
    });
  };


  self._startUpload = function(error, notDone)
  {
    if (error)
    {
      // TODO: Should we continue?
    }

    if (notDone)
    {
      self._uploadFile(function(error, notDone) { self._startUpload(error, notDone) });
      return;
    }

    self.uploadComplete(true);
  };

  self.dragDropHandler = function(element, event)
  {
    self.uploadFiles.removeAll();
    self.uploadErrorText("");
    self.uploadComplete(false);
    
    event.stopPropagation();
    event.preventDefault();

    for (var n = 0; n < event.originalEvent.dataTransfer.files.length; n++)
    {
      var uploadFile = {};
      
      uploadFile.progress = ko.observable(0);
      uploadFile.uploadId = ko.observable(false);
      uploadFile.size = ko.observable(event.originalEvent.dataTransfer.files[n].size);
      uploadFile.name = ko.observable(event.originalEvent.dataTransfer.files[n].name);
      uploadFile.file = event.originalEvent.dataTransfer.files[n];
      uploadFile.statusText = ko.observable("");
      uploadFile.failed = ko.observable(false);

      self.uploadFiles.push(uploadFile);
    }

    $("#itemUploadModal").modal({ keyboard: false, backdrop: "static" });

    self._startUpload(null, true);
  };
};
