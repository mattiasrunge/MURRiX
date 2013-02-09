
/* Includes, TODO: Sanitize case */
var nodeStatic = require("node-static");
var httpServer = require("http").createServer(httpRequestHandler);
var vidStreamer = require("vid-streamer");
var url = require("url");
var io = require("socket.io").listen(httpServer, { log: false });
var path = require("path");
var events = require("events");
var util = require("util");


// TODO: This is a hack!
var fileServer = new nodeStatic.Server("./public", { cache: false });
var fileServer2 = new nodeStatic.Server("./files", { cache: false });


var SessionManager = require("msession.js").Manager;

var MurrixLoggerManager = require("./lib/logger.js").Manager;
var MurrixConfigurationManager = require("./lib/config.js").Manager;
var MurrixDatabaseManager = require("./lib/db.js").Manager;
var MurrixCacheManager = require("./lib/cache.js").Manager;
var MurrixUploadManager = require("./lib/upload.js").Manager;
var MurrixUtilsManager = require("./lib/utils.js").Manager;
var MurrixUserManager = require("./lib/user.js").Manager;
var MurrixTriggersManager = require("./lib/triggers.js").Manager;


var Murrix = function()
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "murrix";

  self.utils = new MurrixUtilsManager(self);
  self.config = new MurrixConfigurationManager(self, path.resolve("./config.json"));
  self.logger = new MurrixLoggerManager(self);
  self.db = new MurrixDatabaseManager(self);
  self.session = new SessionManager({ name: self.config.sessionName });
  self.user = new MurrixUserManager(self);
  self.cache = new MurrixCacheManager(self);
  self.upload = new MurrixUploadManager(self);
  self.triggers = new MurrixTriggersManager(self, path.resolve("./triggers.json"));

  self.logger.info(self.name, "Initializing MURRiX...");
  self.emit("init");
};

util.inherits(Murrix, events.EventEmitter);

var murrix = new Murrix();

var videoStreamer = null;

murrix.on("configurationLoaded", function()
{
//   user.checkAdminUser(function(error)
//   {
//     if (error)
//     {
//       console.log(error);
//       exit(1);
//     }
//   });

  /* Start to listen to HTTP */
  httpServer.listen(murrix.config.httpPort);



  videoStreamer = vidStreamer.settings({
    "mode": "production",
    "forceDownload": false,
    "random": false,
    "rootFolder": path.resolve(__dirname, murrix.config.cachePath) + "/",
    "rootPath": "",
    "server": "MURRiX"
  });
});

