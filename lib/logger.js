
var events = require("events");
var util = require("util");

function MurrixLoggerManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  murrix.on("init", function()
  {
    self.emit("done");
  });

  self.error = function(name, line)
  {
    console.error((new Date()).toString() + "  " + murrix.utils.rpad(name, " ", 10) + " ERROR  " + line);
  };

  self.debug = function(name, line)
  {
    console.log((new Date()).toString() + "  " + murrix.utils.rpad(name, " ", 10) + " DEBUG  " + line);
  };

  self.info = function(name, line)
  {
    console.log((new Date()).toString() + "  " + murrix.utils.rpad(name, " ", 10) + " INFO   " + line);
  };
}

util.inherits(MurrixLoggerManager, events.EventEmitter);

exports.Manager = MurrixLoggerManager;
