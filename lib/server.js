
var fs = require("fs");
var url = require("url");
var path = require("path");
var http = require("http");
var socketio = require("socket.io");
var events = require("events");
var util = require("util");
var send = require("send");
var express = require("express");
var cookie = require("cookie");

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

    var app = express();
    var server = http.createServer(app);
    var io = socketio.listen(server, { log: false });

    app.use(express.compress());
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.use(function(request, response, callback)
    {
      request.session = murrix.session.get(request.cookies["murrix"]);

      if (!request.session)
      {
        request.session = murrix.session.create();
      }

      response.on("header", function()
      {
        response.cookie("murrix", request.session._id);
      });

      callback();
    });

    app.get(/^\/(index\.html)?$/, function(request, response)
    {
      murrix.utils.compileTemplateFile(murrix.basePath() + "public/index.html.tmpl", function(error, data)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not compile template file, reason: " + error);
          return response.send(500, error);
        }

        response.send(data);
      });
    });

    app.get("/preview", function(request, response)
    {
      var options = {};

      options.width = request.query.width;
      options.height = request.query.height;
      options.square = request.query.square;

      murrix.cache.getImage(request.query.id, options, function(error, filename)
      {
        if (error)
        {
          return response.send(500, "Could not get preview, reason: " + error);
        }

        if (filename === false)
        {
          return response.send(404, "preview not ready, queued!");
        }

        response.sendfile(path.basename(filename), { root: murrix.basePath() + "cache" });
      });
    });

    app.get("/video", function(request, response)
    {
      var options = {};

      murrix.cache.getVideo(request.query.id, options, function(error, filename)
      {
        if (error)
        {
          return response.send(500, "Could not get video, reason: " + error);
        }

        if (filename === false)
        {
          return response.send(404, "Video not ready, queued!");
        }

        response.sendfile(path.basename(filename), { root: murrix.basePath() + "cache" });
       });
    });

    app.get("/file", function(request, response)
    {
      var options = {};

      murrix.db.findOneWithRights(request.session, { _id: request.query.id }, "items", function(error, itemData)
      {
        if (error)
        {
          return response.send(500, "Could not get file node, reason: " + error);
        }

        if (itemData.what !== "file")
        {
          return response.send(404, "The requested node is not a file!");
        }

        var filename = false;
        var name = false;

        if (request.query.version)
        {
          if (!itemData.versions)
          {
            return response.send(404, "The requested version does not exist!");
          }

          for (var n = 0; n < itemData.versions.length; n++)
          {
            if (request.query.version === itemData.versions[n].id)
            {
              filename = itemData.versions[n].id; // TODO: This should be _id but since we already have a lot of data with id a fix would involve updating affected values in the database automatically for which there is no function for yet.
              name = itemData.versions[n].name;
              break;
            }
          }
        }
        else
        {
          filename = itemData._id;
          name = itemData.name;
        }

        if (filename === false)
        {
          return response.send(404, "The requested version does not exist!");
        }

        murrix.logger.debug(self.name, "Serving file " + name + " (" + filename + ") for download...");

        response.download(murrix.basePath() + "files/" + filename, name);
      });
    });

    app.get("/gps", function(request, response)
    {
      var position = murrix.utils.parseNmea(request.query.gprmc);

      if (position === false)
      {
        murrix.logger.error(self.name, "Could not parse NMEA:" + request.query.gprmc);
      }
      else if (!position.valid)
      {
        murrix.logger.info(self.name, "Received position is not valid:" + request.query.gprmc);
      }
      else
      {
        position.altitude = parseFloat(request.query.alt);
        position.source = "gps";

        var session = {};

        murrix.user.becomeUser(session, "admin", function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to become administrator, error: " + error);
            return;
          }

          murrix.db.findOne({ tracker_id: request.query.id }, "nodes", function(error, trackerNodeData)
          {
            if (error)
            {
              murrix.logger.error("Could not find node with tracker id " + request.query.id + ", error: " + error);
              return;
            }

            murrix.logger.debug(self.name, "Found tracker node " + trackerNodeData.name + " with id " + trackerNodeData._id + " and tracker id " + trackerNodeData.tracker_id + " successfully!");

            murrix.db.findOne({ _tracked_by: trackerNodeData._id }, "nodes", function(error, nodeData)
            {
              if (error || nodeData === null)
              {
                murrix.logger.error("Could not find any node being tracked by  " + trackerNodeData.name + " with id " + trackerNodeData._id + " and tracker id " + trackerNodeData.tracker_id + ", error: " + error);
                return;
              }

              murrix.logger.debug(self.name, "Found tracked node " + nodeData.name + " with id " + nodeData._id + " successfully!");

              murrix.db.storeTrackPosition(session, position, nodeData._id, trackerNodeData._id, function(error)
              {
                if (error)
                {
                  murrix.logger.error("Could not store position, error: " + error);
                }
              });
            });
          });
        });
      }

      return response.send(200);
    });

    app.post("/upload", function(request, response)
    {
      if (request.session)
      {
        request.session.files = request.session.files || [];
        request.session.files[request.files.file.path] = request.files.file;

        response.json(request.files.file);
      }
      else
      {
        response.send(405, "You must be logged in to upload files!");
      }
    });

    app.use(express.static(murrix.basePath() + "/public"));

    server.listen(murrix.config.httpPort);


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

        murrix.logger.debug(self.name, "Trying to authorize new client...");

        var cookies = cookie.parse(handshakeData.headers.cookie);
        var session = murrix.session.get(cookies["murrix"]);

        if (!session)
        {
          murrix.logger.error(self.name, "No session found for id " + cookies["murrix"]);
          callback(null, false);
        }

        handshakeData.sessionId = session._id;

        if (cookies.userinfo)
        {
          var userinfo = JSON.parse(unescape(cookies.userinfo));

          murrix.logger.info(self.name, "Will try to auto login " + userinfo.username + " from cookie!");

          murrix.user.login(session, userinfo.username, userinfo.password, function(error)
          {
            if (error)
            {
              murrix.logger.error("Auto login failed, reason: " + error);
            }

            murrix.logger.debug(self.name, "Authorizing session " + handshakeData.sessionId + "...");
            callback(null, true);
          });
        }
        else
        {
           murrix.logger.debug(self.name, "Authorizing session " + handshakeData.sessionId + "...");
           callback(null, true);
        }
      });
    });

    app.get("/download", function(request, response)
    {
      if (request.session && request.session.archives && request.session.archives[request.query.id])
      {
        murrix.logger.debug(self.name, "Serving archive " + request.session.archives[request.query.id].archive + " as '" + request.session.archives[request.query.id].name + "' for download...");

        response.download(request.session.archives[request.query.id].archive, request.session.archives[request.query.id].name);
      }
      else
      {
        response.send(404, "The requested archive does not exist");
      }
    });

    io.sockets.on("connection", function(client)
    {
      var session = murrix.session.get(client.handshake.sessionId);

      if (!session)
      {
        murrix.logger.error(self.name, "No session found for id " + client.handshake.sessionId);
        client.emit("connection_established", { error: "Could not find session" });
        return
      }

      murrix.client.add(client);

      /* Emit connection established event to client and supply the current user if any */
      murrix.user.getUser(session, function(error, userData)
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
