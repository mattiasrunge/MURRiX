
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var MurrixUtils = require('./utils.js');

function NodeManager(db, user)
{
  var self = this;

  self.saveNode = function(session, nodeData, callback)
  {
    user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      /* Check that we are not the anonymous user */
      if (!userNode)
      {
        callback("Anonymous user can not save a node!", null);
        return;
      }


      /* Check that we have a valid name and type */
      if (!nodeData.name || nodeData.name === "")
      {
        callback("Can not save node without a name!", null);
        return;
      }

      if (!nodeData.type || nodeData.type === "")
      {
        callback("Type of node is undefined or not allowed!", null);
        return;
      }


      /* Verify attributes for all types */
      nodeData.added = nodeData.added || { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
      nodeData.modified = { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
      nodeData.description = nodeData.description || "";
      nodeData.comments = nodeData.comments || [];
      nodeData._admins = nodeData._admins || [];
      nodeData._readers = nodeData._readers || [];
      nodeData.public = nodeData.public || false;
      nodeData.tags = nodeData.tags || [];
      nodeData.removed = nodeData.removed || false;
      nodeData._profilePicture = nodeData._profilePicture || false;


      /* Check that admin rights are available */
      if (nodeData._id)
      {
        /* If this is a file the user must have admin rights on the parent */
        self.addAccessCheckToQuery(session, { _id: nodeData._id }, true, function(error, query)
        {
          if (error)
          {
            console.log(error);
            console.log("Could not add access checks to query!");
            callback("Could not add access checks to query!", null);
            return;
          }

          if (query === false)
          {
            callback("No rights on parent, can not change/create file", null);
            return;
          }

          self._count(session, query, "nodes", function(error, count)
          {
            if (error)
            {
              console.log(error);
              console.log("Could not fetch parent node to check rights!");
              callback("Could not fetch parent node to check rights!", null);
              return;
            }

            if (count === 0)
            {
              callback("No rights on parent, can not change/create file!", null);
              return;
            }

            self._saveNode(nodeData, callback);
          });
        });
      }
      else
      {
        self._saveNode(nodeData, callback);
      }
    });
  };

  self._saveNode = function(nodeData, callback)
  {
    /* Save the node */
    db.collection("nodes", function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }



      if (nodeData._id)
      {
        collection.update({ _id: nodeData._id }, nodeData, { }, function(error, numberOfUpdatedRows)
        {
          if (error)
          {
            callback("Failed to update node document", null);
            return;
          }

          if (nodeData.type === "camera")
          {
            self.cameraUpdated(nodeData, function(error)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null, nodeData);
            });
          }
          else
          {
            callback(null, nodeData);
          }
        });
      }
      else
      {
        nodeData._id = new ObjectID().toString();

        collection.insert(nodeData, function(error, nodeData)
        {
          if (error)
          {
            callback("Failed to insert node document", null);
            return;
          }

          if (nodeData[0].type === "camera")
          {
            self.cameraUpdated(nodeData[0], function(error)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null, nodeData[0]);
            });
          }
          else
          {
            callback(null, nodeData[0]);
          }
        });
      }
    });
  };

  self.saveItem = function(session, itemData, callback)
  {
    user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      /* Check that we are not the anonymous user */
      if (!userNode)
      {
        callback("Anonymous user can not save an item!", null);
        return;
      }


      /* Check that we have a valid parents */
      if (!itemData._parents || itemData._parents.length === 0)
      {
        callback("Can not save item without parents!", null);
        return;
      }

      if (!itemData.what || itemData.what === "")
      {
        callback("What of item is undefined or not allowed!", null);
        return;
      }


      /* Verify attributes for all types */
      itemData.added = itemData.added || { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
      itemData.modified = { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
      itemData._who = itemData._who || false;
      itemData._with = itemData._with || false;
      itemData.when = itemData.when || { timestamp: false, source: false };
      itemData.where = itemData.where || {};
      itemData.showing = itemData.showing || [];
      itemData.comments = itemData.comments || [];
      itemData.removed = itemData.removed || false;


      /* If this is an item the user must have admin rights on the parent */
      self.addAccessCheckToQuery(session, { _id: { $in: itemData._parents } }, true, function(error, query)
      {
        if (error)
        {
          callback("Could not add access checks to query!", null);
          return;
        }

        if (query === false)
        {
          callback("No rights on parents, can not change/create item!", null);
          return;
        }

        self._count(session, query, "nodes", function(error, count)
        {
          if (error)
          {
            console.log(error);
            console.log("Could not fetch parent node to check rights!");
            callback("Could not fetch parent node to check rights!", null);
            return;
          }

          if (count < itemData._parents.length)
          {
            callback("No rights on parents, can not change/create item!", null);
            return;
          }

          self._saveItem(itemData, callback);
        });
      });
    });
  };

  self._saveItem = function(itemData, callback)
  {
    /* Save the item */
    db.collection("items", function(error, collection)
    {
      if (error)
      {
        callback("Could not get items collection", null);
        return;
      }

      self.updateItemWhen(itemData, function(error, newItemData)
      {
        if (error)
        {
          callback(error, null);
          return;
        }

        if (newItemData._id)
        {
          collection.update({ _id: newItemData._id }, newItemData, { }, function(error, numberOfUpdatedRows)
          {
            if (error)
            {
              callback("Failed to update item document", null);
              return;
            }

            callback(null, newItemData);
          });
        }
        else
        {
          newItemData._id = new ObjectID().toString();

          collection.insert(newItemData, function(error, newItemData)
          {
            if (error)
            {
              callback("Failed to insert item document", null);
              return;
            }

            callback(null, newItemData[0]);
          });
        }
      });
    });
  };

  self.createFileItem = function(session, uploadManager, name, uploadId, parentId, callback)
  {
    uploadManager.find(session, uploadId, function(error, file)
    {
      if (error)
      {
        callback("Could not find uploaded file with id " + uploadId, null);
        return;
      }

      var parts = [];
      var itemData = {};

      itemData._parents = [ parentId ];
      itemData.what = "file";

      itemData.name = name;
      itemData.exif = file.exif
      itemData.checksum = file.checksum;
      itemData.angle = 0;
      itemData.mirror = false;
      itemData.description = "";
      itemData._with = false;

      if (file.exif.GPSDateTime)
      {
        var source = {};

        source.type = "gps";
        source.datestring = MurrixUtils.cleanDatestring(file.exif.GPSDateTime);

        itemData.when = { timestamp: false, source: source };
      }
      else if (file.exif.DateTimeOriginal)
      {
        var source = {};

        source.type = "camera";
        source.datestring = MurrixUtils.cleanDatestring(file.exif.DateTimeOriginal);
        source.reference = false;
        source.timezone = false;

        itemData.when = { timestamp: false, source: source };
      }

      if (file.exif.Orientation)
      {
        switch (file.exif.Orientation)
        {
          case 1: //Normal
          {
//             itemData.angle = 0;
            break;
          }
          case 8: // 270 CW (90 CCW)
          {
            // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
            if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
            {
              itemData.angle = 90;
            }
            break;
          }
          case 6: // 90 CW (270 CCW)
          {
            // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
            if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
            {
              itemData.angle = 270;
            }
            break;
          }
          case 3: // 180 CW (180 CCW)
          {
            if (itemData.exif.ExifImageHeight > itemData.exif.ExifImageWidth)
            {
              itemData.angle = 180;
            }
            break;
          }
        }
      }
      /* TODO: Should we handle these?
         1) transform="";;
         2) transform="-flip horizontal";;
         4) transform="-flip vertical";;
         5) transform="-transpose";;
         7) transform="-transverse";;*/

      if (file.exif.GPSDateTime)
      {
        itemData.where = {};

        itemData.where.longitude = file.exif.GPSLongitude;
        itemData.where.latitude = file.exif.GPSLatitude;
        itemData.where.source = "gps";
      }

      if (file.exif.SerialNumber)
      {
        self.find(session, { type: "camera", serial: file.exif.SerialNumber }, "nodes", function(error, nodeDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          nodeDataList = MurrixUtils.makeArray(nodeDataList);

          if (nodeDataList.length > 0)
          {
            itemData._with = nodeDataList[0]._id;
          }

          self._saveFileItem(session, itemData, file, uploadManager, callback);
        });

        return;
      }
      else
      {
        self._saveFileItem(session, itemData, file, uploadManager, callback);
      }
    });
  };

  self._saveFileItem = function(session, itemData, file, uploadManager, callback)
  {
    self.saveItem(session, itemData, function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      uploadManager.moveFile(session, file.id, itemData._id, function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, itemData);
      });
    });
  };

  self.commentNode = function(session, nodeId, text, callback)
  {
    user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      self.count(session, { _id: nodeId }, "nodes", function(error, count)
      {
        if (error)
        {
          callback("Could not get rights on node!", null);
          return;
        }

        if (count === 0)
        {
          callback("Current user has no rights to add comments on this node!", null);
          return;
        }

        db.collection("nodes", function(error, collection)
        {
          if (error)
          {
            callback("Could not get nodes collection", null);
            return;
          }

          var comment = {};

          comment.added = { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
          comment.text = text;

          collection.update({ _id: nodeId }, { $set: { modified: comment.added }, "$push" : { comments: comment } }, function(error, numberOfUpdatedRows)
          {
            if (error)
            {
              callback("Failed to update document", null);
              return;
            }

            self.find(session, { _id: nodeId }, "nodes", function(error, nodeDataList)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null, nodeDataList[nodeId]);
            });
          });
        });
      });
    });
  };

  self.commentItem = function(session, itemId, text, callback)
  {
    user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      // TODO: Check righs on parent instead

      db.collection("items", function(error, collection)
      {
        if (error)
        {
          callback("Could not get items collection", null);
          return;
        }

        var comment = {};

        comment.added = { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
        comment.text = text;

        collection.update({ _id: itemId }, { $set: { modified: comment.added }, "$push" : { comments: comment } }, function(error, numberOfUpdatedRows)
        {
          if (error)
          {
            callback("Failed to update document", null);
            return;
          }

          self.find(session, { _id: itemId }, "items", function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, itemDataList[itemId]);
          });
        });
      });
    });
  };

  self.addAccessCheckToQuery = function(session, query, adminRequired, callback)
  {
    user.getUser(session, function(error, user)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      if (user)
      {
        if (!user.admin)
        {
          var newQuery = {};

          newQuery.$or = [];

          newQuery.$or.push({ "added._by": user._id });
          newQuery.$or.push({ _id: user._id });

          if (adminRequired)
          {
            if (user._groups && user._groups.length > 0)
            {
              newQuery.$or.push({ _admins: { $in: user._groups } });
            }
          }
          else
          {
            newQuery.$or.push({ public: true });

            if (user._groups && user._groups.length > 0)
            {
              newQuery.$or.push({ _readers: { $in: user._groups } });
              newQuery.$or.push({ _admins: { $in: user._groups } });
            }
          }

          newQuery.removed = false;

          query = { $and: [ query, newQuery ] };

          console.log("QUERY", JSON.stringify(newQuery));
        }
      }
      else
      {
        if (adminRequired)
        {
          console.log("Admin access is not granted to anything is there is no user signed in!");
          callback(null, false); // No query possible, admin access is not granted on anything
          return;
        }
        else
        {
          query.public = true;
        }

        query.removed = false;
      }

      console.log("QUERY", JSON.stringify(query));
      callback(null, query);
    });
  };

  self.findNodesByYear = function(session, year, callback)
  {
    var startTime = moment([ year ]);
    var endTime = startTime.clone().add("years", 1);

    var query = { };

    query.$and = [];
    query.$and.push({ "when.timestamp": { $exists: true } });
    query.$and.push({ "when.timestamp": { $ne: false } });
    query.$and.push({ "when.timestamp": { $gt: startTime.unix() } });
    query.$and.push({ "when.timestamp": { $lt: endTime.unix() } });

    self.find(session, query, "items", function(error, itemDataList)
    {
      if (error)
      {
        callback(error, null);
        return;
      }

      var parentIdList = [];

      for (var key in itemDataList)
      {
        for (var n = 0; n < itemDataList[key]._parents.length; n++)
        {
          if (!MurrixUtils.inArray(itemDataList[key]._parents[n], parentIdList))
          {
            parentIdList.push(itemDataList[key]._parents[n]);
          }
        }
      }

      self.find(session, { _id: { $in: parentIdList } }, "nodes", callback);
    });
  };

  self.findRandom = function(session, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    self.count(session, {}, collectionName, function(error, count)
    {
      if (error)
      {
        callback(error, null);
        return;
      }

      var index = Math.floor(Math.random() * count);

      options = {};
      options.limit = 1;
      options.skip = index;
      options.collection = collectionName;

      self.find(session, {}, options, function(error, nodeDataList)
      {
        if (error)
        {
          callback(error, null);
          return;
        }

        nodeDataList = MurrixUtils.makeArray(nodeDataList);

        if (nodeDataList.length === 0)
        {
          callback("Could not find random node!", null);
          return;
        }

        callback(null, nodeDataList[0]);
      });
    });
  };

  self.findOne = function(session, query, options, callback)
  {
    if ((typeof options === "string" ? options : options.collection) == "items")
    {
      self._findOne(query, options, callback);
      return;
    }

    self.addAccessCheckToQuery(session, query, false, function(error, query)
    {
      if (error)
      {
        callback("Could not add access checks to query!", null);
        return;
      }

      if (query === false)
      {
        callback(null, null);
        return;
      }

      self._findOne(query, options, callback);
    });
  };

  self._findOne = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    db.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      collection.findOne(query, function(error, document)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }

        callback(null, document);
      });
    });
  };

  self.find = function(session, query, options, callback)
  {
    var collectionName = (typeof options === "string" ? options : options.collection);

    if (collectionName === "items")
    {
      self._find(query, options, callback);
      return;
    }

    self.addAccessCheckToQuery(session, query, false, function(error, query)
    {
      if (error)
      {
        callback("Could not add access checks to query!", null);
        return;
      }

      if (query === false)
      {
        callback(null, []);
        return;
      }

      self._find(query, options, callback);
    });
  };

  self._find = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    db.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get collection", null);
        return;
      }

      var limit = 0;
      var skip = 0;
      var sort = [];
      var sortDirection = 1;

      if (options.limit !== null)
      {
        limit = options.limit;
      }

      if (options.skip !== null)
      {
        skip = options.skip;
      }

      if (options.sort !== null)
      {
        sort = options.sort;
      }

      if (options.sortDirection !== null)
      {
        sortDirection = options.sortDirection;
      }

      collection.find(query, function(error, cursor)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }

        var nodeDataList = {}; // TODO: Use more generic naming

        cursor.sort(sort, sortDirection).skip(skip).limit(limit).each(function(error, nodeData)
        {
          if (nodeData)
          {
            nodeDataList[nodeData._id] = nodeData;
          }
          else
          {
            callback(null, nodeDataList);
          }
        });
      });
    });
  };

  self.count = function(session, query, options, callback)
  {
    if ((typeof options === "string" ? options : options.collection) == "items")
    {
      self._count(session, query, options, callback);
      return;
    }

    self.addAccessCheckToQuery(session, query, false, function(error, query)
    {
      if (error)
      {
        callback("Could not add access checks to query!", null);
        return;
      }

      if (query === false)
      {
        callback(null, 0);
        return;
      }

      self._count(session, query, options, callback);
    });
  };


  self._count = function(session, query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    db.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      collection.find(query, function(error, cursor)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }

        cursor.count(function(error, count)
        {
          if (error)
          {
            console.log(error);
            console.log("Could not run count on cursor!");
            callback("Could not run count on cursor!", null);
            return;
          }

          callback(null, count);
        });
      });
    });
  };

  self.distinct = function(session, query, options, callback)
  {
    // TODO: Check rights?

    var collectionName = typeof options === "string" ? options : options.collection;

    db.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      collection.distinct(query, function(error, result)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }

        callback(null, result);
      });
    });
  };

  self.group = function(session, reduce, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    db.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      self.addAccessCheckToQuery(session, {}, false, function(error, query)
      {
        if (error)
        {
          callback("Could not add access checks to query!", null);
          return;
        }

        if (query === false)
        {
          callback(null, []);
          return;
        }

        collection.group([], query, {}, reduce, function(error, results)
        {
          if (error)
          {
            callback("Could not get run query", null);
            return;
          }

          callback(null, results);
        });
      });
    });
  };




  self.updateWhen = function(when, references, mode, callback)
  {
    if (when.source === false)
    {
      when.timestamp = false;

      callback(null, when);
      return;
    }

    if (when.source.type === "gps")
    {
      when.timestamp = MurrixUtils.timestamp(when.source.datestring + " +00:00");

      callback(null, when);
    }
    else if (when.source.type === "manual")
    {
      var timezone = MurrixUtils.parseTimezone(when.source.timezone);
      var datestring = when.source.datestring;
      var parts = datestring.replace(/-/g, " ").replace(/:/g, " ").split(" ");

      when.timestamp = false;

      if (parts[0] === "XXXX") // No Year
      {
        callback(null, when);
        return;
      }
      else if (parts[1] === "XX") // No Month
      {
        datestring = parts[0] + "-01-01 00:00:00 " + timezone;
      }
      else if (parts[2] === "XX") // No Day
      {
        datestring = parts[0] + "-" + parts[1] + "-01 00:00:00 " + timezone;
      }
      else if (parts[3] === "XX") // No Hour
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " 00:00:00 " + timezone;
      }
      else if (parts[4] === "XX") // No Minute
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":00:00 " + timezone;
      }
      else if (parts[5] === "XX") // No second
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":00 " + timezone;
      }
      else // Full date and time
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":" + parts[5] + " " + timezone;
      }
