
var fs = require("fs");
var util = require("util");
var path = require("path");
var moment = require("moment");
var events = require("events");
var call = require("acall.js");

function MurrixBackupManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "backup";

  self.mongodumpPath = "mongodump";
  self.mongorestorePath = "mongorestore";
  self.tarPath = "tar";

  murrix.client.on("done", function()
  {
    self.emit("done");
  });

  murrix.config.on("done", function()
  {
    if (murrix.config.dumpInterval)
    {
      murrix.logger.info(self.name, "Will do a database dump with an interval of " + murrix.config.dumpInterval[1] + " " + murrix.config.dumpInterval[0] + "!");

      // Do initial dump
      self.dumpDatabaseIfNeeded(function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
        }
      });

      setInterval(function()
      {
        self.dumpDatabaseIfNeeded(function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, error);
          }
        });
      }, 1000 * 3600);
    }
    else
    {
      murrix.logger.info(self.name, "No database dumps are scheduled!");
    }
  });

  self.dumpDatabaseIfNeeded = function(callback)
  {
    fs.readdir(murrix.config.getPathDump(), function(error, list)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
        return;
      }

      var latest = false;

      for (var n = 0; n < list.length; n++)
      {
        // 2013-03-21T18_32_27.763Z.tar.bz2
        var datestring = list[n].replace(/.tar.bz2/g, "").replace(/[_]/g, ":");
        var time = moment(datestring);

        if (!time.isValid())
        {
          continue;
        }

        //murrix.logger.debug(self.name, "Found dump from " + time.format());

        if (latest === false || latest.diff(time) < 0)
        {
          latest = time;
        }
      }

      if (latest === false)
      {
        murrix.logger.info(self.name, "Found no previous dumps, will do one!");
        self.dumpDatabase(callback);
      }
      else
      {
        var now = moment();

        murrix.logger.info(self.name, "Last dump was done at " + latest.format());

        latest.add(murrix.config.dumpInterval[0], murrix.config.dumpInterval[1]);

        if (latest.diff(now) < 0)
        {
          murrix.logger.info(self.name, "It is time for a new dump!");
          self.dumpDatabase(callback);
        }
        else
        {
          murrix.logger.info(self.name, "It is not time for a new dump yet!");
          callback();
        }
      }
    });
  };

  self.dumpDatabase = function(callback)
  {
    var temppath = murrix.config.getPathTemp() + "murrix_dump_" + (new Date().getTime()) + "/";
    var tempfile = murrix.config.getPathTemp() + "murrix_dump_" + (new Date().getTime()) + ".tar.bz2";
    var filepath = murrix.config.getPathDump() + (new Date()).toISOString().replace(/[:]/g, "_") + ".tar.bz2";

    murrix.utils.file.createDirectory(temppath, function(error)
    {
      if (error)
      {
        callback("Failed to create temporary dump directory, reason: " + error);
        return;
      }

      var cmd = [];

      cmd.push(self.mongodumpPath);
      cmd.push("--host");
      cmd.push(murrix.config.databaseHost);
      cmd.push("--port");
      cmd.push(murrix.config.databasePort);
      cmd.push("--db");
      cmd.push(murrix.config.databaseName);

      murrix.logger.info(self.name, "Creating database dump at " + temppath + "...");

      call(cmd, { cwd: temppath }, function(error)
      {
        if (error)
        {
          murrix.utils.file.remove(temppath);
          callback("Failed to dump database, reason: " + error);
          return;
        }

        cmd = [];

        cmd.push(self.tarPath);
        cmd.push("-cjf");
        cmd.push(tempfile);
        cmd.push(".");

        murrix.logger.info(self.name, "Creating database dump archive...");

        call(cmd, { cwd: temppath + "dump/" + murrix.config.databaseName }, function(error)
        {
          if (error)
          {
            murrix.utils.file.remove(temppath);
            callback("Failed to compress database dump, reason: " + error);
            return;
          }

          murrix.utils.file.copy(tempfile, filepath, function(error)
          {
            murrix.utils.file.remove(temppath);
            murrix.utils.file.remove(tempfile);

            if (error)
            {
              callback("Failed to copy file, reason: " + error);
              return;
            }

            murrix.logger.info(self.name, "Successfully dumped the database and stored it in " + filepath);
            callback();
          });
        });
      });
    });
  };
}

util.inherits(MurrixBackupManager, events.EventEmitter);

exports.Manager = MurrixBackupManager;
