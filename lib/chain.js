
var stewardess = require("stewardess");

function MurrixChain()
{
  var self = this;

  self.chain = stewardess();

  self.add = function(args, callback)
  {
    self.chain.add((function(args)
    {
      return function(options, next)
      {
        callback(args, options, function(error)
        {
          if (error)
          {
            options.error = error;
            next("break");
            return;
          }

          next();
        });
      };
    })(args));
  };

  self.final = function(callback)
  {
    self.chain.final(function(options)
    {
      var error = options.error;

      delete options.error;

      callback(error, options);
    });
  };

  self.run = function(options)
  {
    self.chain.run(options || {});
  };
}

exports.MurrixChain = MurrixChain;

/*

var stewardess = require("stewardess");

module.exports = function()
{
  var self = this;

  self.chain = stewardess();

  self.addList = function(args_list, action)
  {
    for (var n = 0; n < args_list.length; n++)
    {
      self.add(args_list[n], action);
    }
  };

  self.add = function(args, callback)
  {
    self.chain.add((function(args)
    {
      return function(options, next)
      {
        callback(args, options, function(error)
        {
          if (error)
          {
            options.error = error;
            next("break");
            return;
          }

          next();
        });
      };
    })(args));
  };

  self.final = function(callback)
  {
    self.chain.final(function(options)
    {
      var error = options.error;

      delete options.error;

      callback(error, options);
    });
  };

  self.run = function(options_or_function)
  {
    options = {};

    if (typeof options_or_function === "function")
    {
      self.final(options_or_function);
    }
    else if (typeof options_or_function === "object")
    {
      options = options_or_function;
    }

    self.chain.run(options);
  };
};*/