console.log(datestring);
      when.timestamp = MurrixUtils.timestamp(datestring);
console.log(when.timestamp);
      if (when.source.daylightSavings) // TODO: Verify this in some way
      {
        when.timestamp -= 3600;
      }

      callback(null, when);
    }
    else if (when.source.type === "camera")
    {
      if (when.source.reference === "None" || !references || references.length === 0)
      {
        console.log(when.source.datestring, when.source.timezone, MurrixUtils.parseTimezone(when.source.timezone));
        when.timestamp = MurrixUtils.timestamp(when.source.datestring + " " + MurrixUtils.parseTimezone(when.source.timezone));
console.log(when.timestamp);
        // If camera automatically changes it time for daylight savings, we need to compensate for it here
        if (mode === "autoDaylightSavings" || mode === "autoDatetime")
        {
          if (MurrixUtils.isDaylightSavings(when.source.datestring))
          {
            when.timestamp -= 3600;
          }
        }
console.log(when.timestamp);
        callback(null, when);
      }
      else
      {
        when.timestamp = MurrixUtils.timestamp(when.source.datestring + " +00:00");
        var index = false;

        if (when.source.reference === false) // Use default reference
        {
          index = 0;
        }
        else
        {
          for (var n = 0; n < references.length; n++)
          {
            if (references[n]._id === when.source.reference)
            {
              index = n;
              break;
            }
          }
        }

        if (index === false)
        {
          console.log("Could not find the specified reference");

          when.timestamp = MurrixUtils.timestamp(when.source.datestring + " " + MurrixUtils.parseTimezone(when.source.timezone));

          // If camera automatically changes it time for daylight savings, we need to compensate for it here
          if (mode === "autoDaylightSavings" || mode === "autoDatetime")
          {
            if (MurrixUtils.isDaylightSavings(when.source.datestring))
            {
              when.timestamp -= 3600;
            }
          }

          callback(null, when);

          return;
        }

        if (references[index].type === "timezone")
        {
          when.timestamp = MurrixUtils.timestamp(when.source.datestring + " " + MurrixUtils.parseTimezone(references[index].name));

          if (MurrixUtils.isDaylightSavings(when.source.datestring))
          {
            when.timestamp -= 3600;
          }
        }
        else
        {
          when.timestamp += references[index].offset;
        }

        callback(null, when);
      }
    }
    else if (when.source.type === false)
    {
      when.timestamp = false;
      callback(null, when);
    }
    else
    {
      console.log(when);
      console.log("Unknown source type, " + when.source.type);
      callback(null, when);
    }
  };

  self.updateWhenRecursive = function(itemDataList, references, mode, callback)
  {
    if (itemDataList.length === 0)
    {
      callback(null);
      return;
    }

    var itemData = itemDataList.shift();

    // Update all when structures for thise items and save if changed
    self.updateWhen(itemData.when, references, mode, function(error, when)
    {
      if (error)
      {
        console.log("Update of when failed to update, this might leave the database in an inconsitent state!");
        callback(error);
        return;
      }

      if (when.timestamp != itemData.when.timestamp)
      {
        self._saveItem(itemData, function(error, newItemData)
        {
          if (error)
          {
            console.log("Update of when failed to save, this might leave the database in an inconsitent state!");
            callback(error);
            return;
          }

          console.log("Updated when on item " + newItemData._id);
          self.updateWhenRecursive(itemDataList, references, mode, callback);
        });
      }
      else
      {
        console.log("Did not updated when on item " + itemData._id);
        self.updateWhenRecursive(itemDataList, references, mode, callback);
      }
    });
  };

  self.checkItemWhen = function()
  {
    self._find({ 'when.timestamp': false, 'when.source' : { $ne: false } }, "items", function(error, itemDataList)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      for (var n in itemDataList)
      {
        self._saveItem(itemDataList[n], function(error)
        {
          if (error)
          {
            console.log(error);
          }
        });
      }
    });
  };

  self.updateItemWhen = function(itemData, callback)
  {
    if (itemData._with === false)
    {
      self.updateWhen(itemData.when, [], "none", function(error, when)
      {
        if (error)
        {
          callback(error);
          return;
        }

        itemData.when = when;
        callback(null, itemData);
      });
    }
    else
    {
      // Find camera
      self._findOne({ _id: itemData._with }, "nodes", function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        if (!nodeData)
        {
          callback("Could not find a camera with id " + id);
          return;
        }

        self.updateWhen(itemData.when, nodeData.referenceTimelines, nodeData.mode, function(error, when)
        {
          if (error)
          {
            callback(error);
            return;
          }

          itemData.when = when;
          callback(null, itemData);
        });
      });
    }
  };

  self.cameraUpdated = function(cameraNodeData, callback)
  {
    // Find all items with camera as _with
    self._find({ _with: cameraNodeData._id }, "items", function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var list = [];

      for (var n in itemDataList)
      {
        list.push(itemDataList[n]);
      }

      self.updateWhenRecursive(list, cameraNodeData.referenceTimelines, cameraNodeData.mode, function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null);
      });
    });
  };

  self.createReferenceTimeline = function(session, id, reference, callback)
  {
    // Find camera
    self._findOne({ _id: id }, "nodes", function(error, nodeData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!nodeData)
      {
        callback("Could not find a camera with id " + id);
        return;
      }

      // Add reference to list
      nodeData.referenceTimelines = nodeData.referenceTimelines || [];

      nodeData.referenceTimelines.push(reference);

      // Sort reference list
      nodeData.referenceTimelines.sort(function(a, b)
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

      // Save camera
      self._saveNode(nodeData, function(error, newNodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.cameraUpdated(newNodeData, function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          callback(null, newNodeData);
        });
      });
    });
  };

  self.removeReferenceTimeline = function(session, id, referenceId, callback)
  {
    // Find camera
    self._findOne({ _id: id }, "nodes", function(error, nodeData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!nodeData)
      {
        callback("Could not find a camera with id " + id);
        return;
      }

      // Add reference to list
      nodeData.referenceTimelines = nodeData.referenceTimelines || [];

      // Sort reference list
      nodeData.referenceTimelines = nodeData.referenceTimelines.filter(function(element)
      {
        return element._id !== referenceId;
      });

      // Save camera
      self._saveNode(nodeData, function(error, newNodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.cameraUpdated(newNodeData, function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          callback(null, newNodeData);
        });
      });
    });
  };
}

exports.NodeManager = NodeManager;
