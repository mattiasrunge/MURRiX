
var PicturesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "pictures"; });
  self.enabled = ko.observable(true);

  self.pictures = ko.observableArray([ ]);
  

  parentModel.node.subscribe(function(node)
  {
    self.pictures.removeAll();
  
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
    });
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
  }

  $("#pictures-droptarget").get(0).addEventListener("dragover", function(event)
  {
    event.stopPropagation();
    event.preventDefault();
    return false;
    
  }, true);


  $("#pictures-droptarget").get(0).addEventListener("drop", function(event)
  {
    event.stopPropagation();
    event.preventDefault();

    if (event.dataTransfer.files.length == 0)
    {
      return false;
    }

    self.uploadDroppedFiles(0, event.dataTransfer.files, function(resultCode)
    {
      console.log(resultCode);

      $.murrix.module.db.fetchNodesBuffered([ parentModel.primaryNodeId() ], function(transactionId, resultCode, nodeList)
      {
        if (resultCode != MURRIX_RESULT_CODE_OK)
        {
          console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
        }
        else
        {
          console.log("TODO: We should now reload node");
          //parentModel.currentNode(nodeList[parentModel.primaryNodeId()]);
        }
      });
    });

  }, false);

  self.uploadDroppedFiles = function(index, files, callback)
  {
     self.uploadDroppedFile(files[index], function(result_code)
    {
      if (index + 1 < files.length)
      {
        self.uploadDroppedFiles(index + 1, files, callback);
      }
      else
      {
        callback(result_code);
      }
    });
  };

  self.uploadDroppedFile = function(file, callback)
  {
    var uploader = new $.murrix.lib.fileUploader(file);

    uploader.bind("progress", function(uploader)
    {
      console.log("load progress: " + Math.round(uploader.getLoadedSize() / uploader.getFile().getSize() * 100) + "%");
      console.log("upload progress: " + Math.round(uploader.getUploadedSize() / uploader.getFile().getSize() * 100) + "%>");
      console.log("total progress: " + Math.round((uploader.getLoadedSize() + uploader.getUploadedSize()) / (uploader.getFile().getSize() * 2) * 100) + "%");
    });

    uploader.bind("error", function(uploader)
    {
      console.log("error");
    });

    uploader.bind("complete", function(file, metadata, result_code)
    {
      if (MURRIX_RESULT_CODE_OK != result_code)
      {
        console.log("upload failed!");

        callback(result_code);
      }
      else
      {
        console.log("upload complete!");

        $.murrix.module.db.createNodeFromFile(file.getUploadId(), file.getFile().getName(), file.getFile().getSize(), metadata, function(transaction_id, result_code, node_data)
        {
          if (MURRIX_RESULT_CODE_OK == result_code)
          {
            $.murrix.module.db.linkNodes(parentModel.primaryNodeId(), node_data.id, "file", function(transaction_id, result_code, node_up, node_down, role)
            {
              callback(result_code);
            });
            console.log(node_data);
          }
          else
          {
            console.log("failed:" + result_code);
          }

          callback(result_code);
        });
      }
    });

    uploader.start();

  };
};

 
