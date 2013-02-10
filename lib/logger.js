
function MurrixLoggerManager(murrix)
{
  var self = this;

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

exports.Manager = MurrixLoggerManager;
