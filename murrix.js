
/* Includes, TODO: Sanitize case */
var path = require("path");
var events = require("events");
var util = require("util");
var ewait = require("ewait");

var SessionManager = require("msession.js").Manager;

var MurrixLoggerManager = require("./lib/logger.js").Manager;
var MurrixConfigurationManager = require("./lib/config.js").Manager;
var MurrixDatabaseManager = require("./lib/db.js").Manager;
var MurrixCacheManager = require("./lib/cache.js").Manager;
var MurrixUploadManager = require("./lib/upload.js").Manager;
var MurrixUtilsManager = require("./lib/utils.js").Manager;
var MurrixUserManager = require("./lib/user.js").Manager;
var MurrixTriggersManager = require("./lib/triggers.js").Manager;
var MurrixImportManager = require("./lib/import.js").Manager;
var MurrixClientManager = require("./lib/client.js").Manager;
var MurrixServerManager = require("./lib/server.js").Manager;

function Murrix(options)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "murrix";
  self.basePath = function() { return __dirname + "/"; };

  self.on("init", function()
  {
    self.logger.info(self.name, "Initializing MURRiX...");
  });

  self.on("done", function()
  {
    self.logger.info(self.name, "Initialization complete!");
  });

  var modules = [];

  self.utils = new MurrixUtilsManager(self);
  modules.push(self.utils);

  self.config = new MurrixConfigurationManager(self, path.resolve(self.basePath(), options.config));
  modules.push(self.config);

  self.logger = new MurrixLoggerManager(self);
  modules.push(self.logger);

  self.client = new MurrixClientManager(self);
  modules.push(self.client);

  self.db = new MurrixDatabaseManager(self);
  modules.push(self.db);

  self.session = new SessionManager({ name: self.config.sessionName });

  self.user = new MurrixUserManager(self);
  modules.push(self.user);

  self.cache = new MurrixCacheManager(self);
  modules.push(self.cache);

  self.upload = new MurrixUploadManager(self);
  modules.push(self.upload);

  self.import = new MurrixImportManager(self);
  modules.push(self.import);

  self.triggers = new MurrixTriggersManager(self, path.resolve(self.basePath(), "./triggers.json"));
  modules.push(self.triggers);

  self.server = new MurrixServerManager(self);
  modules.push(self.server);


  var wait = new ewait.WaitForAll();

  wait.add(modules);

  wait.on("done", function()
  {
    self.emit("done");
  });

  wait.wait();
}

util.inherits(Murrix, events.EventEmitter);

exports.Murrix = Murrix;
