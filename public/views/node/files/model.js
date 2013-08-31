
var FilesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);
  self.files = ko.observableArray();
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "files"))
    {
      self.show(value.action === "files");
    }
  });

  parentModel.node.subscribe(function(value)
  {
    self.files.removeAll();
    self.loaded(false);

    if (value !== false)
    {
      self.load();
    }
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self.load();
    }
  });

  self.load = function()
  {
    if (self.show() && !self.loaded() && parentModel.node() !== false)
    {
      self.loading(true);

      murrix.server.emit("helper_nodeGetFilesList", { nodeId: parentModel.node()._id() }, function(error, fileList)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        var addFiles = function()
        {
          var list = fileList.splice(0, 50);

          ko.utils.arrayPushAll(self.files, list)

//           for (var n = 0; n < list.length; n++)
//           {
//             self.files.push(list[n]);
//           }

          if (fileList.length > 0)
          {
            setTimeout(function()
            {
              addFiles();
            }, 100);
          }
        };

        console.log("FilesModel: Loaded " + fileList.length + " files!");
        self.loaded(true);
        self.files(fileList);

        //addFiles();
      });
    }
  };
};
