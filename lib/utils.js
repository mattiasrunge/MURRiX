
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var spawn  = require('child_process').spawn;

var facedetectPath = '/home/migan/projects/facedetect/detectFaces';

exports.removeFile = function(filePath, callback)
{
  fs.exists(filePath, function(exists)
  {
    if (exists)
    {
      fs.unlink(filePath, function(error)
      {
        if (callback)
        {
          callback(error);
        }
      });

      return;
    }

    if (callback)
    {
      callback(null);
    }
  });
}

exports.md5File = function(filePath, callback)
{
  var checksum = crypto.createHash("md5");
  var stream = fs.ReadStream(filePath);

  stream.on('data', function(data)
  {
    checksum.update(data);
  });

  stream.on('error', function(error)
  {
    callback(error);
  });

  stream.on('end', function()
  {
    callback(null, checksum.digest('hex'));
  });
};


exports.runCommand = function(commandPath, args, options, callback)
{
  var error = "";
  var buffer = "";
  var resultCode = 0;
  var process = spawn(commandPath, args, options);

  process.stdout.setEncoding("ascii");
  process.stderr.setEncoding("ascii");

  process.stdout.on("data", function(data)
  {
    buffer += data;
  });

  process.stderr.on("data", function(data)
  {
    error += data;
  });

  process.on("exit", function(code)
  {
    resultCode = code;
  });

  process.on("close", function()
  {
    if (resultCode !== 0)
    {
      callback("Exited with code: " + resultCode + "\n" + error);
      return;
    }

    callback(null, buffer);
  });
};

exports.timestamp = function(value)
{
  if (value)
  {
    return Math.floor(new Date(value).getTime() / 1000);
  }

  return Math.floor(new Date().getTime() / 1000);
}

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

exports.makeArray = function(hash)
{
  var result = [];

  for (var n in hash)
  {
    result.push(hash[n]);
  }

  return result;
};

exports.getTemplateFile = function(filename, callback)
{
  var dirname = path.dirname(filename) + "/";

  fs.readFile(filename, 'utf8', function(error, data)
  {
    if (error)
    {
      console.log("Could not read file " + filename);
      callback("Could not read file " + filename, null);
      return;
    }

    data = data.replace(/\{\{(.+?)\}\}/g, function(fullMatch, templateFilename)
    {
      if (templateFilename[0] === "#")
      {
        return "<!-- '" + templateFilename.substr(1) + "' not included -->";
      }

      templateFilename = dirname + templateFilename;

      try
      {
        return fs.readFileSync(templateFilename, 'utf8');
      }
      catch (e)
      {
        return "<!-- " + e + " -->";
      }
    });

    callback(null, data);
  });
};

exports.detectFaces = function(filename, callback)
{
  fs.exists(filename, function(exists)
  {
    if (!exists)
    {
      callback(filename + " does not exist!");
      return;
    }

    var error = "";
    var buffer = "";
    var process = spawn(facedetectPath, [ filename ]);

    process.stdout.setEncoding("ascii");
    process.stderr.setEncoding("ascii");

    process.stdout.on("data", function(data)
    {
      buffer += data;
    });

    process.stderr.on("data", function(data)
    {
      error += data;
    });

    process.on("exit", function(code)
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
      console.log("BUFFER", buffer);

      callback(null, JSON.parse(buffer));
    });

  });
};

