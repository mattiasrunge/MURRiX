
/* Includes, TODO: Sanitize case */
var path = require("path");
var events = require("events");
var util = require("util");


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

var Murrix = function()
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "murrix";

  self.basePath = function() { return __dirname + "/"; };

  self.utils = new MurrixUtilsManager(self);
  self.config = new MurrixConfigurationManager(self, path.resolve(self.basePath(), "./config.json"));
  self.logger = new MurrixLoggerManager(self);
  self.client = new MurrixClientManager(self);
  self.db = new MurrixDatabaseManager(self);
  self.session = new SessionManager({ name: self.config.sessionName });
  self.user = new MurrixUserManager(self);
  self.cache = new MurrixCacheManager(self);
  self.upload = new MurrixUploadManager(self);
  self.import = new MurrixImportManager(self);
  self.triggers = new MurrixTriggersManager(self, path.resolve(self.basePath(), "./triggers.json"));
  self.server = new MurrixServerManager(self);

  self.logger.info(self.name, "Initializing MURRiX...");
  self.emit("init");
};

util.inherits(Murrix, events.EventEmitter);

var murrix = new Murrix();

