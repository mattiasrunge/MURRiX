
function NodeManager(db)
{
  var self = this;


  self.save = function(session, nodeData, callback)
  {
    // TODO: Verify that user is not anonymous or user has rights on node

    // TODO: Verify that type is allowed

    // TODO: Make sure that all required elements for type are present

    // TODO: Write nodeData to db

    // TODO: Return new/updated node in callback
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
    // TODO: Run query in nodes collection

    // TODO: Filter out nodes where the user does not have access
  };

  self.findPositions = function(session, query, callback)
  {
    // TODO: Run the query in the positions collection

    // TODO: Filter out positions for nodes where the user does not have access
  };
}

exports.NodeManager = NodeManager;
