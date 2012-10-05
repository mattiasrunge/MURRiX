
var fs = require('fs');
var spawn  = require('child_process').spawn;

var exiftoolPath = 'exiftool';

exports.parseCookieString = function(cookieString)
{
  var cookies = {};

  if (cookieString)
  {
    cookieString.split(';').forEach(function(cookie)
    {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }

  return cookies;
};

exports.inArray = function(needle, stack)
{
  for (var n = 0; n < stack.length; n++)
  {
    if (stack[n] === needle)
    {
      return true;
    }
  }

  return false;
};

// Inspired by https://github.com/simme/node-exift
exports.readExif = function(filename, callback)
{
  var self = this;

  fs.stat(filename, function (error, stat)
  {
    if (error)
    {
      callback(error);
      return;
    }

    error = null;
    var buffer = "";
    var process = spawn(exiftoolPath, [ "-j", "-n", filename ]);

    process.stdout.setEncoding("ascii");
    process.stderr.setEncoding("ascii");

    process.stdout.on("data", function (data)
    {
      buffer += data;
    });

    process.stderr.on("data", function (data)
    {
      if (!error)
      {
        error = "";
      }

      error += data;
    });

    process.on("exit", function (code)
    {
      if (error || code !== 0)
      {
        if (error.length === 0)
        {
          error = "Exiftool exited with code: " + code;
        }
        
        callback(error);
        return;
      }

      callback(null, JSON.parse(buffer));
    });

  });
};
