
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

      if (self.show())
      {
        self.init();
      }
    }
  });
  
  self.enabled = ko.observable(true);

  self.pictures = ko.observableArray([ ]);
  

  parentModel.node.subscribe(function(node)
  {
/*    self.pictures.removeAll();
  
    if (!node)
    {
      console.log("Node is false, not looking for sub files!");
      return;
    }

    node.getLinkedNodes("file", function(resultCode, nodeIdList, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
      }
      else
      {
        self.pictures(nodeList);
      }
    });*/
    /*
    var pictureIdList = [];

    for (var n = 0; n < node.links().length; n++)
    {
      var link = node.links()[n];

      if (link.role() === "file")
      {
        pictureIdList.push(link.node_id());
      }
    }

    if (pictureIdList.length > 0)
    {
      mainModel.dbModel.fetchNodesBuffered(pictureIdList, function(transactionId, resultCode, nodeList)
      {
        if (resultCode != MURRIX_RESULT_CODE_OK)
        {
          console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
        }
        else
        {
          var pictureNodes = [];

          jQuery.each(nodeList, function(id, pictureNode)
          {
            pictureNodes.push(pictureNode);
          });

          self.pictures(pictureNodes);
        }
      });
    }*/
  });

  self.dragStart = function(data, event)
  {
    console.log(data);
    event.originalEvent.dataTransfer.setData('node_id', data.id);
    return true;
  };

  self.init = function()
  {
    var dropElement = document.getElementById("pictures-droptarget");

    console.log(dropElement);

    function noopHandler(evt)
    {
      evt.stopPropagation();
      evt.preventDefault();
    }

    dropElement.addEventListener("dragenter", noopHandler, false);
    dropElement.addEventListener("dragexit", noopHandler, false);
    dropElement.addEventListener("dragover", noopHandler, false);
    dropElement.addEventListener("drop", dropHandler, false);

    function saveFile(index, files)
    {
      if (index >= files.length)
      {
        console.log("All files saved!");
//        murrix.model.nodeModel.loadFiles();
        return;
      }

      murrix.model.server.emit("createFile", { name: files[index].name, uploadId: files[index].uploadId, parentId: murrix.model.nodeModel.node()._id() }, function(error, fileNodeData, parentNodeData)
      {
        if (error)
        {
          console.log(error);
          console.log("Failed to save file node!");
          return;
        }

        console.log("Saved node!");
        var fileNode = murrix.model.cacheNode(fileNodeData);
        murrix.model.cacheNode(parentNodeData); // TODO: Is there any point to this?

        // TODO: this may be a hack...
        murrix.model.nodeModel.fileNodes.push(fileNode);

        saveFile(index + 1, files);
      });
    }


    function uploadFile(index, files)
    {
      if (index >= files.length)
      {
        console.log("All files uploaded!");

        saveFile(0, files);

        return;
      }

      murrix.file.upload(files[index], function(error, id, progress)
      {
        if (error)
        {
          console.log(error);
          console.log("Failed to upload files!");
          return;
        }

        console.log("Upload " + id + " at " + progress + "%");

        if (progress === 100)
        {
          console.log("Upload " + id + " complete!");

          files[index].uploadId = id;

          uploadFile(index + 1, files);
        }
      });
    }
 
    function dropHandler(event)
    {
      event.stopPropagation();
      event.preventDefault();
 
      if (event.dataTransfer.files.length === 0)
      {
        return false;
      }

      uploadFile(0, event.dataTransfer.files);
 
      return false;
    }
  };
};

 
