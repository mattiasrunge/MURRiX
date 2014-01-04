
define(["knockout"], function(ko)
{
  var server = io.connect();
  
  var user = ko.observable(false);
  var userNode = ko.observable(false);
  
  var nodeId = ko.observable(false);
  var node = ko.observable(false);
  
  var itemId = ko.observable(false);
  var item = ko.observable(false);
  

  server.socket.on("error", function(error)
  {
    console.error("Unable to connect Socket.IO, reason: " + error);
  });

  server.on("connect", function()
  {
    console.info("Successfully established a working connection to server");
  });

  server.on("user.event.current", function(userData)
  {
    console.log("Current user is:" , userData);
    user(userData);
  });
  
  user.subscribe(function(value)
  {
    if (value === false)
    {
      userNode(false);
      return;
    }
    console.log("_person", value._person);
    server.emit("node.find", { query: { _id: value._person } }, function(error, nodeDataList)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      if (nodeDataList.length > 0)
      {
        console.log(nodeDataList[0]);
        userNode(nodeDataList[0]);
      }
      else
      {
        userNode(false);
      }
    });
  });
  
  node.subscribe(function(value)
  {
    if (value)
    {
      value.comments.sort(function(a, b)
      {
        return b.added.timestamp - a.added.timestamp;
      });

      server.emit("user.addVisited", { _id: value._id }, function(error, userData)
      {
        if (error)
        {
          console.log(error);
          return;
        }
        console.log(userData);
        user(userData);
      });
    }
  });

  nodeId.subscribe(function(value)
  {
    if (value === false)
    {
      node(false);
      return;
    }

    server.emit("node.find", { query: { _id: value } }, function(error, nodeDataList)
    {
      if (error)
      {
        node(false);
        console.log(error);
        return;
      }

      if (nodeDataList.length > 0)
      {
        node(nodeDataList[0]);
      }
      else
      {
        node(false);
      }
    });
  });
  
  itemId.subscribe(function(value)
  {
    if (value === false)
    {
      item(false);
      return;
    }

    server.emit("item.find", { query: { _id: value } }, function(error, itemDataList)
    {
      if (error)
      {
        item(false);
        console.log(error);
        return;
      }

      if (itemDataList.length > 0)
      {
        item(itemDataList[0]);
        console.log("Loaded item", item());
      }
      else
      {
        item(false);
      }
    });
  });

  item.subscribe(function(value)
  {
    if (value)
    {
      value.comments.sort(function(a, b)
      {
        return b.added.timestamp - a.added.timestamp;
      });
    }
  });
  
  return {
    server: server,
    user: user,
    userNode: userNode,
    nodeId: nodeId,
    node: node,
    itemId: itemId,
    item: item
  };
});
