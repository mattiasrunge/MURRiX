
var utils = require("./utils");

module.exports = function(name)
{
  this.error = function(line)
  {
    console.error(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " ERROR  " + line);
  };

  this.debug = function(line)
  {
    console.log(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " DEBUG  " + line);
  };

  this.info = function(line)
  {
    console.log(utils.time.string() + "  " + utils.string.rpad(name, " ", 10) + " INFO   " + line);
  };
};
