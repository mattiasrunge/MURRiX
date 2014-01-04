
var Logger = require("../logger");
var Chain = require("achain.js");
var utils = require("../utils");
var db = require("../db");

var logger = new Logger("triggers");
var before_chain = new Chain();
var after_chain = new Chain();


///////////////////////////////////////////////////////////////////
// Before chain
///////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////
// After chain
///////////////////////////////////////////////////////////////////



module.exports = function()
{
  var self = this;

  self.before = function(options, callback)
  {
    before_chain.run(options, callback);
  };

  self.after = function(options, callback)
  {
    after_chain.run(options, callback);
  };
};
