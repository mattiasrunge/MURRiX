var nodeStatic = require('node-static');
var httpServer = require('http').createServer(httpRequestHandler);
var url = require('url');
var io = require('socket.io').listen(httpServer);
var fs = require('fs');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var Session = require('./lib/session').Session;
var User = require('./lib/user').User;
var NodeManager = require('./lib/node.js').NodeManager;

var databaseHost = "localhost";
var databasePort = 27017;
var databaseName = "murrix";
var httpPort = 8080;


var mongoServer = new mongo.Server(databaseHost, databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(databaseName, mongoServer);
var session = new Session(mongoDb, "murrix");
var user = new User(mongoDb);
var nodeManager = new NodeManager(mongoDb);
var fileServer = new nodeStatic.Server("./public");

mongoDb.open(function(error, mongoDb)
{
  if (error)
  {
    console.log("Failed to connect to mongoDB");
    return;
  }

  console.log("We are connected to mongo DB");
});

httpServer.listen(httpPort);


function httpRequestHandler(request, response)
{
  session.start(request, response, function(error, session)
  {
    if (error)
    {
      response.statusCode = 500;
      console.log(response);
      return response.end("Error starting session");
    }

    var requestParams = url.parse(request.url, true);

    //console.log(requestParams);

    fileServer.serve(request, response, function(error, result)
    {

      //console.log(error, result);

      if (error)
      {
        console.log("Error serving " + request.url + " - " + error.message);

        response.writeHead(error.status, error.headers);
        response.end();
      }
    });
  });
}

io.configure(function()
{
  io.set("authorization", function(handshakeData, callback)
  {
    if (handshakeData.xdomain)
    {
      callback("Cross domain access is not allowed!", false);
    }
    else
    {
      var sessionId = session.getIdFromCookieString(handshakeData.headers.cookie);

      session.find(sessionId, function(error, session)
      {
        if (error)
        {
          console.log("Failed to find session for session id " + sessionId);
          callback("Failed to find session for session id " + sessionId, false);
          return;
        }

        handshakeData.session = session;

        
        var cookies = {};
        
        handshakeData.headers.cookie.split(';').forEach(function(cookie)
        {
          var parts = cookie.split('=');
          cookies[parts[0].trim()] = (parts[1] || '').trim();
        });

        if (cookies.userinfo)
        {
          var userinfo = JSON.parse(unescape(cookies.userinfo));

          user.login(session, userinfo.username, userinfo.password, function(error)
          {
            callback(null, true);
          });
        }
        else
        {
          callback(null, true);
        }
      });
    }
  });
});

io.sockets.on("connection", function(client)
{
  /* A session should already be started, if not we will do nothing */
  if (!client.handshake.session)
  {
    console.log("Unknown session!");
    return;
  }


  /* Emit connection established event to client and supply the current user if any */
  user.getUser(client.handshake.session, function(error, userNode)
  {
    if (error)
    {
      console.log("Could not get user information");
      client.emit("connection_established", { error: error, text: "Could not get user information" });
      return;
    }

    client.emit("connection_established", { userNode: userNode });
  });


  /* User API */
  client.on("login", function(data, callback)
  {
    user.login(client.handshake.session, data.username, data.password, function(error, userNode)
    {
      if (callback)
      {
        callback(error, userNode);
      }
    });
  });

  client.on("logout", function(data, callback)
  {
    user.logout(client.handshake.session, function(error)
    {
      if (callback)
      {
        callback(error);
      }
    });
  });

  client.on("changePassword", function(data, callback)
  {
    user.changePassword(client.handshake.session, data.password, function(error)
    {
      if (callback)
      {
        callback(error);
      }
    });
  });

  
  /* Node API */
  client.on("create", function(data, callback)
  {
    nodeManager.create(client.handshake.session, data.nodeData, function(error, nodeData)
     {
       if (callback)
       {
         callback(error, nodeData);
       }
     });
  });

  client.on("trash", function(data, callback)
  {
    nodeManager.trash(client.handshake.session, data.nodeId, function(error)
    {
      if (callback)
      {
        callback(error);
      }
    });
  });

  client.on("comment", function(data, callback)
  {
    nodeManager.comment(client.handshake.session, data.nodeId, data.text, function(error, nodeData)
    {
      if (callback)
      {
        callback(error, nodeData);
      }
    });
  });

  client.on("addPositions", function(data, callback)
  {
    nodeManager.addPositions(client.handshake.session, data.nodeId, data.positionList, function(error, positionList)
    {
      if (callback)
      {
        callback(error, positionList);
      }
    });
  });

  client.on("find", function(data, callback)
  {
    nodeManager.find(client.handshake.session, data.query, function(error, nodeDataList)
    {
      if (callback)
      {
        callback(error, nodeDataList);
      }
    });
  });

  client.on("findPositions", function(data, callback)
  {
    nodeManager.findPositions(client.handshake.session, data.query, function(error, positionList)
    {
      if (callback)
      {
        callback(error, positionList);
      }
    });
  });

});
