
var ObjectID = require('mongodb').ObjectID;

function NodeManager(db, user)
{
  var self = this;

  self.allowedTypes = [ "event", "person", "location", "vehicle", "file" ];

  self.save = function(session, nodeData, callback)
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

      if (!nodeData.type || nodeData.type === "" || self.allowedTypes.indexOf(nodeData.type) === -1)
      {
        callback("Type of node is undefined or not allowed!", null);
        return;
      }


      /* Verify attributes for all types */
      nodeData.description = nodeData.description || "";
      nodeData._addedBy = userNode ? userNode._id : false;
      nodeData._relations = nodeData._relations || [];
      nodeData.comments = nodeData.comments || [];
      nodeData.texts = nodeData.texts || [];
      nodeData.addedDatetime = new Date().getTime();
      nodeData.modifiedDatetime = new Date().getTime();
      nodeData._readAccess = nodeData._readAccess || [];
      nodeData._adminAccess = nodeData._adminAccess || [];
      nodeData.publicAccess = nodeData.publicAccess || false;
      nodeData.tags = nodeData.tags || [];


      /* Verify required attributes for specific types */
      switch (nodeData.type)
      {
        case "file":
        {
          if (!nodeData._parentNode || nodeData._parentNode === false)
          {
            callback("File node needs to have a well defined parent node!", null);
            return;
          }
          
          break;
        }
        case "event":
        {
          break;
        }
        case "person":
        {
          break;
        }
        case "location":
        {
          break;
        }
        case "vehicle":
        {
          break;
        }
      }

    
      /* Check that admin rights are available */
      var nodeIdToCheck = null;
      
      if (nodeData.type === "file")
      {
        nodeIdToCheck = nodeData._parentNode;
      }
      else if (nodeData._id)
      {
        /* If this is a new node saving is allowed if logged in (checked earlier), 
         * but if this is a save action, the user must have admin access to the
         * current node. */
        nodeIdToCheck = nodeData._id;
      }
      
      
      if (nodeIdToCheck)
      {
        /* If this is a file the user must have admin rights on the parent */
        self.addAccessCheckToQuery(session, { _id: nodeIdToCheck }, true, function(error, query)
        {
          if (error)
          {
            callback("Could not add access checks to query!", null);
            return;
          }
          
          if (query === false)
          {
            callback("No rights on parent, can not change/create file", null);
            return;
          }
          
          self._count(session, query, function(error, count)
          {
            if (error)
            {
              callback("Could not fetch parent node to check rights!", null);
              return;
            }
            
            if (count === 0)
            {
              callback("No rights on parent, can not change/create file!", null);
              return;
            }
            
            self._save(nodeData, callback);
          });
        });
      }
      else
      {
        self._save(nodeData, callback);
      }
    });
  };  

  self._save = function(nodeData, callback)
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
            callback("Failed to update document", null);
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
            callback("Failed to insert document", null);
            return;
          }

          callback(null, nodeData[0]);
        });
      }
    });
  };

  self.createFile = function(session, uploadManager, name, uploadId, parentId, callback)
  {
    uploadManager.find(session, uploadId, function(error, file)
    {
      if (error)
      {
        callback("Could not find uploaded file with id " + uploadId, null);
        return;
      }

      var nodeData = {};

      nodeData.type = "file";
      nodeData.name = name;
      nodeData._parentNode = parentId;
      nodeData.imageRegions = [];
      nodeData._createdByPerson = false;
      nodeData._createdByDevice = false; // TODO: Make sure we can not find this out with certainty from the EXIF data
      nodeData.imageRegions = [];
      nodeData.exif = file.exif
      nodeData.angle = 0;
      nodeData.mirror = 0;
      nodeData.position = false;


      if (file.exif.GPSDateTime)
      {
        nodeData._createdDateTime = { datetime: file.exif.GPSDateTime, source: "gps" }; // TODO: Fix date and time format and time zone
      }
      else if (file.exif.DateTimeOriginal)
      {
        nodeData._createdDateTime = { datetime: file.exif.DateTimeOriginal, source: "exif" }; // TODO: Fix date and time format
      }

      if (file.exif.Orientation)
      {
        switch (file.exif.Orientation)
        {
          case 1: //Normal
          {
            nodeData.angle = 0;
            break;
          }
          case 8: // 270 CW (90 CCW)
          {
            nodeData.angle = 90;
            break;
          }
          case 6: // 90 CW (270 CCW)
          {
            nodeData.angle = 270;
            break;
          }
          case 3: // 180 CW (180 CCW)
          {
            nodeData.angle = 180;
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
        nodeData.position = {};

        position.altitude = file.exif.GPSAltitude || 0;
        position.type = file.exif.GPSAltitude ? "3D": "2D";
        position.longitude = file.exif.GPSLongitude;
        position.latitude = file.exif.GPSLatitude;
        position.source = "gps";
      }

      self.save(session, nodeData, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.find(session, { _id: nodeData._parentNode }, function(error, nodeDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          uploadManager.moveFile(session, file.id, "/mnt/raid/www/temp.runge.se/repos/MURRiX/files/" + nodeData._id, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, nodeData, nodeDataList[nodeData._parentNode]);
          });
        });
      });
    });
  };

  self.comment = function(session, nodeId, text, callback)
  {
    user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback("Could not get user", null);
        return;
      }

      self.count(session, { _id: nodeId }, function(error, count)
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
          
          comment.addedDatetime = new Date().getTime();
          comment._addedBy = userNode ? userNode._id : false;
          comment.text = text;

          collection.update({ _id: nodeId }, { modifiedDatetime: new Date().getTime(), "$push" : { comments: comment } }, function(error, nodeData)
          {
            if (error)
            {
              callback("Failed to update document", null);
              return;
            }

            callback(null, nodeData[0]);
          });
        });
      });
    });
  };

  self.addPositions = function(session, nodeId, positionList, callback)
  {
    // TODO: Verify that the user has rights on node

    // TODO: Add positions to database

    // TODO: Call callback with added positions
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
        if (!user.user.admin)
        {
          if (adminRequired)
          {
            query.$or = [ { _addedBy: user._id } ]; // , { _adminAccess: { $in: user.user._groups } }
          }
          else
          {
            query.$or = [ { publicAccess: true }, { _addedBy: user._id } ]; // , { _readAccess: { $in: user.user._groups } }
          }

          query.trashed = { $exists: false };
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
          query.publicAccess = true;
        }

        query.trashed = { $exists: false };
      }
      
      console.log(query);
      callback(null, query);
    });
  };

  self.findOne = function(session, query, callback)
  {
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

      self._findOne(session, query, callback);
    });
  };

  self._findOne = function(session, query, callback)
  {
    db.collection("nodes", function(error, collection)
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
  
  self.find = function(session, query, callback)
  {
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
      
      self._find(session, query, callback);
    });
  };

  self._find = function(session, query, callback)
  {
    db.collection("nodes", function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      var limit = 0;
      var skip = 0;

      if (query.$limit !== null)
      {
        limit = query.$limit;
        delete query.$limit;
      }

      if (query.$skip !== null)
      {
        skip = query.$skip;
        delete query.$skip;
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

  self.count = function(session, query, callback)
  {
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

      self._count(session, query, callback);
    });
  };


  self._count = function(session, query, callback)
  {
    db.collection("nodes", function(error, collection)
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
            callback("Could not run count on cursor!", null);
            return;
          }

          callback(null, count);
        });
      });
    });
  };

  self.distinct = function(session, query, callback)
  {
    db.collection("nodes", function(error, collection)
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


  self.findPositions = function(session, query, callback)
  {
    // TODO: Run the query in the positions collection

    // TODO: Filter out positions for nodes where the user does not have access
  };
}

exports.NodeManager = NodeManager;
