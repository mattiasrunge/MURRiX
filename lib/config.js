
var fs = require("fs");
var path = require("path");
var util = require("util");
var events = require("events");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixConfigurationManager(murrix, configFile)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "config";

  self.databaseHost = "localhost";
  self.databasePort = 27017;
  self.databaseName = "murrix";
  self.httpPort = 8080;
  self.tempPath = "/tmp/";
  self.dumpPath = "./dumps/";
  self.dumpInterval = [ "days", 1 ];
  self.filesPath = "./files/";
  self.cachePath = "./cache/";
  self.cacheSlots = 2;
  self.sessionName = "murrix";

  murrix.on("init", function()
  {
    fs.exists(configFile, function(exists)
    {
      if (exists)
      {
        murrix.logger.info(self.name, "Found user configuration file at " + configFile);

        var userConfig = require(configFile);

        for (var n in userConfig)
        {
          self[n] = userConfig[n];
        }
      }
      else
      {
        murrix.logger.info(self.name, "No user configuration found, using default parameters");
      }

      var folders = [ self.getPathFiles(), self.getPathCache(), self.getPathTemp() ];
      var folderChain = new MurrixChain();

      for (var n = 0; n < folders.length; n++)
      {
        folderChain.add(folders[n], function(path, options, callback)
        {
          murrix.utils.createDirectory(path, function(error)
          {
            if (error)
            {
              return callback("Failed to create path, reason: " + error);
            }

            callback();
          });
        });
      }

      folderChain.final(function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          exit(1);
        }

        self.emit("done");
      });

      folderChain.run();
    });
  });

  self.getPathFiles = function()
  {
    return path.resolve(murrix.basePath(), self.filesPath) + "/";
  };

  self.getPathCache = function()
  {
    return path.resolve(murrix.basePath(), self.cachePath) + "/";
  };

  self.getPathTemp = function()
  {
    return path.resolve(murrix.basePath(), self.tempPath) + "/";
  };

  self.getPathDump = function()
  {
    return path.resolve(murrix.basePath(), self.dumpPath) + "/";
  };
};

util.inherits(MurrixConfigurationManager, events.EventEmitter);

exports.Manager = MurrixConfigurationManager;
