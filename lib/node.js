
var ObjectID = require('mongodb').ObjectID;

function NodeManager(db, user)
{
  var self = this;

  self.allowedTypes = [ "event", "person", "location", "vehicle", "file" ];

  self.save = function(session, nodeData, callback)
  {
    /* Check that we are not the anonymous user */
    if (!session.document._user)
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
    nodeData._addedBy = session.document._user || false;
    nodeData._relations = nodeData._relations || [];
    nodeData.comments = nodeData.comments || [];
    nodeData.texts = nodeData.texts || [];
    nodeData.addedDatetime = new Date().getTime();
    nodeData.modifiedDatetime = new Date().getTime();
    nodeData._readAccess = nodeData._readAccess || [];
    nodeData._adminAccess = nodeData._adminAccess || [];


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
    if (nodeData.type === "file")
    {
      /* If this is a file the user must have admin rights on the parent */
      if (!self.hasAdminAccess(nodeData._parentNode))
      {
        callback("User has no rights on parent node of this file!", null);
        return;
      }
    }
    else
    {
      /* If this is a new node saving is allowed if logged in (checked earlier), 
       * but if this is a save action, the user must have admin access to the
       * current node. */

      if (nodeData._id && !self.hasAdminAccess(nodeData._id))
      {
        callback("User has no rights on node!", null);
        return;
      }
    }
    

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
        collection.update({ _id: nodeData._id }, nodeData, function(error, nodeData)
        {
          if (error)
          {
            callback("Failed to update document", null);
            return;
          }
console.log(nodeData);
          callback(null, nodeData[0]);
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
console.log(nodeData);
          callback(null, nodeData[0]);
        });
      }
    });
  };

  self.trash = function(session, nodeId, callback)
  {
    // TODO: Verify that the user has rights on node

    // TODO: Mark as deleted for admin to purge

    // TODO: Mark all direct sub nodes as trash (files and positions)
  };
  
  self.comment = function(session, nodeId, text, callback)
  {
    // TODO: Make sure node type is commentable

    // TODO: Return updated node in callback
  };

  self.addPositions = function(session, nodeId, positionList, callback)
  {
    // TODO: Verify that the user has rights on node

    // TODO: Add positions to database

    // TODO: Call callback with added positions
  };

  self.find = function(session, query, callback)
  {
    db.collection("nodes", function(error, collection)
    {
      if (error)
      {
        callback("Could not get nodes collection", null);
        return;
      }

      user.getUser(session, function(error, user)
      {
        if (error)
        {
          callback("Could not get user", null);
          return;
        }
      
        query._readAccess = { "$in": user.user._groups };

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
    });
  };

  self.findPositions = function(session, query, callback)
  {
    // TODO: Run the query in the positions collection

    // TODO: Filter out positions for nodes where the user does not have access
  };
}

exports.NodeManager = NodeManager;
