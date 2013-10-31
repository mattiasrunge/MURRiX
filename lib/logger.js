
var utils = require("./utils");

module.exports = function(name)
{
  var self = this;

  self.error = function(line)
  {
    console.error(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " ERROR  " + line);
  };

  self.debug = function(line)
  {
    console.log(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " DEBUG  " + line);
  };

  self.info = function(line)
  {
    console.log(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " INFO   " + line);
  };
};
