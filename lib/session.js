
var path = require("path");
var fs = require("fs");
var Chain = require("achain.js");
var Logger = require("./logger");
var utils = require("./utils");

var sessions = {};
var storedSessions = {};
var logger = new Logger("session");

var lifetime = 604800; // One week in seconds
var flushtime = 10;
var storagePath = path.join(__dirname, "..", "sessions");
var name = "murrix";

exports.initialize = function(config, callback)
{
  callback = callback || function() {};
  config = config || {};
  config.session = config.session || {};
  
  lifetime = config.session.lifetime || lifetime;
  flushtime = config.session.flushtime || flushtime;
  storagePath = config.session.path ? path.resolve(config.session.path) : storagePath;
  name = config.session.name || name;

  logger.debug("Trying to load existing sessions from " + storagePath);

  fs.readdir(storagePath, function(error, list)
  {
    if (error)
    {
      logger.error(error);
      callback(error);
      return;
    }

    var files = [];
    var count = 0;

    for (var n = 0; n < list.length; n++)
    {
      var stat = fs.statSync(path.join(storagePath, list[n]));

      if (stat.isFile() && list[n].indexOf("session_") === 0)
      {
        var data = fs.readFileSync(path.join(storagePath, list[n]));
        var session = JSON.parse(data);

        sessions[session._id] = session;
        storedSessions[session._id] = data.toString();
        count++;
      }
    }

    logger.info("Loaded " + count + " session(s) from disk!");
    logger.info("Setting session disk write timer to " + flushtime + " seconds...");

    setInterval(function()
    {
      exports.saveSessions();
    }, flushtime * 1000);

    callback();
  });
};

exports.saveSessions = function()
{
  var changedSessions = [];
  var unchangedSessions = [];
  var currentTimestamp = utils.time.timestamp();
  var chain = new Chain();

  for (var id in sessions)
  {
    // Check if session does not matched what we have stored on disk
    if (storedSessions[id] !== JSON.stringify(sessions[id]))
    {
      // Update last change if the session has changed
      sessions[id].lastChange = currentTimestamp;

      changedSessions.push(sessions[id]);
    }
    else
    {
      unchangedSessions.push(sessions[id]);
    }
  }

  //logger.debug("Session status is " + changedSessions.length + " changed and " + unchangedSessions.length + " unchanged.");

  for (var n = 0; n < unchangedSessions.length; n++)
  {
    if (currentTimestamp > unchangedSessions[n].lastChange + lifetime)
    {
      logger.info("Found a session (" + unchangedSessions[n]._id + ") which is to old, will remove it!");

      delete storedSessions[unchangedSessions[n]._id];
      delete sessions[unchangedSessions[n]._id];

      utils.file.remove(path.join(storagePath, "session_" + unchangedSessions[n]._id));
    }
  }

  chain.addMany(changedSessions, function(session, options, chainCallback)
  {
    var data = JSON.stringify(session);

    fs.writeFile(path.join(storagePath, "session_" + session._id), data, function(error)
    {
      if (error)
      {
        logger.error("Failed to save session (" + session._id + ") to disk, error: " + error);
      }

      storedSessions[session._id] = data;

      chainCallback();
    });
  });

  chain.run();
};

exports.name = function()
{
  return name;
};

exports.get = function(id)
{
  return sessions[id];
};

exports.create = function()
{
  var session = {};

  session._id = exports.generateId();
  session.lastChange = 0;

  sessions[session._id] = session;

  logger.info("Started a new session with id " + session._id);

  return session;
};

exports.generateId = function()
{
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c)
  {
    var r = Math.random()*16|0, v = c === "x" ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};
