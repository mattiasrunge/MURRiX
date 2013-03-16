
function DialogUploadModel()
{
  var self = this;

  DialogBaseModel(self, "#dialogUpload");

  self.pause = ko.observable(false);
  self.files = ko.observableArray();
  self.speed = ko.observable(0);
  self.hasChanged = ko.observable(false);

  self.progress = ko.computed(function()
  {
    var progress = 0;

    for (var n = 0; n < self.files().length; n++)
    {
      progress += self.files()[n].progress() / self.files().length;
    }

    return Math.ceil(progress);
  });

  self.index = ko.computed(function()
  {
    var index = self.files().length;

    for (var n = 0; n < self.files().length; n++)
    {
      if (self.files()[n].status() === "queued")
      {
        index = n;
        break;
      }

      if (self.files()[n].status().indexOf("failed") !== -1)
      {
        index = n;
        break;
      }

      if (self.files()[n].status() === "uploading" ||
          self.files()[n].status() === "importing" ||
          self.files()[n].status() === "hiding")
      {
        index = n;
        break;
      }
    }

    return index;
  });

  self.status = ko.computed(function()
  {
    var status = "success";

    for (var n = 0; n < self.files().length; n++)
    {
      if (self.files()[n].status() === "queued")
      {
        status = "queued";
        continue;
      }

      if (self.files()[n].status().indexOf("failed") !== -1)
      {
        status = "failed";
        break;
      }

      if (self.files()[n].status() === "uploading" ||
          self.files()[n].status() === "importing" ||
          self.files()[n].status() === "hiding")
      {
        status = "uploading";
        break;
      }
    }

    return status;
  });

  self.size = ko.computed(function()
  {
    var size = 0;

    for (var n = 0; n < self.files().length; n++)
    {
      size += self.files()[n].size();
    }

    return size;
  });

  self.dropEventHandler = function(element, event)
  {
    event.stopPropagation();
    event.preventDefault();

    for (var n = 0; n < event.originalEvent.dataTransfer.files.length; n++)
    {
      var fileItem = event.originalEvent.dataTransfer.files[n];

      if (fileItem.type === "")
      {
        console.log("Can not handle files without a MIMEType", fileItem);
        continue;
      }

      var file = {};
      file.file = fileItem;
      file.id = false;
      file.progress = ko.observable(0);
      file.size = ko.observable(fileItem.size);
      file.name = ko.observable(fileItem.name);
      file.type = ko.observable(fileItem.type);
      file.isRaw = murrix.mimeIsRawImage(fileItem.type);
      // queued, uploading, importing, hiding, hide_failed, hide_success, upload_failed, import_failed, import_success
      file.status = ko.observable("queued");

      self.files.push(file);
    }

    if (self.files().length === 0)
    {
      console.log("No files queued, doing nothing...");
      return;
    }

    self.files.sort(function(a, b)
    {
      if (a.isRaw && !b.isRaw)
      {
        return 1;
      }
      else if (!a.isRaw && b.isRaw)
      {
        return -1;
      }

      return 0;
    });

    self.show();
  };

  self.doPause = function()
  {
    self.pause(true);
  }

  self.doUpload = function()
  {
    var index = self.index();

    self.pause(false);

    if (index >= self.files().length)
    {
      console.log("All files are done!");
      return;
    }

    self.speed(0);
    self.files()[index].status("uploading");
    self.files()[index].progress(0);

    murrix.file.upload(self.files()[index].file, function(error, id, progress, speed)
    {
      if (error)
      {
        console.log("Upload failed, reason: " + error, self.files()[index].file);
        self.files()[index].status("upload_failed");
        return;
      }

      self.speed(speed);
      self.files()[index].id = id;
      self.files()[index].progress(progress);

      if (progress === 100)
      {
        if (self.files()[index].isRaw)
        {
          self._doHide(self.files()[index]);
        }
        else
        {
          self._doImport(self.files()[index]);
        }
      }
    });
  };

  self._doHide = function(file)
  {
    file.status("hiding");

    var name = murrix.basename(file.name());
    var query = {};

    query.$and = [ { name: { $regex: "^" + name + "[.]", $options: "-i" } }, { name: { $ne: file.name() } } ];
    query._parents = [ murrix.model.nodeModel.node()._id() ];

    murrix.server.emit("find", { query: query, options: "items" }, function(error, itemDataList)
    {
      if (error)
      {
        console.log("Could not query for item, reason: " + error);
        file.status("hide_failed");
        return;
      }

      if (itemDataList.length === 0)
      {
        console.log("Found nowhere to hide " + file.name() + ", will import instead!");
        self._doImport(file);
        return;
      }

      murrix.server.emit("importUploadedFileVersion", { uploadId: file.id, itemId: itemDataList[0]._id }, function(error, itemDataNew)
      {
        if (error)
        {
          console.log("Could not hide file, reason: " + error);
          file.status("hide_failed");
          return;
        }

        console.log(file.name() + " hidden successfully behind " + itemDataNew.name + "!");
        murrix.cache.addItemData(itemDataNew);
        self.hasChanged(true);
        file.status("hide_success");

        if (!self.pause())
        {
          self.doUpload();
        }
      });
    });
  };

  self._doImport = function(file)
  {
    file.status("importing");

    murrix.server.emit("importUploadedFile", { uploadId: file.id, parentId: murrix.model.nodeModel.node()._id() }, function(error, itemDataNew)
    {
      if (error)
      {
        console.log("Could not import file, reason: " + error);
        file.status("import_failed");
        return;
      }

      console.log(file.name() + " imported successfully!");
      murrix.cache.addItemData(itemDataNew);
      self.hasChanged(true);
      file.status("import_success");

      if (!self.pause())
      {
        self.doUpload();
      }
    });
  };

  $(self.elementId).on("hidden", function()
  {
    self.files.removeAll();
    self.speed(0);

    if (self.hasChanged())
    {
      murrix.model.nodeModel.loadNode();
      self.hasChanged(false);
    }
  });
};