
var murrix = {};

murrix.cache = new function()
{
  var self = this;

  self.nodesCount = 0;
  self.nodes = {};
  self.itemsCount = 0;
  self.items = {};

  self.groups = {};
  self.users = {};

  self.imageTimer = null;
  self.$window = $(window);
  self.windowWidth = self.$window.width();
  self.windowHeight = self.$window.height();

  self.clear = function()
  {
    self.nodesCount = 0;
    self.nodes = {};
    self.itemsCount = 0;
    self.items = {};
    self.groups = {};
    self.users = {};
    self.images = [];
  };

  self.clearItems = function()
  {
    self.itemsCount = 0;
    self.items = {};
  };

  self.clearNodes = function()
  {
    self.nodesCount = 0;
    self.nodes = {};
  };

/*
  // TODO: Clean up this image loading code!
  self.queuedImages = {};

  self.loadImage = function(element, options)
  {
    var obj = {};

    obj.element = element;
    obj.width = options.width;
    obj.height = options.height;
    obj.canceled = false;

    obj.load = function()
    {
      if (obj.canceled)
      {
        return;
      }

      var path = "/preview?id=" +  options.id + "&cacheId=" + options.cacheId + "&width=" + options.width + "&height=" + options.height + "&square=" + options.square;

      var image = new Image();

      image.onload = function()
      {
        if (obj.canceled)
        {
          return;
        }

        //console.log("onload", path);
        element.prop("src", path);
      };


      image.onerror = function()
      {
        if (obj.canceled)
        {
          return;
        }

        options.type = "image";

        murrix.server.emit("getCacheStatus", options, function(error, status, id)
        {
          if (obj.canceled)
          {
            return;
          }

          //console.log("getCacheStatus", options, status, id);
          if (error)
          {
            console.log("Error while getting cache status for id " + options.id + ", reason: " + error);
            status = "none";
          }

          if (status === "none")
          {
            var path2 = "http://placekitten.com/g/" + options.width + "/" + options.height;

            var image2 = new Image();

            image2.onload = function()
            {
              if (obj.canceled)
              {
                return;
              }

              element.prop("src", path2);
            };

            image2.onerror = function()
            {
              if (obj.canceled)
              {
                return;
              }

              element.prop("src", path2);
            };

            image2.src = path;

            if (image2.complete)
            {
              element.prop("src", path2);
            }

            return;
          }
          else if (status === "queued")
          {
            console.log("Image is queued", options);
          }
          else if (status === "ongoing")
          {
            console.log("Image generation is ongoing", options);
          }
          else
          {
            console.log("Unknown status: " + status, options);
          }

          self.queuedImages[id] = obj;
        });
      };

      //console.log("setpath", path);
      image.src = path;

      if (image.complete)
      {//console.log("complete", path);
        image.onload();
      }
    };

    self.images.push(obj);
  };

  self.imageTimeout = function()
  {
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var images = [];

    for (var n = 0; n < self.images.length; n++)
    {
      if (self.images[n].element.closest('html').length === 0)
      {
        continue;
      }

      if (self.images[n].element.is(":visible"))
      {
        var offset = self.images[n].element.offset();

        if (offset.left + self.images[n].width >= 0 && offset.left <= windowWidth && offset.top + self.images[n].height >= 0 && offset.top <= windowHeight)
        {
          self.images[n].load();
          continue;
        }
      }

      images.push(self.images[n]);
    }

    self.images = images;
  };*/



  self.queuedImages = {};

  self.queuedImageDone = function(error, id)
  {
    if (error)
    {
      console.log("Error while running caching job, reason: " + error);
      return;
    }

    if (murrix.cache.queuedImages[id])
    {
      var img = murrix.cache.queuedImages[id];
      delete murrix.cache.queuedImages[id];

      self.loadImage(img);
    }
  };

  self.loadImage = function(img)
  {
    var image = new Image();

    image.onload = function()
    {
      if (img.$element.data("initImagePath") !== img.path)
      {
        return;
      }

//       img.$element.width("auto");
//       img.$element.height("auto");
      img.$element.prop("src", img.path);
    };

    image.onerror = function()
    {
      if (img.$element.data("initImagePath") !== img.path)
      {
        return;
      }

      murrix.server.emit("getCacheStatus", img.options, function(error, status, id)
      {
        //console.log(error, status, id);
        if (img.$element.data("initImagePath") !== img.path)
        {
          return;
        }

        if (error)
        {
          console.log("Error while getting cache status for id " + img.options.id + ", reason: " + error);
          status = "none";
        }

        if (status === "none")
        {
          var width = img.options.width > 0 ? img.options.width : 250;
          var height = img.options.height > 0 ? img.options.height : 250;

//           img.$element.width(width);
//           img.$element.height(height);
          img.$element.prop("src", "http://placekitten.com/g/" + width + "/" + height);
          return;
        }
        else if (status === "queued")
        {
          console.log("Image is queued", img);
        }
        else if (status === "ongoing")
        {
          console.log("Image generation is ongoing", img);
        }
        else if (status === "available")
        {
          console.log("Image is available", img);
          image.onload();
        }
        else
        {
          console.log("Unknown status: " + status, img);
        }
/*
        img.$element.width(250);
        img.$element.height(250);*/
        img.$element.prop("src", "img/120x120_spinner.gif");

        self.queuedImages[id] = img;
      });
    };

    //console.log("setpath", img.path);
    image.src = img.path;


    if (image.complete)
    {
      image.onload();
    }
  };


  self.initImageList = [];

  self.initImageTimeout = function()
  {
    var list = [];

    self.windowWidth = self.$window.width();
    self.windowHeight = self.$window.height();

    for (var n = 0; n < self.initImageList.length; n++)
    {
      var img = self.initImageList[n];

      if (!jQuery.contains(document, img.$element[0]))
      {
        continue;
      }

      if (self.isElementVisible(img.$element, img.options.width, img.options.height))
      {
        self.loadImage(img);
        continue;
      }

      list.push(img);
    }

    self.initImageList = list;

    if (self.initImageList.length === 0 && self.imageTimer)
    {
      clearInterval(self.imageTimer);
      self.imageTimer = null;
    }
  };

  self.initImage = function($element, options)
  {
    options.type = "image";

    var img = {};

    img.$element = $element;
    img.options = options;
    img.path = "/preview?id=" +  options.id + "&cacheId=" + options.cacheId + "&width=" + options.width + "&height=" + options.height + "&square=" + options.square;

    $element.data("initImagePath", img.path);
    //$element.width(options.width > 0 ? options.width : 250);
    //$element.height(options.height > 0 ? options.height : 250);
    $element.prop("src", "img/black.jpg");

    if (!self.isElementVisible($element, options.width, options.height) && options.delayedLoad)
    {
      self.initImageList.push(img);
    }
    else
    {
      self.loadImage(img);
    }

    if (!self.imageTimer)
    {
      self.imageTimer = setInterval(function()
      {
        self.initImageTimeout();
      }, 500);
    }
  };

  self.isElementVisible = function($element, elementWidth, elementHeight)
  {
    if ($element.is(":visible"))
    {
      var offset = $element.offset();

      if (elementWidth === 0 || elementHeight === 0)
      {
        return true;
      }

      if (offset.left + elementWidth >= 0 &&
          offset.left <= self.windowWidth &&
          offset.top + elementHeight >= 0 &&
          offset.top <= self.windowHeight)
      {
        return true;
      }
    }

    return false;
  }




  self.extendNode = function(id)
  {
    self.nodes[id].comments = self.nodes[id].comments || ko.observableArray();

    self.nodes[id].comments.subscribe(function(value)
    {
      value.sort(function(a, b)
      {
        return b.added.timestamp() - a.added.timestamp();
      });
    });

    self.nodes[id].comments.valueHasMutated(); // Force sort!

    if (self.nodes[id].referenceTimelines)
    {
      self.nodes[id].referenceTimelines.sort(function(a, b)
      {
        /* Less than 0: Sort "a" to be a lower index than "b"
         * Zero: "a" and "b" should be considered equal, and no sorting performed.
         * Greater than 0: Sort "b" to be a lower index than "a".
         *
         * type === 'utc' should be at top, type === 'timezone' at the bottom
         * if type is the same preserve order to not mess things up, new we pushed to the end should not become the default unless it is the only one!
         */

        if (a.type === b.type)
        {
          return 0;
        }
        else if (a.type === "utc" && b.type === "timezone")
        {
          return -1;
        }
        else if (a.type === "timezone" && b.type === "utc")
        {
          return 1;
        }

        console.log("Found unknown type combination in sort of reference timelines", a, b);
        return 0;
      });
    }

    self.nodes[id].hasAdminAccess = function()
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

    self.nodes[id].hasReadAccess = function()
    {
      if (this["public"]() === true)
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

//     if (self.nodes[id].type() === "person")
//     {
//       self.nodes[id].family = self.nodes[id].family || {};
//       self.nodes[id].family.parents = self.nodes[id].family.parents || ko.observableArray();
//       self.nodes[id].family.parentList = ko.observableArray([]);
//
//       ko.dependentObservable(function()
//       {
//       //  self.nodes[id].family.parentList.removeAll();
//
//         if (self.nodes[id].family.parents().length === 0)
//         {
//           return;
//         }
//
//         var ids = [];
//
//         for (var n = 0; n < self.nodes[id].family.parents().length; n++)
//         {
//           ids.push(self.nodes[id].family.parents()[n]._id());
//         }
//
//         murrix.cache.getNodes(ids, function(error, nodeList)
//         {
//           if (error)
//           {
//             console.log(error);
//             return;
//           }
//
//           var list = [];
//
//           for (var n in nodeList)
//           {
//             list.push(nodeList[n]);
//           }
//
//           self.nodes[id].family.parentList(list);
//         });
//       });
//     }
  };

  self.extendItem = function(id)
  {
    self.items[id].comments = self.items[id].comments || ko.observableArray();

    self.items[id].comments.subscribe(function(value)
    {
      value.sort(function(a, b)
      {
        return b.added.timestamp() - a.added.timestamp();
      });
    });

    self.items[id].comments.valueHasMutated(); // Force sort!


    self.items[id].showing = self.items[id].showing || ko.observableArray();

    self.items[id].showing.subscribe(function(value)
    {
      value.sort(function(a, b)
      {
        return (b.x && a.x) ? a.x() - b.x() : 0;
      });
    });

    self.items[id].showing.valueHasMutated(); // Force sort!


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


    self.items[id].where = self.items[id].where || {};
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
              self.items[id].whereString(false);
              self.items[id].whereNode(false);
              return;
            }

            self.items[id].whereString(false);
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


    self.items[id].when = self.items[id].when || {};
    self.items[id].whenTimestamp = ko.observable(false);

    ko.dependentObservable(function()
    {
      if (!self.items[id].when || !self.items[id].when.timestamp)
      {
        self.items[id].whenTimestamp(false);
        return;
      }

      if (self.items[id].with && self.items[id].with() !== false &&
          self.items[id].with().whenOffsets)
      {
        var index = self.items[id].with().whenOffsets().length === 0 ? -1 : 0; // First is default if one exists

        if (self.items[id].when._syncId && self.items[id].when._syncId() !== false)
        {
          for (var n = 0; n < self.items[id].with().whenOffsets().length; n++)
          {
            if (self.items[id].with().whenOffsets()[n]._id() === self.items[id].when._syncId())
            {
              index = n;
              break;
            }
          }
        }

        if (index >= 0)
        {

          self.items[id].whenTimestamp(self.items[id].when.timestamp() + self.items[id].with().whenOffsets()[index].value());
          return;
        }
      }

      self.items[id].whenTimestamp(self.items[id].when.timestamp());
    });


    self.items[id].what = self.items[id].what || {};
    self.items[id].whatDetailed = ko.observable("unknown");

    ko.dependentObservable(function()
    {
      var type = self.items[id].what();

      if (type === "file")
      {
        type = "unknownFile";

        if (self.items[id].exif && self.items[id].exif.MIMEType)
        {
          if (murrix.mimeIsImage(self.items[id].exif.MIMEType()))
          {
            type = "imageFile";
          }
          else if (murrix.mimeIsVideo(self.items[id].exif.MIMEType()))
          {
            type = "videoFile";
          }
          else if (murrix.mimeIsAudio(self.items[id].exif.MIMEType()))
          {
            type = "audioFile";
          }
        }
      }

      self.items[id].whatDetailed(type);
    });
  };

  self.addNodeData = function(nodeData)
  {
    if (nodeData === false)
    {
      return false;
    }

    if (!self.nodes[nodeData._id])
    {
     //console.log("Could not find mapped index, node is not cached, id " + nodeData._id);

      self.nodes[nodeData._id] = ko.mapping.fromJS(nodeData);
      self.nodesCount++;

      self.extendNode(nodeData._id);
    }
    else
    {
     // console.log("Node " + nodeData._id + " already cached updating cache...");

      ko.mapping.fromJS(nodeData, self.nodes[nodeData._id]);
    }

    return self.nodes[nodeData._id];
  };

  self.addItemData = function(itemData)
  {
    if (itemData === false)
    {
      return false;
    }

    if (!self.items[itemData._id])
    {
      //console.log("Could not find mapped index, item is not cached, id " + itemData._id);

      self.items[itemData._id] = ko.mapping.fromJS(itemData);
      self.itemsCount++;

      self.extendItem(itemData._id);
    }
    else
    {
      //console.log("Item " + itemData._id + " already cached updating cache...");

      ko.mapping.fromJS(itemData, self.items[itemData._id]);
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

      for (var n = 0; n < nodeDataList.length; n++)
      {
        nodeList[nodeDataList[n]._id] = self.addNodeData(nodeDataList[n]);
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

      for (var n = 0; n < itemDataList.length; n++)
      {
        itemList[itemDataList[n]._id] = self.addItemData(itemDataList[n]);
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
    var query = {};

    if (idList.length > 0)
    {
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

      query = { _id: { $in: idRequestList } };
    }

    murrix.server.emit("findGroups", { query: query, options: {} }, function(error, groupDataList)
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

  self.getGroup = function(id, callback)
  {
    murrix.cache.getGroups([ id ], function(error, groupList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (groupList.length === 0 || !groupList[id])
      {
        callback("No results returned, you probably do not have rights to this group!");
        return;
      }

      callback(null, groupList[id]);
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

  self.getUser = function(id, callback)
  {
    murrix.cache.getUsers([ id ], function(error, userList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (userList.length === 0 || !userList[id])
      {
        callback("No results returned, you probably do not have rights to this user!");
        return;
      }

      callback(null, userList[id]);
    });
  };
}();

murrix.dnd = new function()
{
  var self = this;

  self.id = ko.observable(false);
  self.type = ko.observable(false);

  self.start = function(id, type)
  {
    self.id(id);
    self.type(type);
  };

  self.end = function()
  {
    self.id(false);
    self.type(false);
  };
}();


murrix.upload = function(file, callback)
{
  var form = new FormData();

  form.append("file", file);

  var startTime = murrix.timestamp();

  $.ajax({
    url: "/upload",
    type: "POST",
    xhr: function()
    {
      myXhr = $.ajaxSettings.xhr();

      var progressListener = function(event)
      {
        var progress = Math.round((event.loaded / event.total) * 100);
        var duration = murrix.timestamp() - startTime;
        var speed = event.total / (duration === 0 ? 1 : duration);

        callback(null, null, progress, speed);
      };

      myXhr.upload.addEventListener("progress", progressListener, false);
      myXhr.addEventListener("progress", progressListener, false);

      return myXhr;
    },
    success: function(data)
    {
      callback(null, data.path);
    },
    error: function(data)
    {
      console.log("Upload failed, reason: " + data.responseText, file);
      callback("Upload failed, reason: " + data.responseText, null, 0, 0);
    },
    data: form,
    cache: false,
    contentType: false,
    processData: false
  }, "json");
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
    $input = $(input);
    data[$input.attr("name")] = $input.val();
  });

  return data;
};

murrix.basename = function(str)
{
  var base = str.substring(str.lastIndexOf('/') + 1);

  if (base.lastIndexOf(".") != -1)
  {
    base = base.substring(0, base.lastIndexOf("."));
  }

  return base;
};

// Taken from http://my.opera.com/GreyWyvern/blog/show.dml/1671288
murrix.natcasecmp = function(a, b) {
  function chunkify(t) {
    var tz = [], x = 0, y = -1, n = 0, i, j;

    while ((i = (j = t.charAt(x++)).charCodeAt(0))) {
      var m = (i == 46 || (i >=48 && i <= 57));
      if (m !== n) {
        tz[++y] = "";
        n = m;
      }
      tz[y] += j;
    }
    return tz;
  }

  var aa = chunkify(a);
  var bb = chunkify(b);

  for (x = 0; aa[x] && bb[x]; x++) {
    if (aa[x] !== bb[x]) {
      var c = Number(aa[x]), d = Number(bb[x]);
      if (c == aa[x] && d == bb[x]) {
        return c - d;
      } else return (aa[x] > bb[x]) ? 1 : -1;
    }
  }
  return aa.length - bb.length;
};

murrix.compareItemFunction = function(a, b)
{
  if (b.whenTimestamp() === false || a.whenTimestamp() === false)
  {
    if (!b.name || !a.name)
    {
      return 0;
    }

    return -murrix.natcasecmp(b.name(), a.name());
  }

  var offset = 0;

  if (a.whenTimestamp() < 0 || b.whenTimestamp() < 0)
  {
    offset = Math.abs(Math.min(a.whenTimestamp(), b.whenTimestamp()));
  }

  return (a.whenTimestamp() + offset) - (b.whenTimestamp() + offset);
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

var rawImageMimeTypes = [ "image/x-canon-cr2", "image/x-raw", "image/x-canon-crw", "image/x-nikon-nef", "image/CR2" ];
var imageMimeTypes = [ "image/jpeg", "image/gif", "image/tiff", "image/png", "image/bmp" ].concat(rawImageMimeTypes);
var videoMimeTypes = [ "video/mpeg", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/mp4", "video/3gpp", "video/x-msvideo" ];
var audioMimeTypes = [ "audio/mpeg", "audio/x-wav", "audio/x-m4a", "audio/mp4" ];

murrix.mimeIsImage = function(mimeType)
{
  return murrix.inArray(mimeType, imageMimeTypes);
};

murrix.mimeIsRawImage = function(mimeType)
{
  return murrix.inArray(mimeType, rawImageMimeTypes);
};

murrix.mimeIsVideo = function(mimeType)
{
  return murrix.inArray(mimeType, videoMimeTypes);
};

murrix.mimeIsAudio = function(mimeType)
{
  return murrix.inArray(mimeType, audioMimeTypes);
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
  parts = data.split(" ");
  parts[0] = parts[0].replace(/:/g, "-");
  parts.push("+00:00");

  var datetime = parts.join(" ");

  return murrix.timestamp(datetime);
};

murrix.parseExifCamera = function(data)
{
  parts = data.split(" ");
  parts[0] = parts[0].replace(/:/g, "-");
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

murrix.parseTimezone = function(string)
{
  if (string === false)
  {
    return "+00:00";
  }

  var timezone = string.match(/\(GMT(.*)\)/)[1];

  if (timezone === "")
  {
    return "+00:00";
  }

  return timezone;
};

murrix.timezoneStringToOffset = function(timezoneString)
{
  var string = murrix.parseTimezone(timezoneString);

  var minus = string[0] === "-";

  var hour = parseInt(string.substr(1, 2), 10);
  var minutes = parseInt(string.substr(4, 2), 10);

  var offset = hour * 3600 + minutes * 60;

  return minus ? -offset : offset;
};

murrix.parseDatestring = function(datestring)
{
  var dateAndTime = datestring.split(" ");

  var dateParts = dateAndTime[0].split("-");
  var timeParts = dateAndTime[1].split(":");

  var info = {};

  info.year = dateParts[0];
  info.month = dateParts[1];
  info.day = dateParts[2];
  info.hour = timeParts[0];
  info.minute = timeParts[1];
  info.second = timeParts[2];

  return info;
};

/*
murrix.makeTimestamp = function(source, references, callback)
{
  if (source.type === "gps")
  {
    // Format 2011-07-01 14:17:24Z
    var parts = source.datestring.substr(0, source.datestring.length - 1).split(" ");
    var datestring = parts[0].replace(/:/g, "-") + " " + parts[1] + " +00:00";

    callback(null, murrix.timestamp(datestring));
  }
  else if (source.type === "camera")
  {
    // Format 2011-07-01 14:17:24
    var parts = source.datestring.split(" ");
    var datestring = parts[0].replace(/:/g, "-") + " " + parts[1];

    if (source.reference === false)
    {
      // TODO: If timezone is false, maybe lookup by position and secondary if where has a timezone.

      datestring += " " + murrix.parseTimezone(source.timezone);

      var timestamp = murrix.timestamp(datestring);

      if (source.daylightSavings)
      {
        timestamp += 3600;
      }

      callback(null, timestamp);
    }
    else
    {
      datestring += " +00:00";

      var timestamp = murrix.timestamp(datestring);
      var offset = false;

      for (var n = 0; n < references.length; n++)
      {
        if (references[n]._id === source.reference)
        {
          offset = references[n].offset;
          break;
        }
      }

      if (offset === false)
      {
        callback("Could not find the specified reference");
        return;
      }

      timestamp += offset;

      callback(null, timestamp);
    }
  }
  else if (source.type === "manual")
  {
    var parts = source.datestring.replace(/:/g, " ").split(" ");
    var timezone = murrix.parseTimezone(source.timezone);
    var datastring = "";

    if (parts[0] === "XX") // No Year
    {
      callback(null, false);
      return;
    }
    else if (parts[1] === "XX") // No Month
    {
      datastring = parts[0] + "-01-01 00:00:00 " + timezone;
    }
    else if (parts[2] === "XX") // No Day
    {
      datastring = parts[0] + "-" + parts[1] + "-01 00:00:00 " + timezone;
    }
    else if (parts[3] === "XX") // No Hour
    {
      datastring = parts[0] + "-" + parts[1] + "-" + parts[2] + " 00:00:00 " + timezone;
    }
    else if (parts[4] === "XX") // No Minute
    {
      datastring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":00:00 " + timezone;
    }
    else if (parts[5] === "XX") // No second
    {
      datastring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":00 " + timezone;
    }
    else // Full date and time
    {
      datastring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":" + parts[5] + " " + timezone;
    }

    var timestamp = murrix.timestamp(datastring);

    if (source.daylightSavings)
    {
      timestamp += 3600;
    }

    callback(null, timestamp);
  }
  else
  {
    callback("Unknown source type, " + source.type);
  }
};*/

murrix.getAge = function(timestamp)
{
  var today = new Date();
  var birthDate = new Date();

  birthDate.setTime(timestamp * 1000);

  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
  {
    age--;
  }

  return age;
};

murrix.cleanDatestring = function(datestring)
{
  if (datestring[datestring.length - 1] === "Z")
  {
    datestring = datestring.substr(0, datestring.length - 1); // Remove trailing Z
  }

  // Replace dividing : with -
  var parts = datestring.split(" ");
  datestring = parts[0].replace(/:/g, "-") + " " + parts[1];

  return datestring;
};

murrix.isDaylightSavings = function(datestring)
{
  datestring = murrix.cleanDatestring(datestring);

  var parts = datestring.split(" ");

  var check = parts[0];

  parts = check.split("-");

  if (parts[0] === "XXXX" || parts[1] === "XX" || parts[2] === "XX")
  {
    return false;
  }

  var ranges = [];

  ranges.push({ start: "1980-04-06", end: "1980-09-28" });
  ranges.push({ start: "1981-03-29", end: "1981-09-27" });
  ranges.push({ start: "1982-03-28", end: "1982-09-26" });
  ranges.push({ start: "1983-03-27", end: "1983-09-25" });
  ranges.push({ start: "1984-03-25", end: "1984-09-30" });
  ranges.push({ start: "1985-03-31", end: "1985-09-29" });
  ranges.push({ start: "1986-03-30", end: "1986-09-28" });
  ranges.push({ start: "1987-03-29", end: "1987-09-27" });
  ranges.push({ start: "1988-03-27", end: "1988-09-25" });
  ranges.push({ start: "1989-03-26", end: "1989-09-24" });
  ranges.push({ start: "1990-03-25", end: "1990-09-30" });
  ranges.push({ start: "1991-03-31", end: "1991-09-29" });
  ranges.push({ start: "1992-03-29", end: "1992-09-27" });
  ranges.push({ start: "1993-03-28", end: "1993-09-26" });
  ranges.push({ start: "1994-03-27", end: "1994-09-25" });
  ranges.push({ start: "1995-03-26", end: "1995-09-24" });
  ranges.push({ start: "1996-03-31", end: "1996-10-27" });
  ranges.push({ start: "1997-03-30", end: "1997-10-26" });
  ranges.push({ start: "1998-03-29", end: "1998-10-25" });
  ranges.push({ start: "1999-03-28", end: "1999-10-31" });
  ranges.push({ start: "2000-03-26", end: "2000-10-29" });
  ranges.push({ start: "2001-03-25", end: "2001-10-28" });
  ranges.push({ start: "2002-03-31", end: "2002-10-27" });
  ranges.push({ start: "2003-03-30", end: "2003-10-26" });
  ranges.push({ start: "2004-03-28", end: "2004-10-31" });
  ranges.push({ start: "2005-03-27", end: "2005-10-30" });
  ranges.push({ start: "2006-03-26", end: "2006-10-29" });
  ranges.push({ start: "2007-03-25", end: "2007-10-28" });
  ranges.push({ start: "2008-03-30", end: "2008-10-26" });
  ranges.push({ start: "2009-03-29", end: "2009-10-25" });
  ranges.push({ start: "2010-03-28", end: "2010-10-31" });
  ranges.push({ start: "2011-03-27", end: "2011-10-30" });
  ranges.push({ start: "2012-03-25", end: "2012-10-28" });
  ranges.push({ start: "2013-03-31", end: "2013-10-27" });
  ranges.push({ start: "2014-03-30", end: "2014-10-26" });
  ranges.push({ start: "2015-03-29", end: "2015-10-25" });
  ranges.push({ start: "2016-03-27", end: "2016-10-30" });
  ranges.push({ start: "2017-03-26", end: "2017-10-29" });
  ranges.push({ start: "2018-03-25", end: "2018-10-28" });
  ranges.push({ start: "2019-03-31", end: "2019-10-27" });
  ranges.push({ start: "2020-03-29", end: "2020-10-25" });

  for (var n = 0; n < ranges.length; n++)
  {
    check = new Date(check);
    var start = new Date(ranges[n].start);
    var end = new Date(ranges[n].end);

    if (check <= end && check >= start)
    {
      return true;
    }
  }

  return false;
};

murrix.pad = function(number, length)
{
  var str = "" + number;

  while (str.length < length)
  {
    str = "0" + str;
  }

  return str;
};

murrix.floatval = function(value)
{
  var floatvalue = value;

  if (typeof value !== "number")
  {
    try
    {
      floatvalue = parseFloat(value);
    }
    catch (e)
    {
    }
  }

  if (typeof floatvalue !== "number" || isNaN(floatvalue))
  {
    console.log("Could not convert value to float: \"" + value + "\" (" + (typeof value) + ") -> \"" + floatvalue + "\" (" + typeof floatvalue + ")");
    floatvalue = 0;
  }

  return floatvalue;
};

murrix.round = function(value, precision)
{
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
};

murrix.makeDecimalPretty = function(num)
{
  num = murrix.floatval(num);

  if (num === 0)
  {
    return "0";
  }

  if (num > 1)
  {
    return murrix.round(num, 2) + "";
  }

  return "1/" + Math.round(1/num);
};
