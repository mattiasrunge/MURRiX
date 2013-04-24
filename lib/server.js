
var fs = require("fs");
var url = require("url");
var path = require("path");
var http = require("http");
var socketio = require("socket.io");
var events = require("events");
var util = require("util");
var send = require("send");

function MurrixServerManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "server";
  self.started = false;

  murrix.on("init", function()
  {
    self.emit("done");
  });

  self.isStarted = function()
  {
    return self.started;
  };

  self.start = function()
  {
    murrix.logger.info(self.name, "Starting HTTP server...");

    self.started = true;

    var httpServer = http.createServer(httpRequestHandler);
    var io = socketio.listen(httpServer, { log: false });

    httpServer.listen(murrix.config.httpPort);

    function httpRequestHandler(request, response)
    {
      function errorHandler(error)
      {
        murrix.logger.error(self.name, error.message);
        response.statusCode = error.status || 500;
        response.end(error.message);
      }

      murrix.session.start(request, response, function(error, session)
      {
        if (error)
        {
          response.writeHead(500);
          return response.end(error);
        }

        var requestParams = url.parse(request.url, true);
        var options = {};

        if (requestParams.pathname === "/file")
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

            murrix.logger.debug(self.name, "Serving file " + filename);

            response.setHeader("Cache-Control", "must-revalidate, post-check=0, pre-check=0");
            response.setHeader("Content-Type", "application/force-download");
            response.setHeader("Content-Disposition", "attachment; filename=" + name + ";");
            response.setHeader("Content-Transfer-Encoding", "binary");

            request.url = "/" + filename;
            send(request, request.url).root(murrix.basePath() + "files").on("error", errorHandler).pipe(response);
          });
        }
        else if (requestParams.pathname === "/preview")
        {
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

            request.url = "/" + path.basename(filename);
            send(request, request.url).root(murrix.basePath() + "cache").on("error", errorHandler).pipe(response);
          });
        }
        else if (requestParams.pathname === "/video")
        {
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

            request.url = "/" + path.basename(filename);
            send(request, request.url).root(murrix.basePath() + "cache").on("error", errorHandler).pipe(response);
          });
        }
        else
        {
          request.url = "/" + requestParams.pathname;
          request.url = request.url.replace(/\/\//g, "/");

          if (request.url === "/" || request.url === "/index.html")
          {
            murrix.utils.compileTemplateFile(murrix.basePath() + "public/index.html.tmpl", function(error)
            {
              if (error)
              {
                response.writeHead(500);
                return response.end(error);
              }

              send(request, request.url).root(murrix.basePath() + "public").on("error", errorHandler).pipe(response);
            });
          }
          else
          {
            send(request, request.url).root(murrix.basePath() + "public").on("error", errorHandler).pipe(response);
          }
        }
      });
    }

    io.configure(function()
    {
      io.set("authorization", function(handshakeData, callback)
      {
        if (handshakeData.xdomain)
        {
          murrix.logger.error(self.name, "Cross domain access is not allowed!");
          callback("Cross domain access is not allowed!", false);
          return;
        }

        murrix.logger.debug(self.name, "Find session by cookie!");
        murrix.session.findByCookieString(handshakeData.headers.cookie, function(error, session, cookies)
        {
          if (error)
          {
            murrix.logger.error(self.name, error);
            callback(error, false);
            return;
          }

          if (session === false)
          {
            murrix.logger.error(self.name, "No session found!");
            callback("No session found!", false);
            return;
          }

          handshakeData.session = session;

          if (cookies.userinfo)
          {
            var userinfo = JSON.parse(unescape(cookies.userinfo));

            murrix.logger.info(self.name, "Will try to auto login " + userinfo.username + " from cookie!");

            murrix.user.login(session, userinfo.username, userinfo.password, function(error)
            {
              if (error)
              {
                murrix.logger.error(error);
              }

              murrix.logger.debug(self.name, "Authorizing...");
              callback(null, true);
            });
          }
          else
          {
            murrix.logger.debug(self.name, "Authorizing...");
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
      });*/
    });

    self.emit("serverStarted");
  };
}

util.inherits(MurrixServerManager, events.EventEmitter);

exports.Manager = MurrixServerManager;
