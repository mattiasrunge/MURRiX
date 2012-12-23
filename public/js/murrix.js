
var murrix = {};

murrix.cache = new function()
{
  var self = this;

  self.nodes = {};
  self.items = {};
  self.groups = {};
  self.users = {};

  self.clear = function()
  {
    self.nodes = {};
    self.items = {};
    self.groups = {};
    self.users = {};
  };

  self.addNodeData = function(nodeData)
  {
    if (nodeData === false)
    {
      return false;
    }

    if (!self.nodes[nodeData._id])
    {
      console.log("Could not find mapped index, node is not cached, id " + nodeData._id);

      self.nodes[nodeData._id] = ko.mapping.fromJS(nodeData);

      if (self.nodes[nodeData._id].comments)
      {
        self.nodes[nodeData._id].comments.subscribe(function(value)
        {
          value.sort(function(a, b)
          {
            return b.added.timestamp() - a.added.timestamp();
          });
        });

        self.nodes[nodeData._id].comments.valueHasMutated(); // Force sort!
      }

      self.nodes[nodeData._id].hasAdminAccess = function()
      {
        if (murrix.model.currentUser() === false)
        {
          console.log("No user, no admin access");
          return false;
        }

        if (murrix.model.currentUser().admin() === true)
        {
          console.log("User is admin, admin access");
          return true;
        }

        if (murrix.model.currentUser()._id() === this._id())
        {
          console.log("Node is current user, admin access");
          return true;
        }

        if (murrix.model.currentUser()._id() === this.added._by())
        {
          console.log("Node added by user, admin access");
          return true;
        }

        var intersection = this._admins().filter(function(n)
        {
          return murrix.model.currentUser()._groups().indexOf(n) !== -1;
        });

        console.log("Group intersection length is " + intersection.length + ", admin access");

        return intersection.length > 0;
      };

      self.nodes[nodeData._id].hasReadAccess = function()
      {
        if (this.public() === true)
        {
          console.log("Node is public, read access");
          return true;
        }

        if (this.hasAdminAccess())
        {
          console.log("Admin access, read access");
          return true;
        }

        var intersection = this._readers().filter(function(n)
        {
          return murrix.model.currentUser()._groups().indexOf(n) !== -1;
        });

        console.log("Group intersection length is " + intersection.length + ", read access");

        return intersection.length > 0;
      };
    }
    else
    {
      console.log("Node " + nodeData._id + " already cached updating cache...");

      var hassubscribed = self.nodes[nodeData._id].comments ? true : false;

      ko.mapping.fromJS(nodeData, self.nodes[nodeData._id]);

      if (!hassubscribed)
      {
        if (self.nodes[nodeData._id].comments)
        {
          self.nodes[nodeData._id].comments.subscribe(function(value)
          {
            value.sort(function(a, b)
            {
              return b.added.timestamp() - a.added.timestamp();
            });
          });

          self.nodes[nodeData._id].comments.valueHasMutated(); // Force sort!
        }
      }
    }

    return self.nodes[nodeData._id];
  };

  self.extendItem = function(id)
  {
    if (self.items[id].comments)
    {
      self.items[id].comments.subscribe(function(value)
      {
        value.sort(function(a, b)
        {
          return b.added.timestamp() - a.added.timestamp();
        });
      });

      self.items[id].comments.valueHasMutated(); // Force sort!
    }

    if (self.items[id].showing)
    {
      self.items[id].showing.subscribe(function(value)
      {
        value.sort(function(a, b)
        {
          return (b.x && a.x) ? a.x() - b.x() : 0;
        });
      });

      self.items[id].showing.valueHasMutated(); // Force sort!
    }


    self.items[id]._with = self.items[id]._with || ko.observable(false);
    self.items[id].with = ko.observable(false);

    ko.dependentObservable(function()
    {
      if (!self.items[id]._with || self.items[id]._with() === false)
      {
        self.items[id].with(false);
        return;
      }

      murrix.cache.getNode(self.items[id]._with(), function(error, node)
      {
        if (error)
        {
          console.log(error);
          self.items[id].with(false);
          return;
        }

        self.items[id].with(node);
      });
    });


    self.items[id]._who = self.items[id]._who || ko.observable(false);
    self.items[id].who = ko.observable(false);

    ko.dependentObservable(function()
    {
      if (!self.items[id]._who || self.items[id]._who() === false)
      {
        self.items[id].who(false);
        return;
      }

      murrix.cache.getNode(self.items[id]._who(), function(error, node)
      {
        if (error)
        {
          console.log(error);
          self.items[id].who(false);
          return;
        }

        self.items[id].who(node);
      });
    });


    self.items[id].where = self.items[id].where || ko.observable({});
    self.items[id].whereString = ko.observable(false);
    self.items[id].whereNode = ko.observable(false);

    ko.dependentObservable(function()
    {
      if (self.items[id].where)
      {
        if (self.items[id].where._id && self.items[id].where._id() !== false)
        {
          murrix.cache.getNode(self.items[id].where._id(), function(error, node)
          {
            if (error)
            {
              console.log(error);
              self.items[id].whereString(false)
              self.items[id].whereNode(false);
              return;
            }

            self.items[id].whereNode(node);
          });

          return;
        }
        else if (self.items[id].where.latitude && self.items[id].where.latitude() !== false)
        {
          // TODO: Look in our own database first and use google as a fallback if nothing is found

          var options = {};

          options.sensor = false;
          options.latlng = self.items[id].where.latitude() + "," + self.items[id].where.longitude();

          jQuery.getJSON("http://maps.googleapis.com/maps/api/geocode/json", options, function(data)
          {
            if (data.status !== "OK" || data.results.length === 0)
            {
              console.log("Could not lookup position at google", options, data);
              self.items[id].whereString(false);
              self.items[id].whereNode(false);
              return;
            }

            self.items[id].whereString(data.results[0].formatted_address);
            self.items[id].whereNode(false);
          });

          return;
        }
      }

      // If nothing else reset
      self.items[id].whereString(false);
      self.items[id].whereNode(false);
    });


    self.items[id].when = self.items[id].when || ko.observable({});
    self.items[id].whenTimestamp = ko.observable(false);

    ko.dependentObservable(function()
    {
      if (!self.items[id].when || !self.items[id].when.timestamp)
      {
        self.items[id].whenTimestamp(false);
        return;
      }

      if (self.items[id].with && self.items[id].with() !== false &&
          self.items[id].with().specific && self.items[id].with().specific.whenOffsets)
      {
        var index = self.items[id].with().specific.whenOffsets().length === 0 ? -1 : 0; // First is default if one exists

        if (self.items[id].when._syncId && self.items[id].when._syncId() !== false)
        {
          for (var n = 0; n < self.items[id].with().specific.whenOffsets().length; n++)
          {
            if (self.items[id].with().specific.whenOffsets()[n]._id() === self.items[id].when._syncId())
            {
              index = n;
              break;
            }
          }
        }

        if (index >= 0)
        {

          self.items[id].whenTimestamp(self.items[id].when.timestamp() + self.items[id].with().specific.whenOffsets()[index].value());
          return;
        }
      }

      self.items[id].whenTimestamp(self.items[id].when.timestamp());
    });
  };

  self.addItemData = function(itemData)
  {
    if (itemData === false)
    {
      return false;
    }

    itemData.comments = itemData.comments || [];

    if (!self.items[itemData._id])
    {
      console.log("Could not find mapped index, item is not cached, id " + itemData._id);

      self.items[itemData._id] = ko.mapping.fromJS(itemData);

      self.extendItem(itemData._id);
    }
    else
    {
      console.log("Item " + itemData._id + " already cached updating cache...");

      var hassubscribed = self.items[itemData._id].comments ? true : false;

      ko.mapping.fromJS(itemData, self.items[itemData._id]);

      if (!hassubscribed)
      {
        self.extendItem(itemData._id);
      }
    }

    return self.items[itemData._id];
  };

  self.addGroupData = function(groupData)
  {
    if (groupData === false)
    {
      return false;
    }

    if (!self.groups[groupData._id])
    {
      console.log("Could not find mapped index, group is not cached, id " + groupData._id);

      self.groups[groupData._id] = ko.mapping.fromJS(groupData);
    }
    else
    {
      console.log("Group " + groupData._id + " already cached updating cache...");

      ko.mapping.fromJS(groupData, self.groups[groupData._id]);
    }

    return self.groups[groupData._id];
  };

  self.addUserData = function(userData)
  {
    if (userData === false)
    {
      return false;
    }

    if (!self.users[userData._id])
    {
      console.log("Could not find mapped index, user is not cached, id " + userData._id);

      self.users[userData._id] = ko.mapping.fromJS(userData);
    }
    else
    {
      console.log("User " + userData._id + " already cached updating cache...");

      ko.mapping.fromJS(userData, self.users[userData._id]);
    }

    return self.users[userData._id];
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

    murrix.server.emit("find", { query: { _id: { $in: idRequestList } }, options: "nodes" }, function(error, nodeDataList)
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

  self.getNode = function(id, callback)
  {
    murrix.cache.getNodes([ id ], function(error, nodeList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (nodeList.length === 0 || !nodeList[id])
      {
        callback("No results returned, you probably do not have rights to this node!");
        return;
      }

      callback(null, nodeList[id]);
    });
  };

  self.getItems = function(idList, callback)
  {
    var itemList = {};
    var idRequestList = [];

    for (var n = 0; n < idList.length; n++)
    {
      if (self.items[idList[n]])
      {
        itemList[idList[n]] = self.items[idList[n]];
      }
      else
      {
        idRequestList.push(idList[n]);
      }
    }

    if (idRequestList.length === 0)
    {
      callback(null, itemList);
      return;
    }

    murrix.server.emit("find", { query: { _id: { $in: idRequestList } }, options: "items" }, function(error, itemDataList)
    {
      if (error)
      {
        callback(error, []);
        return;
      }

      for (var id in itemDataList)
      {
        itemList[id] = self.addItemData(itemDataList[id]);
      }

      callback(null, itemList);
    });
  };

  self.getItem = function(id, callback)
  {
    murrix.cache.getItems([ id ], function(error, itemList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (itemList.length === 0 || !itemList[id])
      {
        callback("No results returned, you probably do not have rights to this item!");
        return;
      }

      callback(null, itemList[id]);
    });
  };


  self.getGroups = function(idList, callback)
  {
    var groupList = {};
    var idRequestList = [];

    for (var n = 0; n < idList.length; n++)
    {
      if (self.groups[idList[n]])
      {
        groupList[idList[n]] = self.groups[idList[n]];
      }
      else
      {
        idRequestList.push(idList[n]);
      }
    }

    if (idRequestList.length === 0)
    {
      callback(null, groupList);
      return;
    }

    murrix.server.emit("findGroups", { query: { _id: { $in: idRequestList } }, options: {} }, function(error, groupDataList)
    {
      if (error)
      {
        callback(error, []);
        return;
      }

      for (var id in groupDataList)
      {
        groupList[id] = self.addGroupData(groupDataList[id]);
      }

      callback(null, groupList);
    });
  };

  self.getUsers = function(idList, callback)
  {
    var userList = {};
    var idRequestList = [];

    for (var n = 0; n < idList.length; n++)
    {
      if (self.users[idList[n]])
      {
        userList[idList[n]] = self.users[idList[n]];
      }
      else
      {
        idRequestList.push(idList[n]);
      }
    }

    if (idRequestList.length === 0)
    {
      callback(null, userList);
      return;
    }

    murrix.server.emit("findUsers", { query: { _id: { $in: idRequestList } }, options: {} }, function(error, userListList)
    {
      if (error)
      {
        callback(error, []);
        return;
      }

      for (var id in userListList)
      {
        userList[id] = self.addUserData(userListList[id]);
      }

      callback(null, userList);
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

murrix.loadProfilePicture = function(element, pictureId, width, height, square)
{
  if (!pictureId)
  {
    $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height); // TODO: Set generic user icon image
    return;
  }

  var src = "/preview?id=" + pictureId + "&width=" + width + "&height=" + height + "&square=" + square;

  var image = new Image();

  image.onload = function()
  {
    $(element).attr("src", src);
  };

  image.onerror = function()
  {
    $(element).attr("src", "http://placekitten.com/g/" + width + "/" + height);// TODO: Set error image
  };

  image.src = src;

  return;
};

murrix.dragNoopHandler = function(element, event)
{
  event.stopPropagation();
  event.preventDefault();
};

murrix.resetForm = function(element)
{
  $(element).find("input:text, input:password, input:file, select, textarea").val("");
  $(element).find("input:radio, input:checkbox").removeAttr("checked").removeAttr("selected");
};

murrix.getFormData = function(element)
{
  var data = {};

  jQuery.each($(element).find("input, select, textarea"), function(n, input)
  {
    $input = $(input)
    data[$input.attr("name")] = $input.val();
  });

  return data;
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

murrix.removeFromArray = function(needle, haystack)
{
  var list = [];

  for (var n = 0; n < haystack.length; n++)
  {
    if (haystack[n] !== needle)
    {
      list.push(haystack[n]);
    }
  }

  return list;
};

murrix.addToArray = function(needle, haystack)
{
  if (!murrix.inArray(needle, haystack))
  {
    haystack.push(needle);
  }

  return haystack;
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
    pathObservable().primary(result.primary);
  }

  if (result.secondary !== pathObservable().secondary())
  {
    pathObservable().secondary(result.secondary);
  }

  return result;
};

murrix.parseExifGps = function(data)
{
  parts = data.split(" ")
  parts[0] = parts[0].replace(/:/g, "-")
  parts.push("+00:00");

  var datetime = parts.join(" ");

  return murrix.timestamp(datetime);
};

murrix.parseExifCamera = function(data)
{
  parts = data.split(" ")
  parts[0] = parts[0].replace(/:/g, "-")
  parts.push("+00:00");

  var datetime = parts.join(" ");

  return murrix.timestamp(datetime);
};

murrix.timestamp = function(value)
{
  if (value)
  {
    return Math.floor(new Date(value).getTime() / 1000);
  }

  return Math.floor(new Date().getTime() / 1000);
};