function httpRequestHandler(request, response)
{
  murrix.session.start(request, response, function(error, session)
  {
    if (error)
    {
      response.writeHead(500);
      return response.end(error);
    }

    var requestParams = url.parse(request.url, true);

    if (requestParams.pathname === "/" || requestParams.pathname === "/index.html" || requestParams.pathname === "/index.htm")
    {
      murrix.utils.getTemplateFile("./public/index.html", function(error, data)
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
      var options = {};

      options.width = requestParams.query.width;
      options.height = requestParams.query.height;
      options.square = requestParams.query.square;

      murrix.cache.getImage(requestParams.query.id, options, function(error, filename)
      {
        if (error)
        {
          response.writeHead(500);
          return response.end(error);
        }

        if (filename === false)
        {
          response.writeHead(404);
          return response.end("Image not ready, queued");
        }

        //console.log(request.url);
        request.url = "/" + path.basename(filename);
        //console.log(request.url);

        try
        {
          videoStreamer(request, response);
        }
        catch (e)
        {
          console.error(e);
          return response.end(e);
        }
      });
    }
    else if (requestParams.pathname === "/video")
    {
      var options = {};

      murrix.cache.getVideo(requestParams.query.id, options, function(error, filename)
      {
        if (error)
        {
          response.writeHead(500);
          return response.end(error);
        }

        if (filename === false)
        {
          response.writeHead(404);
          return response.end("Video not ready, queued");
        }

        //console.log(request.url);
        request.url = "/" + path.basename(filename);
        //console.log(request.url);

        try
        {
          videoStreamer(request, response);
        }
        catch (e)
        {
          console.error(e);
          return response.end(e);
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

    murrix.session.findByCookieString(handshakeData.headers.cookie, function(error, session, cookies)
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

        murrix.user.login(session, userinfo.username, userinfo.password, function(error)
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
  murrix.user.getUser(client.handshake.session, function(error, userData)
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

    murrix.user.login(client.handshake.session, data.username, data.password, callback);
  });

  client.on("logout", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.logout!");
      return;
    }

    murrix.user.logout(client.handshake.session, callback);
  });

  client.on("changePassword", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.changePassword!");
      return;
    }

    murrix.user.changePassword(client.handshake.session, data.id, data.password, callback);
  });

  client.on("findGroups", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.findGroups!");
      return;
    }

    murrix.user.findGroups(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("findUsers", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.findUsers!");
      return;
    }

    murrix.user.findUsers(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("saveGroup", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.saveGroup!");
      return;
    }

    murrix.user.saveGroup(client.handshake.session, data, callback);
  });

  client.on("saveUser", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.saveUser!");
      return;
    }

    murrix.user.saveUser(client.handshake.session, data, callback);
  });

  client.on("removeGroup", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.removeGroup!");
      return;
    }

    murrix.user.removeGroup(client.handshake.session, data, callback);
  });

  client.on("removeUser", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for user.removeUser!");
      return;
    }

    murrix.user.removeUser(client.handshake.session, data, callback);
  });


  /* Node API */
  client.on("saveNode", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for saveNode!");
      return;
    }

    murrix.db.nodes.save(client.handshake.session, data, callback);
  });

  client.on("saveItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for saveItem!");
      return;
    }

    murrix.db.items.save(client.handshake.session, data, callback);
  });

  client.on("createFileItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for createFileItem!");
      return;
    }

    murrix.db.items.importFile(client.handshake.session, data.name, data.uploadId, data.parentId, callback);
  });

  client.on("hideRaw", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for hideRaw!");
      return;
    }

    murrix.db.items.hideRaw(client.handshake.session, data, callback);
  });

  client.on("commentNode", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for commentNode!");
      return;
    }

    murrix.db.nodes.comment(client.handshake.session, data.id, data.text, callback);
  });

  client.on("commentItem", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for commentItem!");
      return;
    }

    murrix.db.items.comment(client.handshake.session, data.id, data.text, callback);
  });

  client.on("findNodesByYear", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for findByYear!");
      return;
    }

    murrix.db.findNodesByYear(client.handshake.session, data, callback);
  });

  client.on("findRandom", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for findRandom!");
      return;
    }

    murrix.db.nodes.findRandom(client.handshake.session, data, callback);
  });

  client.on("find", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for find!");
      return;
    }

    murrix.db.findWithRights(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("count", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for count!");
      return;
    }

    murrix.db.countWithRights(client.handshake.session, data.query || {}, data.options || {}, callback);
  });

  client.on("distinct", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for distinct!");
      return;
    }

    murrix.db.distinct(data.query || {}, data.options || {}, callback); // TODO: Check rights
  });

  client.on("group", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for group!");
      return;
    }

    data.options = data.options || {};
    data.options.reduceFunction = data.reduce;

    murrix.db.group(data.reduce || {}, data.options || {}, callback); // TODO: Check rights
  });



  client.on("getCacheStatus", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for getCacheStatus!");
      return;
    }

    murrix.cache.getStatus(data, callback);
  });


  /* When API */
/*  client.on("createReferenceTimeline", function(data, callback)
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
  })*/;

  /* Upload file API */
  client.on("fileStart", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for start!");
      return;
    }

    murrix.upload.start(client.handshake.session, data.size, data.filename, callback);
  });

  client.on("fileChunk", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for chunk!");
      return;
    }

    murrix.upload.chunk(client.handshake.session, data.id, data.data, callback);
  });
});
