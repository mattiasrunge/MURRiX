
var path = require("path");
var Server = require("./lib/server");
var sessions = require("./lib/session");
var db = require("./lib/db");
var media = require("./lib/media");
var dbdump = require("./lib/dbdump");

var Logger = require("./lib/logger");
var Chain = require("achain.js");

var logger = new Logger("main");

exports.Murrix = function(options)
{
  var chain = new Chain();
  var server = new Server();
  
  logger.info("Loading configuration from " + options.config + "...");
  var config = require(options.config);
  config = config || {};

  chain.add(function(args, options, next)
  {
    sessions.initialize(config, next);
  });
  
  chain.add(function(args, options, next)
  {
    config.db = config .db || {};
    
    var hostname = config.db.hostname || "localhost";
    var port = config.db.port || 27017;
    var name = config.db.name || "murrix";
    
    db.open(hostname, port, name, next);
  });
  
  chain.add(function(args, options, next)
  {
    dbdump.initialize(config, next);
  });
  
  chain.add(function(args, options, next)
  {
    media.initialize(config, next);
  });
  
  chain.add(function(args, options, next)
  {
    server.initialize(config, next);
  });
  
  chain.run(function(error)
  {
    if (error)
    {
      logger.error("Faild on startup, error: " + error);
      process.exit(255);
    }
  });
};

//
//   self.cache = new MurrixCacheManager(self);
//   modules.push(self.cache);
//
//   self.import = new MurrixImportManager(self);
//   modules.push(self.import);
//
//   self.triggers = new MurrixTriggersManager(self, path.resolve(self.basePath(), "./triggers.json"));
//   modules.push(self.triggers);
//
//   self.scrapers = new MurrixScrapersManager(self);
//   modules.push(self.scrapers);
//