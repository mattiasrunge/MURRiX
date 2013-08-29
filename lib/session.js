
var fs = require("fs");
var util = require("util");
var events = require("events");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixSessionManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "session";
  self.sessions = {};
  self.storedSessions = {};
  self.ageLimit = 604800; // One week in seconds
  self.timerInterval = 10;
  self.timer = null;

  murrix.config.on("done", function()
  {
    var abspath = murrix.config.getPathSessions();

    murrix.logger.info(self.name, "Trying to load existing sessions from " + abspath);

    fs.readdir(abspath, function(error, list)
    {
      if (error)
      {
        murrix.logger.error(self.name, error); // TODO die
        return;
      }

      var files = [];
      var count = 0;

      for (var n = 0; n < list.length; n++)
      {
        var stat = fs.statSync(abspath + list[n]);

        if (stat.isFile() && list[n].indexOf("session_") === 0)
        {
          var data = fs.readFileSync(abspath + list[n]);
          var session = JSON.parse(data);

          self.sessions[session._id] = session;
          self.storedSessions[session._id] = data.toString();
          count++;
        }
      }

      murrix.logger.info(self.name, "Loaded " + count + " session(s) from disk!");

      murrix.logger.info(self.name, "Setting session disk write timer to " + self.timerInterval + " seconds...");

      self.timer = setInterval(function()
      {
        self.saveSessions();
      }, self.timerInterval * 1000);

      self.emit("done");
    });
  });

  self.saveSessions = function()
  {
    var abspath = murrix.config.getPathSessions();
    var changedSessions = [];
    var unchangedSessions = [];
    var currentTimestamp = murrix.utils.timestamp();
    var chain = new MurrixChain();

    for (var id in self.sessions)
    {
      // Check if session does not matched what we have stored on disk
      if (self.storedSessions[id] !== JSON.stringify(self.sessions[id]))
      {
        // Update last change if the session has changed
        self.sessions[id].lastChange = currentTimestamp;

        changedSessions.push(self.sessions[id]);
      }
      else
      {
        unchangedSessions.push(self.sessions[id]);
      }
    }

    //murrix.logger.debug(self.name, "Session status is " + changedSessions.length + " changed and " + unchangedSessions.length + " unchanged.");

    for (var n = 0; n < unchangedSessions.length; n++)
    {
      if (currentTimestamp > unchangedSessions[n].lastChange + self.ageLimit)
      {
        murrix.logger.info(self.name, "Found a session (" + unchangedSessions[n]._id + ") which is to old, will remove it!");

        delete self.storedSessions[unchangedSessions[n]._id];
        delete self.sessions[unchangedSessions[n]._id];

        murrix.utils.removeFile(abspath + "session_" + unchangedSessions[n]._id);
      }
    }

    for (var n = 0; n < changedSessions.length; n++)
    {
      chain.add(changedSessions[n], function(session, options, chainCallback)
      {
        var data = JSON.stringify(session);

        fs.writeFile(abspath + "session_" + session._id, data, function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to save session (" + session._id + ") to disk, reason: " + error);
          }

          self.storedSessions[session._id] = data;

          chainCallback();
        });
      });
    };

    chain.run();
  };

  self.get = function(id)
  {
    return self.sessions[id];
  }

  self.create = function()
  {
    var session = {};

    session._id = self.generateId();
    session.lastChange = 0;

    self.sessions[session._id] = session;

    murrix.logger.info(self.name, "Started a new session with id " + session._id);

    return session;
  };

  self.generateId = function()
  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
    {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
}

util.inherits(MurrixSessionManager, events.EventEmitter);

exports.Manager = MurrixSessionManager;
