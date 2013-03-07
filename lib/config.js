
var fs = require("fs");
var path = require("path");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixConfigurationManager(murrix, configFile)
{
  var self = this;

  self.name = "config";

  self.databaseHost = "localhost";
  self.databasePort = 27017;
  self.databaseName = "murrix";
  self.httpPort = 8080;
  self.tempPath = "/tmp/";
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

        murrix.emit("configurationLoaded");
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
};

exports.Manager = MurrixConfigurationManager;