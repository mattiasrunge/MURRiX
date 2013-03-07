
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
var MurrixImportManager = require("./lib/import.js").Manager;
var MurrixClientManager = require("./lib/client.js").Manager;

var Murrix = function()
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "murrix";

  self.basePath = function() { return __dirname + "/"; };

  self.utils = new MurrixUtilsManager(self);
  self.config = new MurrixConfigurationManager(self, path.resolve(self.basePath(), "./config.json"));
  self.logger = new MurrixLoggerManager(self);
  self.client = new MurrixClientManager(self);
  self.db = new MurrixDatabaseManager(self);
  self.session = new SessionManager({ name: self.config.sessionName });
  self.user = new MurrixUserManager(self);
  self.cache = new MurrixCacheManager(self);
  self.upload = new MurrixUploadManager(self);
  self.import = new MurrixImportManager(self);
  self.triggers = new MurrixTriggersManager(self, path.resolve(self.basePath(), "./triggers.json"));

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
      murrix.db.findWithRights(session, { _id: requestParams.query.id }, "items", function(error, itemDataList)
      {
        if (error)
        {
          response.writeHead(404);
          return response.end(error);
        }

        if (itemDataList.length === 0)
        {
          response.writeHead(404);
          return response.end("Could not find the requested item");
        }

        var itemData = itemDataList[0];

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
          console.log(requestParams.query);
          console.log(error, filename);
          return response.end(e.toString());
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
          console.log(requestParams.query);
          console.log(error, filename);
          return response.end(e.toString());
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
      murrix.logger.error("io", "Cross domain access is not allowed!");
      callback("Cross domain access is not allowed!", false);
      return;
    }

    murrix.logger.info("io", "Find session by cookie!");
    murrix.session.findByCookieString(handshakeData.headers.cookie, function(error, session, cookies)
    {
      if (error)
      {
        murrix.logger.error("io", error);
        callback(error, false);
        return;
      }

      if (session === false)
      {
        murrix.logger.error("io", "No session found!");
        callback("No session found!", false);
        return;
      }

      handshakeData.session = session;

      if (cookies.userinfo)
      {
        var userinfo = JSON.parse(unescape(cookies.userinfo));

        murrix.logger.info("io", "Will try to auto login " + userinfo.username + " from cookie!");

        murrix.user.login(session, userinfo.username, userinfo.password, function(error)
        {
          if (error)
          {
            murrix.logger.error(error);
          }

          murrix.logger.debug("io", "Authorizing...");
          callback(null, true);
        });
      }
      else
      {
        murrix.logger.debug("io", "Authorizing...");
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
    client.emit("connection_established", { error: "Could not find session" });
    return;
  }

  murrix.client.add(client);

  /* Emit connection established event to client and supply the current user if any */
  murrix.user.getUser(client.handshake.session, function(error, userData)
  {
    if (error)
    {
      console.log("Could not get user information");
      client.emit("connection_established", { error: "Could not get user information, reason: " + error });
      return;
    }

    client.emit("connection_established", { userData: userData });
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
});
