
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
var databaseHost = "localhost";
var databasePort = 27017;
var databaseName = "murrix";
var httpPort = 8080;

/* Instances */
var mongoServer = new mongo.Server(databaseHost, databasePort, { auto_reconnect: true });
var mongoDb = new mongo.Db(databaseName, mongoServer);
var session = new Session(mongoDb, "murrix");
var user = new User(mongoDb);
var nodeManager = new NodeManager(mongoDb, user);
var uploadManager = new UploadManager();
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
});

/* Start to listen to HTTP */
httpServer.listen(httpPort);


function getTemplateFile(filename, callback)
{
  var dirname = path.dirname(filename) + "/";

  fs.readFile(filename, 'utf8', function(error, data)
  {
    if (error)
    {
      console.log("Could not read file " + filename);
      callback("Could not read file " + filename, null);
      return;
    }

    data = data.replace(/\{\{(.+?)\}\}/g, function(fullMatch, templateFilename)
    {
      if (templateFilename[0] === "#")
      {
        return "<!-- '" + templateFilename.substr(1) + "' not included -->";
      }

      templateFilename = dirname + templateFilename;
      
      try
      {
        return fs.readFileSync(templateFilename, 'utf8');
      }
      catch (e)
      {
        return "<!-- " + e + " -->";
      }
    });

    callback(null, data);
  });
}

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

    console.log(requestParams);

    if (requestParams.pathname === "/" || requestParams.pathname === "/index.html" || requestParams.pathname === "/index.htm")
    {
      getTemplateFile("./public/index.html", function(error, data)
      {
        if (error)
        {
          response.writeHead(404);
          response.end();
          return;
        }
        
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(data);
      });
    }
    else
    {
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
  client.on("save", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.save!");
      return;
    }

    nodeManager.save(client.handshake.session, data, callback);
  });

  client.on("comment", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.comment!");
      return;
    }

    nodeManager.comment(client.handshake.session, data.nodeId, data.text, callback);
  });

  client.on("addPositions", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.addPositions!");
      return;
    }

    nodeManager.addPositions(client.handshake.session, data.nodeId, data.positionList, callback);
  });

  client.on("find", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.find!");
      return;
    }

    nodeManager.find(client.handshake.session, data, callback);
  });

  client.on("count", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.count!");
      return;
    }

    nodeManager.count(client.handshake.session, data, callback);
  });

  client.on("distinct", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.distinct!");
      return;
    }

    nodeManager.distinct(client.handshake.session, data, callback);
  });

  client.on("findPositions", function(data, callback)
  {
    if (!callback)
    {
      console.log("No callback supplied for nodeManager.addPositions!");
      return;
    }

    nodeManager.findPositions(client.handshake.session, data, callback);
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
