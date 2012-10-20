
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
      nodeData.specific = nodeData.specific || {};

    
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

          callback(null, nodeData);
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

          callback(null, nodeData[0]);
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
      if (!itemData._parents || itemData._parents === 0)
      {
        callback("Can not save item without parents!", null);
        return;
      }


      /* Verify attributes for all types */
      itemData.added = itemData.added || { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
      itemData.modified = { timestamp: MurrixUtils.timestamp(), _by: userNode._id };
//       itemData._who = itemData._who || false;
//       itemData._with = itemData._with || false;
//       itemData.when = itemData.when || {};
//       itemData.where = itemData.where || {}
//       itemData.comments = itemData.comments || [];
//       itemData._showing = itemData._showing || [];
//       itemData.removed = itemData.removed || false;
//       itemData.specific = itemData.specific || {};


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
    /* Save the node */
    db.collection("items", function(error, collection)
    {
      if (error)
      {
        callback("Could not get items collection", null);
        return;
      }

      if (itemData._id)
      {
        collection.update({ _id: itemData._id }, itemData, { }, function(error, numberOfUpdatedRows)
        {
          if (error)
          {
            callback("Failed to update item document", null);
            return;
          }

          callback(null, itemData);
        });
      }
      else
      {
        itemData._id = new ObjectID().toString();

        collection.insert(itemData, function(error, itemData)
        {
          if (error)
          {
            callback("Failed to insert item document", null);
            return;
          }

          callback(null, itemData[0]);
        });
      }
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

      itemData.specific = {};
      itemData._parents = [ parentId ];
      itemData.what = "file";
      
      itemData.specific.name = name;
      itemData.specific.exif = file.exif
      itemData.specific.angle = 0;
      itemData.specific.mirror = 0;

      if (file.exif.GPSDateTime)
      {
        parts = file.exif.GPSDateTime.split(" ")
        parts[0] = parts[0].replace(/:/g, "-")
        parts.push("+00:00");

        var datetime = parts.join(" ");

        var timestamp = MurrixUtils.timestamp(datetime);
        itemData.when = { timestamp: timestamp, source: "gps" };
      }
      else if (file.exif.DateTimeOriginal)
      {
        parts = file.exif.DateTimeOriginal.split(" ")
        parts[0] = parts[0].replace(/:/g, "-")
        parts.push("+00:00");

        var datetime = parts.join(" ");

        var timestamp = MurrixUtils.timestamp(datetime);
        itemData.when = { timestamp: timestamp, source: "exif" };
      }

      // TODO: Set _with from exif if possible

      if (file.exif.Orientation)
      {
        switch (file.exif.Orientation)
        {
          case 1: //Normal
          {
//             itemData.specific.angle = 0;
            break;
          }
          case 8: // 270 CW (90 CCW)
          {
            itemData.specific.angle = 90;
            break;
          }
          case 6: // 90 CW (270 CCW)
          {
            itemData.specific.angle = 270;
            break;
          }
          case 3: // 180 CW (180 CCW)
          {
            itemData.specific.angle = 180;
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
        itemData.specific.where = {};

        if (file.exif.GPSAltitude)
        {
          itemData.specific.where.altitude = file.exif.GPSAltitude;
        }
        
        itemData.specific.where.longitude = file.exif.GPSLongitude;
        itemData.specific.where.latitude = file.exif.GPSLatitude;
        itemData.specific.where.source = "gps";
      }

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
      self.countItem(session, { _id: itemId }, "items", function(error, count)
      {
        if (error)
        {
          callback("Could not get rights on item!", null);
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

            self.find(session, { _id: nodeId }, "items", function(error, nodeDataList)
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
          query.$or = [];

          query.$or.push({ "added._by": user._id });
          query.$or.push({ _id: user._id });
        
          if (adminRequired)
          {
            if (user._groups && user._groups.length > 0)
            {
              query.$or.push({ _admins: { $in: user._groups } });
            }
          }
          else
          {
            query.$or.push({ public: true });
        
            if (user._groups && user._groups.length > 0)
            {
              query.$or.push({ _readers: { $in: user._groups } });
              query.$or.push({ _admins: { $in: user._groups } });
            }
          }

          query.removed = { $exists: false };
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

        query.removed = { $exists: false };
      }
      
      console.log(JSON.stringify(query));
      callback(null, query);
    });
  };

  self.findOne = function(session, query, options, callback)
  {
    if ((typeof options === "string" ? options : options.collection) == "items")
    {
      self._findOne(session, query, options, callback);
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

      self._findOne(session, query, options, callback);
    });
  };

  self._findOne = function(session, query, options, callback)
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
    if ((typeof options === "string" ? options : options.collection) == "items")
    {
      self._find(session, query, options, callback);
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
      
      self._find(session, query, options, callback);
    });
  };

  self._find = function(session, query, options, callback)
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

      if (options.limit !== null)
      {
        limit = options.limit;
      }

      if (options.skip !== null)
      {
        skip = options.skip;
      }

      collection.find(query, function(error, cursor)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }

        var nodeDataList = {};
        
        cursor.skip(skip).limit(limit).each(function(error, nodeData)
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
}

exports.NodeManager = NodeManager;
