
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
