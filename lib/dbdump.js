
var path = require("path");
var call = require("acall.js");
var utils = require("./utils");
var schedule = require("node-schedule");
var Logger = require("./logger");

var logger = new Logger("dbdump");

var dumpPath = path.join(__dirname, "..", "dumps");
var dbHostname = "localhost";
var dbPort = 27017;
var dbName = "murrix";

var mongodumpPath = "mongodump";
var mongorestorePath = "mongorestore";
var tarPath = "tar";
  
exports.initialize = function(config, callback)
{
  config = config || {};
  config.db = config.db || {};
  config.db.dump = config.db.dump || {};
  
  if (!config.db.dump.interval)
  {
    logger.info("Database dumps are disabled.");
    callback();
    return;
  }
  
  dumpPath = config.db.dump.path ? path.resolve(config.db.dump.path) : dumpPath;
  dbHostname = config.db.hostname || dbHostname;
  dbPort = config.db.port || dbPort;
  dbName = config.db.name || dbName;
  
  logger.info("Will do a database dump with on this schedule: " + config.db.dump.interval);

  var job = new schedule.Job("dbdump", function()
  {
    exports.dump(function(error)
    {
      if (error)
      {
        logger.error("Failed to dump database on schedule, error: " + error);
      }
    });
  });
  
  job.on("run", function()
  {
    logger.info("Creating database dump...");
  });
  
  job.on("scheduled", function(d)
  {
    logger.info("Next database dump is scheduled for " + d.toString());
  });
  
  job.schedule(config.db.dump.interval);
  
  callback();
};

exports.dump = function(callback)
{
  utils.file.createTempDirectory(function(error, directory)
  {
    if (error)
    {
      callback("Failed to create temporary directory, error: " + error);
      return;
    }
      
    var filename = (new Date()).toISOString().replace(/[:]/g, "_") + ".tar.bz2";
    var tempfilepath = path.join(directory, filename);
    
    var cmd = [];

    cmd.push(mongodumpPath);
    cmd.push("--host", dbHostname);
    cmd.push("--port", dbPort);
    cmd.push("--db", dbName);

    call(cmd, { cwd: directory }, function(error)
    {
      if (error)
      {
        utils.file.remove(directory);
        callback("Failed to dump database, reason: " + error);
        return;
      }

      cmd = [];

      cmd.push(tarPath);
      cmd.push("-cjf");
      cmd.push(tempfilepath);
      cmd.push(".");

      logger.info("Creating database dump archive...");

      call(cmd, { cwd: path.join(directory, "dump", dbName) }, function(error)
      {
        if (error)
        {
          utils.file.remove(directory);
          callback("Failed to compress database dump, error: " + error);
          return;
        }

        utils.file.copy(tempfilepath, path.join(dumpPath, filename), function(error)
        {
          utils.file.remove(directory);

          if (error)
          {
            callback("Failed to copy file, error: " + error);
            return;
          }

          logger.info("Successfully dumped the database and stored it in " + filename);
          callback();
        });
      });
    });
  });
};

