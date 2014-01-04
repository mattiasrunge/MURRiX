
var Logger = require("./logger");
var utils = require("./utils");
var sessions = require("./session");
var clients = require("./client");
var logger = new Logger("server");
var media = require("./media");

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

module.exports = function()
{
  var self = this;

  self.name = "server";
  self.started = false;

  self.isStarted = function()
  {
    return self.started;
  };

  self.start = function()
  {
    logger.info("Starting HTTP server...");

    self.started = true;

    var app = express();
    var server = http.createServer(app);
    var io = socketio.listen(server, { log: false });

    app.use(express.compress());
    app.use(express.cookieParser());
    app.use(express.json());
    app.use(express.urlencoded());

    app.use(function(request, response, callback)
    {
      request.session = sessions.get(request.cookies["murrix"]);

      if (!request.session)
      {
        request.session = sessions.create();
      }

      response.on("header", function()
      {
        response.cookie("murrix", request.session._id);
      });

      callback();
    });
    
    app.get("/media/:id/:type/:width/:height?", function(request, response)
    {
      var args = utils.array.merge(request.params, request.query); 

      media.get(args, function(error, filename)
      {
        if (error)
        {
          logger.error("Failed to get media object, error: " + error);
          return response.send(500, "Failed to get media object, error: " + error);
        }

        response.sendfile(path.basename(filename), { root: __dirname + "/../cache" });
      });
    });

/*
    
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

        logger.debug("Serving file " + name + " (" + filename + ") for download...");

        response.download(murrix.basePath() + "files/" + filename, name);
      });
    });

    app.get("/gps", function(request, response)
    {
      var position = utils.position.nmeaParse(request.query.gprmc);

      if (position === false)
      {
        logger.error("Could not parse NMEA:" + request.query.gprmc);
      }
      else if (!position.valid)
      {
        logger.info("Received position is not valid:" + request.query.gprmc);
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
            logger.error("Failed to become administrator, error: " + error);
            return;
          }

          murrix.db.findOne({ tracker_id: request.query.id }, "nodes", function(error, trackerNodeData)
          {
            if (error)
            {
              logger.error("Could not find node with tracker id " + request.query.id + ", error: " + error);
              return;
            }

            logger.debug("Found tracker node " + trackerNodeData.name + " with id " + trackerNodeData._id + " and tracker id " + trackerNodeData.tracker_id + " successfully!");

            murrix.db.findOne({ _tracked_by: trackerNodeData._id }, "nodes", function(error, nodeData)
            {
              if (error || nodeData === null)
              {
                logger.error("Could not find any node being tracked by  " + trackerNodeData.name + " with id " + trackerNodeData._id + " and tracker id " + trackerNodeData.tracker_id + ", error: " + error);
                return;
              }

              logger.debug("Found tracked node " + nodeData.name + " with id " + nodeData._id + " successfully!");

              murrix.db.storeTrackPosition(session, position, nodeData._id, trackerNodeData._id, function(error)
              {
                if (error)
                {
                  logger.error("Could not store position, error: " + error);
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
    });*/

    app.use(express.static(__dirname + "/../durandal"));

    server.listen(9999);
    logger.debug("Listening to port 9999...");

    io.configure(function()
    {
      io.set("authorization", function(handshakeData, callback)
      {
        if (handshakeData.xdomain)
        {
          logger.error("Cross domain access is not allowed!");
          callback("Cross domain access is not allowed!", false);
          return;
        }

        logger.debug("Trying to authorize new client...");

        if (!handshakeData.headers.cookie)
        {
          logger.error("No session cookie found in request!");
          callback(null, false);
          return;
        }

        var cookies = cookie.parse(handshakeData.headers.cookie);
        var session = sessions.get(cookies.murrix);

        if (!session)
        {
          logger.error("No session found for id " + cookies.murrix);
          callback(null, false);
          return;
        }

        handshakeData.sessionId = session._id;

        if (cookies.userinfo)
        {
          var userinfo = JSON.parse(unescape(cookies.userinfo));

          logger.info("Will try to auto login " + userinfo.username + " from cookie!");

          clients.call(session, "user.login", userinfo, function(error)
          {
            if (error)
            {
              logger.error("Auto login failed, reason: " + error);
            }

            logger.debug("Authorizing session " + handshakeData.sessionId + "...");
            callback(null, true);
          });
        }
        else
        {
           logger.debug("Authorizing session " + handshakeData.sessionId + "...");
           callback(null, true);
        }
      });
    });

//     app.get("/download", function(request, response)
//     {
//       if (request.session && request.session.archives && request.session.archives[request.query.id])
//       {
//         logger.debug("Serving archive " + request.session.archives[request.query.id].archive + " as '" + request.session.archives[request.query.id].name + "' for download...");
//
//         response.download(request.session.archives[request.query.id].archive, request.session.archives[request.query.id].name);
//       }
//       else
//       {
//         response.send(404, "The requested archive does not exist");
//       }
//     });
//
    io.sockets.on("connection", function(client)
    {
      var session = sessions.get(client.handshake.sessionId);

      if (!session)
      {
        logger.error("No session found for id " + client.handshake.sessionId);
        client.emit("user", { error: "Could not find session" });
        return
      }

      clients.add(client);
      clients.trigger(session, "user.event.current", {});
    });
  };
};
