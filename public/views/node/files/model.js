
var FilesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "files"))
    {
      self.show(value.action === "files");
    }
  });

  self.uploadErrorText = ko.observable("");
  self.uploadFiles = ko.observableArray();
  self.uploadComplete = ko.observable(false);

  self.itemDataList = [];

  self._saveFile = function(fileItem, callback)
  {
    murrix.server.emit("createFileItem", { name: fileItem.name(), uploadId: fileItem.uploadId(), parentId: murrix.model.nodeModel.node()._id() }, function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      console.log("Saved item!", itemData);

      self.itemDataList.push(itemData);

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

  self._checkHideRaw = function(rawItemDataList, index)
  {
    if (index >= rawItemDataList.length)
    {
      self.uploadComplete(true);
      return;
    }

    console.log("Will try to hide " + rawItemDataList[index].name);
    murrix.server.emit("hideRaw", rawItemDataList[index], function(error, hidden, itemData)
    {
      console.log(error, hidden, itemData);

      if (error)
      {
        console.log(error);
        return;
      }

      if (hidden)
      {
        console.log(rawItemDataList[index].name + " hidden behind " + itemData.name);
        var item = murrix.cache.addItemData(itemData);
      }
      else
      {
        console.log("Found nowhere to hide " + rawItemDataList[index].name);
        var item = murrix.cache.addItemData(rawItemDataList[index]);
        murrix.model.nodeModel.items.push(item);
      }

      self._checkHideRaw(rawItemDataList, index + 1);
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

    var rawItemDataList = [];

    for (var n = 0; n < self.itemDataList.length; n++)
    {
      if (self.itemDataList[n].exif.MIMEType === "image/x-canon-cr2" || self.itemDataList[n].exif.MIMEType === "image/x-canon-crw")
      {
        rawItemDataList.push(self.itemDataList[n]);
      }
      else
      {
        var item = murrix.cache.addItemData(self.itemDataList[n]);

        murrix.model.nodeModel.items.push(item);
      }
    }

    if (rawItemDataList.length === 0)
    {
      self.uploadComplete(true);
      return;
    }

    self._checkHideRaw(rawItemDataList, 0);
  };

  self.dragDropHandler = function(element, event)
  {
    self.uploadFiles.removeAll();
    self.uploadErrorText("");
    self.uploadComplete(false);
    self.itemDataList = [];

    event.stopPropagation();
    event.preventDefault();

    if (event.originalEvent.dataTransfer.files.length === 0)
    {
      return;
    }

    var uploadFilesRaw = [];

    for (var n = 0; n < event.originalEvent.dataTransfer.files.length; n++)
    {
      if (event.originalEvent.dataTransfer.files[n].type === "")
      {
        continue;
      }

      var uploadFile = {};

      uploadFile.progress = ko.observable(0);
      uploadFile.uploadId = ko.observable(false);
      uploadFile.size = ko.observable(event.originalEvent.dataTransfer.files[n].size);
      uploadFile.name = ko.observable(event.originalEvent.dataTransfer.files[n].name);
      uploadFile.file = event.originalEvent.dataTransfer.files[n];
      uploadFile.statusText = ko.observable("");
      uploadFile.failed = ko.observable(false);

      if (event.originalEvent.dataTransfer.files[n].type === "image/x-canon-cr2" || event.originalEvent.dataTransfer.files[n].type === "image/x-canon-crw")
      {
        uploadFilesRaw.push(uploadFile);
      }
      else
      {
        self.uploadFiles.push(uploadFile);
      }
    }

    for (var n = 0; n < uploadFilesRaw.length; n++)
    {
      self.uploadFiles.push(uploadFilesRaw[n]);
    }

    if (self.uploadFiles().length > 0)
    {
      $("#itemUploadModal").modal({ keyboard: false, backdrop: "static" });

      self._startUpload(null, true);
    }
  };
};
