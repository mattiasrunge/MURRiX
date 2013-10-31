
var Logger = require("./logger");
var sessions = require("./session");
var logger = new Logger("client");

var namespaces = {};
var clients = [];

namespaces["user"] = require("./client/user");
namespaces["group"] = require("./client/group");
namespaces["node"] = require("./client/node");

function bindApi(client)
{
  for (var namespaceName in namespaces)
  {
    for (var fnName in namespaces[namespaceName])
    {
      if (fnName === "event")
      {
        continue;
      }

      var name = namespaceName + "." + fnName;

      client.on(name, function(name)
      {
        return function(args, callback)
        {
          var session = sessions.get(client.handshake.sessionId);
          exports.call(session, name, args, callback || function() {});
        };
      }(name));
    }
  }
}

function getClientFromSession(session)
{
  for (var n = 0; n < clients.length; n++)
  {
    if (clients[n].handshake && clients[n].handshake.sessionId === session._id)
    {
      return clients[n];
    }
  }

  return false;
}

exports.call = function(session, name, args, callback)
{
  var parts = name.split(".");

  callback = callback || function() {};

  if (parts.length < 2)
  {
    callback("Invalid name " + name);
    return;
  }
  else if (!namespaces[parts[0]])
  {
    callback("Unknown namespaces name " + parts[0]);
    return;
  }
  else if (!namespaces[parts[0]][parts[1]])
  {
    callback("Unknown function name " + parts[1]);
    return;
  }

  namespaces[parts[0]][parts[1]](session, args, callback);
};

exports.trigger = function(session, name, args, callback)
{
  var client = getClientFromSession(session);
  var parts = name.split(".");

  callback = callback || function() {};

  if (parts.length < 3)
  {
    callback("Invalid name " + name);
    return;
  }
  else if (!namespaces[parts[0]])
  {
    callback("Unknown namespaces name " + parts[0]);
    return;
  }
  else if (parts[1] !== "event")
  {
    callback("Can only trigger events, invalid name " + name);
    return;
  }
  else if (!namespaces[parts[0]][parts[1]] || !namespaces[parts[0]][parts[1]][parts[2]])
  {
    callback("Unknown event name " + parts[1]);
    return;
  }

  namespaces[parts[0]][parts[1]][parts[2]](session, args, function(error)
  {
    if (error)
    {
      logger.error("Failed to call client, reason: " + error);
      callback(error);
      return;
    }

    var outArgs = Array.prototype.slice.call(arguments);
    outArgs[0] = name;

    client.emit.apply(client, outArgs);
  });
};

exports.add = function(client)
{
  logger.info("Client connected");
  clients.push(client);

  bindApi(client);

  client.on("disconnect", function()
  {
    logger.info("Client disconnected");
    clients.slice(clients.indexOf(client), 1);
  });
};

exports.broadcast = function(name, args)
{
  for (var n = 0; n < clients.length; n++)
  {
    var session = sessions.get(clients[n].handshake.sessionId);

    exports.trigger(session, name, args);
  }
};
