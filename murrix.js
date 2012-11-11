
/* Includes, TODO: Sanitize case */
var nodeStatic = require('node-static');
var httpServer = require('http').createServer(httpRequestHandler);
var url = require('url');
var io = require('socket.io').listen(httpServer);
var fs = require('fs');
var path = require('path');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var Session = require('./lib/session').Session;
var User = require('./lib/user').User;
var NodeManager = require('./lib/node.js').NodeManager;
var MurrixUtils = require('./lib/utils.js');
var UploadManager = require('./lib/upload.js').UploadManager;

/* Configuration options, TODO: Move to another file */
var configuration = {};

configuration.databaseHost = "localhost";
configuration.databasePort = 27017;
configuration.databaseName = "murrix";
configuration.httpPort = 8080;
configuration.filesPath = "/mnt/raid/www/murrix.runge.se/files/";
configuration.previewsPath = "../previews/";
configuration.sessionName = "murrix";

/* Instances */
var mongoServer = new mongo.Server(configuration.databaseHost, configuration.databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(configuration.databaseName, mongoServer);
var session = new Session(mongoDb, configuration);
var user = new User(mongoDb);
var nodeManager = new NodeManager(mongoDb, user);
var uploadManager = new UploadManager(configuration);
var fileServer = new nodeStatic.Server("./public");


/* Connect to database */
mongoDb.open(function(error, mongoDb)
{
  if (error)
  {
    console.log("Failed to connect to mongoDB");
    return;
  }

  console.log("We are connected to mongo DB");

  user.checkAdminUser(function(error)
  {
    if (error)
    {
      console.log(error);
      exit(1);
    }
  });
});

/* Start to listen to HTTP */
httpServer.listen(configuration.httpPort);


function httpRequestHandler(request, response)
{
  session.start(request, response, function(error, session)
  {
    if (error)
    {
      response.statusCode = 500;
      return response.end("Error starting session");
    }

    var requestParams = url.parse(request.url, true);

    if (requestParams.pathname === "/" || requestParams.pathname === "/index.html" || requestParams.pathname === "/index.htm")
    {
      MurrixUtils.getTemplateFile("./public/index.html", function(error, data)
      {
        if (error)
        {
          response.writeHead(404);
          response.end(error);
          return;
        }
        
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(data);
      });
    }
    else if (requestParams.pathname === "/preview")
    {
      MurrixUtils.getPreview(session, nodeManager, requestParams.query.id, requestParams.query.width, requestParams.query.height, requestParams.query.square, function(error, filename)
      {
        if (error)
        {
          response.writeHead(404);
          response.end(error);
          return;
        }

        filename = path.basename(filename);

        fileServer.serveFile(configuration.previewsPath + filename, 200, {}, request, response);
      });
    }
    else
    {
      fileServer.serve(request, response, function(error, result)
      {
        if (error)
        {
          console.log("Error serving " + request.url + " - " + error.message);

          response.writeHead(error.status, error.headers);
          response.end();
        }
      });
    }
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

        
        var cookies = MurrixUtils.parseCookieString(handshakeData.headers.cookie);
        
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
    console.log("Could not find session!");
    client.emit("connection_established", { error: error, text: "Could not find session" });
    return;
  }


  /* Emit connection established event to client and supply the current user if any */
  user.getUser(client.handshake.session, function(error, userData)
  {
    if (error)
    {
      console.log("Could not get user information");
      client.emit("connection_established", { error: error, text: "Could not get user information" });
      return;
    }

    client.emit("connection_established", { userData: userData });
  });


  /* User API */
  client.on("login", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.login!");
      return;
    }
  
    user.login(client.handshake.session, data.username, data.password, callback);
  });

  client.on("logout", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.logout!");
      return;
    }
  
    user.logout(client.handshake.session, callback);
  });

  client.on("changePassword", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.changePassword!");
      return;
    }
  
    user.changePassword(client.handshake.session, data.id, data.password, callback);
  });

  client.on("findGroups", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.findGroups!");
      return;
    }

    user.findGroups(client.handshake.session, data.query || {}, data.options || {}, callback);
  });
  
  client.on("findUsers", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.findUsers!");
      return;
    }

    user.findUsers(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("saveGroup", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.saveGroup!");
      return;
    }
  
    user.saveGroup(client.handshake.session, data, callback);
  });

  client.on("saveUser", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.saveUser!");
      return;
    }
  
    user.saveUser(client.handshake.session, data, callback);
  });

  client.on("removeGroup", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.removeGroup!");
      return;
    }
  
    user.removeGroup(client.handshake.session, data, callback);
  });

  client.on("removeUser", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.removeUser!");
      return;
    }
  
    user.removeUser(client.handshake.session, data, callback);
  });

  
  /* Node API */
  client.on("saveNode", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.saveNode!");
      return;
    }

    nodeManager.saveNode(client.handshake.session, data, callback);
  });

  client.on("saveItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.saveItem!");
      return;
    }

    nodeManager.saveItem(client.handshake.session, data, callback);
  });

  client.on("createFileItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.createFileItem!");
      return;
    }

    nodeManager.createFileItem(client.handshake.session, uploadManager, data.name, data.uploadId, data.parentId, callback);
  });

  client.on("commentNode", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.commentNode!");
      return;
    }

    nodeManager.commentNode(client.handshake.session, data.id, data.text, callback);
  });

  client.on("commentItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.commentItem!");
      return;
    }

    nodeManager.commentItem(client.handshake.session, data.id, data.text, callback);
  });

  client.on("findRandom", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.findRandom!");
      return;
    }

    nodeManager.findRandom(client.handshake.session, data, callback);
  });

  client.on("find", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.find!");
      return;
    }

    nodeManager.find(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("count", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.count!");
      return;
    }

    nodeManager.count(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("distinct", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.distinct!");
      return;
    }

    nodeManager.distinct(client.handshake.session, data.query || {}, data.options || {}, callback);
  });


  client.on("detectFaces", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for MurrixUtils.detectFaces!");
      return;
    }

    MurrixUtils.detectFaces(configuration.filesPath + data, callback);
  });

  /* Upload file API */
  client.on("fileStart", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for uploadManager.start!");
      return;
    }

    uploadManager.start(client.handshake.session, data.size, data.filename, callback);
  });

  client.on("fileChunk", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for uploadManager.chunk!");
      return;
    }

    uploadManager.chunk(client.handshake.session, data.id, data.data, callback);
  });
});
