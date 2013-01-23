
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

var SessionManager = require('msession.js').Manager;

var User = require('./lib/user').User;
var NodeManager = require('./lib/node.js').NodeManager;
var MurrixUtils = require('./lib/utils.js');
var MurrixMedia = require('./lib/media.js');
var UploadManager = require('./lib/upload.js').UploadManager;

/* Configuration options */
var configuration = MurrixUtils.getConfiguration(path.resolve("./config.json"));

/* Instances */
var mongoServer = new mongo.Server(configuration.databaseHost, configuration.databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(configuration.databaseName, mongoServer);

var sessionManager = new SessionManager();

var user = new User(mongoDb);
var nodeManager = new NodeManager(mongoDb, user);
var uploadManager = new UploadManager(configuration);
var fileServer = new nodeStatic.Server("./public", { cache: false });
var fileServer2 = new nodeStatic.Server("./files", { cache: false });

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

  nodeManager.checkItemWhen();
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
  sessionManager.start(request, response, function(error, session)
  {
    if (error)
    {
      response.writeHead(500);
      return response.end(error);
    }

    var requestParams = url.parse(request.url, true);

    if (requestParams.pathname === "/" || requestParams.pathname === "/index.html" || requestParams.pathname === "/index.htm")
    {
      MurrixUtils.getTemplateFile("./public/index.html", function(error, data)
      {
        if (error)
        {
          response.writeHead(404);
          return response.end(error);
        }

        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(data);
      });
    }
    else if (requestParams.pathname === "/file")
    {
      nodeManager.find(session, { _id: requestParams.query.id }, "items", function(error, itemDataList)
      {
        if (error)
        {
          response.writeHead(404);
          return response.end(error);
        }

        if (!itemDataList[requestParams.query.id])
        {
          response.writeHead(404);
          return response.end("Could not find the requested item");
        }

        var itemData = itemDataList[requestParams.query.id];

        if (itemData.what !== "file")
        {
          response.writeHead(404);
          return response.end("The requested item is not a file");
        }

        var filename = false;
        var name = false;
        var size = false;

        if (requestParams.query.version)
        {
          if (!itemData.versions)
          {
            response.writeHead(404);
            return response.end("Could not find the requested version");
          }

          for (var n = 0; n < itemData.versions.length; n++)
          {
            filename = itemData.versions[n]._id;
            name = itemData.versions[n].name;
            size = itemData.versions[n].size;
          }
        }
        else
        {
          filename = itemData._id;
          name = itemData.name;
          size = itemData.exif.FileSize;
        }

        if (filename === false)
        {
          response.writeHead(404);
          return response.end("Could not find the requested version");
        }

        console.log("Serving file " + filename);

        var headers = {};

        headers["Expires"] = 0;
        headers["Cache-Control"] = "must-revalidate, post-check=0, pre-check=0";
        headers["Content-Type"] = "application/force-download";
        headers["Content-Disposition"] = "attachment; filename=" + name + ";";
        headers["Content-Transfer-Encoding"] = "binary";
        headers["Content-Length"] = size;

        fileServer2.serveFile(requestParams.query.id, 200, headers, request, response);
      });
    }
    else if (requestParams.pathname === "/preview")
    {
      MurrixMedia.getPreview(session, nodeManager, requestParams.query.id, requestParams.query.width, requestParams.query.height, requestParams.query.square, function(error, filename)
      {
        if (error)
        {
          response.writeHead(404);
          return response.end(error);
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
            return response.end(error);
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
      return;
    }

    sessionManager.findByCookieString(handshakeData.headers.cookie, function(error, session, cookies)
    {
      if (error)
      {
        callback(error, false);
        return;
      }

      if (session === false)
      {
        callback("No session found!", false);
        return;
      }

      handshakeData.session = session;

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
  client.on("createReferenceTimeline", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.createReferenceTimeline!");
      return;
    }

    nodeManager.createReferenceTimeline(client.handshake.session, data.id, data.reference, callback);
  });

  client.on("removeReferenceTimeline", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.removeReferenceTimeline!");
      return;
    }

    nodeManager.removeReferenceTimeline(client.handshake.session, data.id, data.referenceId, callback);
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
