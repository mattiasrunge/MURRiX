
var murrix = {};

murrix.cache = new function()
{
  var self = this;

  self.nodes = {};

  self.addNodeData = function(nodeData)
  {
    if (nodeData === false)
    {
      return false;
    }

    if (!self.nodes[nodeData._id])
    {
      console.log("Could not find mapped index, node is not cached, id " + nodeData._id);

      self.nodes[nodeData._id] = ko.mapping.fromJS(nodeData, NodeMappingInternal);

      self.nodes[nodeData._id].comments.subscribe(function(value)
      {
        value.sort(function(a, b)
        {
          return (b.addedDatetime && a.addedDatetime) ? b.addedDatetime() - a.addedDatetime() : 0;
        });
      });

      self.nodes[nodeData._id].comments.valueHasMutated(); // Force sort!
    }
    else
    {
      console.log("Node " + nodeData._id + " already cached updating cache...");
      ko.mapping.fromJS(nodeData, self.nodes[nodeData._id]);
    }

    return self.nodes[nodeData._id];
  };

  self.getNodes = function(idList, callback)
  {
    var nodeList = {};
    var idRequestList = [];

    for (var n = 0; n < idList.length; n++)
    {
      if (self.nodes[idList[n]])
      {
        nodeList[idList[n]] = self.nodes[idList[n]];
      }
            else
      {
        idRequestList.push(idList[n]);
      }
    }

    if (idRequestList.length === 0)
    {
      callback(null, nodeList);
      return;
    }

    murrix.server.emit("find", { _id: { $in: idRequestList } }, function(error, nodeDataList)
    {
      if (error)
      {
        callback(error, []);
        return;
      }

      for (var id in nodeDataList)
      {
        nodeList[id] = self.addNodeData(nodeDataList[id]);
      }

      callback(null, nodeList);
    });
  };
};




murrix.file = new function()
{
  var self = this;

  self._readChunk = function(file, offset, chunkSize)
  {
    var data = null;

    if (file.slice)
    {
      data = file.slice(offset, offset + Math.min(chunkSize, file.size - offset));
    }
    else if (file.webkitSlice)
    {
      data = file.webkitSlice(offset, offset + Math.min(chunkSize, file.size - offset));
    }
    else if (file.mozSlice)
    {
      data = file.mozSlice(offset, offset + Math.min(chunkSize, file.size - offset));
    }
    else
    {
      return false;
    }
    
    file.reader.readAsBinaryString(data);
    return true;
  };

  self.upload = function(file, callback)
  {
    file.reader = new FileReader();
    
    file.reader.onload = function(event)
    {
      var data = window.btoa(event.target.result); // base64 encode
      
      murrix.server.emit("fileChunk", { id: file.uploadId, data: data }, function(error, id, progress, offset, chunkSize)
      {
        if (error)
        {
          console.log(error);
          murrix.file.reader = null;
          callback(error);
          return;
        }
        
        callback(null, id, progress);
        
        if (progress < 100)
        {
          if (!murrix.file._readChunk(file, offset, chunkSize))
          {
            console.log("Failed to read chunk!");
            callback("Failed to read chunk!"); // TODO: Check this before we start, and tell server on fails so it can clear states
            return;
          }
        }
      });
    };
    
    murrix.server.emit("fileStart", { filename: file.name, size: file.size }, function(error, id, offset, chunkSize)
    {
      file.uploadId = id;
      murrix.file._readChunk(file, offset, chunkSize);
    });
  };
};





murrix.makeArray = function(hash)
{
  var array = [];

  jQuery.each(hash, function(key, value)
  {
    array.push(value);
  });

  return array;
};

murrix.inArray = function(needle, haystack)
{
  for (var n = 0; n < haystack.length; n++)
  {
    if (needle === haystack[n])
    {
      return true;
    }
  }

  return false;
};

murrix.intval = function(value)
{
  var intvalue = value;

  if (typeof value !== "number")
  {
    try
    {
      intvalue = parseInt(value, 10);
    }
    catch (e)
    {
    }
  }

  if (typeof intvalue !== "number" || isNaN(intvalue))
  {
    console.log("Could not convert value to int: \"" + value + "\" (" + (typeof value) + ") -> \"" + intvalue + "\" (" + typeof intvalue + ")");
    intvalue = 0;
  }

  return intvalue;
};

murrix.createPath = function(partIndex, primary, secondary)
{
  var currentPath = document.location.hash;
  var newPath = "";

  var parts = currentPath.split("/");

  if (partIndex > parts.length)
  {
    throw "Supplied partIndex " + partIndex + " is not valid for the current path!";
  }

  while (partIndex >= parts.length)
  {
    parts.push("");
  }

  var args = parts[partIndex].split(":");


  if (secondary === null && args.length > 1 && primary === null)
  {
    secondary = args[1];
  }
  
  if (primary === null)
  {
    primary = args[0];
  }

  parts[partIndex] = primary;

  if (secondary !== null && secondary !== "")
  {
    parts[partIndex] += ":" + secondary;
  }

  parts = parts.slice(0, partIndex + 1);

  newPath = parts.join("/");

  if (newPath.length > 0)
  {
    if (newPath[0] !== "#")
    {
      newPath = "#" + newPath;
    }

    if (newPath[newPath.length - 1] === "/")
    {
      newPath = newPath.substr(0, newPath.length - 1);
    }
  }

  return newPath;
};

murrix.updatePath = function(pathString, pathObservable)
{
  var position = pathString.indexOf("/");
  var result = { primary: { action: "", args: [] }, secondary: "" };

  var primaryString = "";

  if (position === -1)
  {
    primaryString = pathString;
    result.secondary = "";
  }
  else
  {
    primaryString = pathString.substr(0, position);
    result.secondary = pathString.substr(position + 1);
  }

  var primarySplit = primaryString.split(":");

  result.primary.action = primarySplit.shift();
  result.primary.args = primarySplit;

  if (JSON.stringify(result.primary) !== JSON.stringify(pathObservable().primary()))
  {
    //console.log("Updating primary.action, was \"" + pathObservable().primary().action + "\", is \"" + result.primary.action + "\"");
    //console.log("Updating primary.args, was \"" + pathObservable().primary().args.toString() + "\", is \"" + result.primary.args.toString() + "\"");
    pathObservable().primary(result.primary);
  }

  if (result.secondary !== pathObservable().secondary())
  {
    //console.log("Updating secondary, was \"" + pathObservable().secondary() + "\", is \"" + result.secondary + "\"");
    pathObservable().secondary(result.secondary);
  }

  return result;
};




var NodeMappingInternal = {
  description: {
    create: function(options)
    {
      options.parent.descriptionEditing = ko.observable(false);
      options.parent.descriptionOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  },
  name: {
    create: function(options)
    {
      options.parent.nameEditing = ko.observable(false);
      options.parent.nameOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  },
  type: {
    create: function(options)
    {
      options.parent.typeEditing = ko.observable(false);
      options.parent.typeOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  }
};

