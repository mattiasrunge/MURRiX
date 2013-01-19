
/* Includes, TODO: Sanitize case */
var nodeStatic = require('node-static');
var httpServer = require('http').createServer(httpRequestHandler);
var vidStreamer = require('vid-streamer');
var url = require('url');
var io = require('socket.io').listen(httpServer, { log: false });
var fs = require('fs');
var path = require('path');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var Session = require('./lib/session').Session;
var User = require('./lib/user').User;
var NodeManager = require('./lib/node.js').NodeManager;
var MurrixWhen = require('./lib/when.js').When;
var MurrixUtils = require('./lib/utils.js');
var MurrixMedia = require('./lib/media.js');
var UploadManager = require('./lib/upload.js').UploadManager;

/* Configuration options */
var configuration = require('./configuration.js').Configuration;

/* Instances */
var mongoServer = new mongo.Server(configuration.databaseHost, configuration.databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(configuration.databaseName, mongoServer);
var session = new Session(mongoDb, configuration);
var user = new User(mongoDb);
var nodeManager = new NodeManager(mongoDb, user);
var murrixWhen = new MurrixWhen();
var uploadManager = new UploadManager(configuration);
var fileServer = new nodeStatic.Server("./public", { cache: false });


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



var videoStreamer = vidStreamer.settings({
  "mode": "production",
  "forceDownload": false,
  "random": false,
  "rootFolder": configuration.mediaCachePath,
  "rootPath": "",
  "server": "MURRiX"
});

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
      MurrixMedia.getPreview(session, nodeManager, requestParams.query.id, requestParams.query.width, requestParams.query.height, requestParams.query.square, function(error, filename)
      {
        if (error)
        {
          response.writeHead(404);
          response.end(error);
          return;
        }

        console.log(request.url);
        request.url = "/" + path.basename(filename);
        console.log(request.url);
        videoStreamer(request, response);
      });
    }
    else if (requestParams.pathname === "/video")
    {
      MurrixMedia.getVideo(session, nodeManager, requestParams.query.id, function(error, filename)
      {
        try
        {
          if (error)
          {
            response.writeHead(404);
            response.end(error);
            return;
          }

          console.log(request.url);
          request.url = "/" + path.basename(filename);
          console.log(request.url);
          videoStreamer(request, response);
        }
        catch (e)
        {
          console.log(e.toString());
        }
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

  client.on("findNodesByYear", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.findNodesByYear!");
      return;
    }

    nodeManager.findNodesByYear(client.handshake.session, data, callback);
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

  client.on("group", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.group!");
      return;
    }

    nodeManager.group(client.handshake.session, data.reduce || {}, data.options || {}, callback);
  });


  client.on("clearCache", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for MurrixMedia.clearCache!");
      return;
    }

    MurrixMedia.clearCache(session, data, callback);
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


  /* When API */
  client.on("updateWhen", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for murrixWhen.updateWhen!");
      return;
    }

    murrixWhen.updateWhen(client.handshake.session, data.when, data.references, data.mode, callback);
  });

  client.on("createReferenceTimeline", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for murrixWhen.createReferenceTimeline!");
      return;
    }

    murrixWhen.createReferenceTimeline(client.handshake.session, nodeManager, data.id, data.reference, callback);
  });

  client.on("removeReferenceTimeline", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for murrixWhen.removeReferenceTimeline!");
      return;
    }

    murrixWhen.removeReferenceTimeline(client.handshake.session, nodeManager, data.id, data.referenceId, callback);
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
