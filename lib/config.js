
var fs = require("fs");

function MurrixConfigurationManager(murrix, configFile)
{
  var self = this;

  self.name = "config";

  self.databaseHost = "localhost";
  self.databasePort = 27017;
  self.databaseName = "murrix";
  self.httpPort = 8080;
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

      murrix.emit("configurationLoaded");
    });
  });
};

exports.Manager = MurrixConfigurationManager;
