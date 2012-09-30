var static = require('node-static');
var httpServer = require('http').createServer(httpRequestHandler);
var url = require('url');
var io = require('socket.io').listen(httpServer);
var fs = require('fs');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var Session = require('./lib/session').Session;
var User = require('./lib/user').User;


var databaseHost = "localhost";
var databasePort = 27017;
var databaseName = "murrix";
var httpPort = 8080;


var mongoServer = new mongo.Server(databaseHost, databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(databaseName, mongoServer);
var session = new Session(mongoDb, "murrix");
var user = new User(mongoDb);

var fileServer = new static.Server("./public");

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

        callback(null, true);
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
});
