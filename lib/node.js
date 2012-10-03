
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
      
      collection.find(query, function(error, cursor)
      {
        if (error)
        {
          callback("Could not get run query", null);
          return;
        }
        
        var nodeDataList = {};
        
        cursor.each(function(error, nodeData)
        {
          console.log(error, nodeData);
          
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
