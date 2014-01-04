
var os = require("os");
var fs = require("fs");
var util = require("util");
var path = require("path");
var Chain = require("achain.js");
var acall = require("acall.js");

exports.mimetypes = require("./mimetypes.json");

exports.isRawimage = function(mimeType)
{
  return exports.mimetypes["rawimage"].indexOf(mimeType) !== -1;
};

exports.isImage = function(mimeType)
{
  return exports.mimetypes["image"].indexOf(mimeType) !== -1;
};

exports.isVideo = function(mimeType)
{
  return exports.mimetypes["video"].indexOf(mimeType) !== -1;
};

exports.isAudio = function(mimeType)
{
  return exports.mimetypes["audio"].indexOf(mimeType) !== -1;
};

exports.isFile = function(filename, callback)
{
  fs.stat(filename, function(error, stats)
  {
    if (error)
    {
      callback(error);
      return;
    }

    callback(null, stats.isFile());
  });
};

exports.createDirectory = function(path, callback)
{
  callback = callback || function() {};

  fs.exists(path, function(exists)
  {
    if (exists)
    {
      callback();
      return;
    }

    fs.mkdir(path, 0770, callback);
  });
};

exports.createTempDirectory = function(callback, index)
{
  index = index || 0;
  var path = exports.tempfile() + "_" + index + "_" + Math.floor(Math.random() * 1000);
  
  fs.exists(path, function(exists)
  {
    if (exists)
    {
      exports.createTempDirectory(callback, index + 1);
      return;
    }
    
    exports.createDirectory(path, function(error)
    {
      callback(error, path);
    });
  });
};

exports.tempfile = function()
{
  return path.join(os.tmpDir(), "murrix_" + (new Date().getTime()));
};

exports.copy = function(source, destination, callback)
{
  exports.isFile(source, function(error, isFile)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!isFile)
    {
      callback(source + " is not a file");
      return;
    }

    var is = fs.createReadStream(source);
    var os = fs.createWriteStream(destination);

    util.pump(is, os, callback);
  });
};

exports.remove = function(paths, callback)
{
  var chain = new Chain();
  callback = callback || function() {};

  if (typeof paths === "string")
  {
    paths = [ paths ];
  }

  chain.addMany(paths, function(pathname, options, chainCallback)
  {
    exports.isFile(pathname, function(error, isFile)
    {
      if (error)
      {
        chainCallback(error);
        return;
      }

      if (isFile)
      {
        fs.unlink(pathname, chainCallback);
      }
      else // isDirectory
      {
        fs.readdir(pathname, function(error, items)
        {
          if (error)
          {
            chainCallback(error);
            return;
          }

          items = items.map(function(item)
          {
            return path.join(pathname, item);
          });

          exports.remove(items, function(error)
          {
            fs.rmdir(pathname, chainCallback);
          });
        });
      }
    });
  });

  chain.run(callback);
};

exports.md5 = function(filename, callback)
{
  exports.isFile(source, function(error, isFile)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!isFile)
    {
      callback(source + " is not a file");
      return;
    }

    var checksum = crypto.createHash("md5");
    var stream = fs.ReadStream(filename);

    stream.on("data", function(data)
    {
      checksum.update(data);
    });

    stream.on("error", function(error)
    {
      callback(error);
    });

    stream.on("end", function()
    {
      callback(null, checksum.digest("hex"));
    });
  });
};

exports.mimetype = function(filename, callback)
{
  exports.isFile(filename, function(error, isFile)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!isFile)
    {
      callback(filename + " is not a file");
      return;
    }

    acall([ "exiftool", "-j", "-n", "-MIMEType", filename ], function(error, output)
    {
      if (error)
      {
        callback("Could not get EXIF data from " + filename + ", reason: " + error);
        return;
      }

      try
      {
        var exif = JSON.parse(output)[0];

        callback(null, exif.MIMEType);
      }
      catch (e)
      {
        callback("Could not get EXIF data from " + filename + ", reason: " + e.toString());
      }
    });
  });
};

exports.exif = function(filename, callback)
{
  exports.isFile(source, function(error, isFile)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!isFile)
    {
      callback(source + " is not a file");
      return;
    }

    var exclude = [ "DataDump", "ThumbnailImage", "Directory", "FilePermissions", "TextJunk", "ColorBalanceUnknown", "Warning" ];
    var command = [ "exiftool", "-j", "-n" ];

    for (var n = 0; n < exclude.length; n++)
    {
      command.push("-x");
      command.push(exclude[n]);
    }

    command.push(filename);

    acall(command, function(error, output)
    {
      if (error)
      {
        callback("Could not get EXIF data from " + filename + ", reason: " + error);
        return;
      }

      try
      {
        var exif = JSON.parse(output)[0];

        if (exif.DateTimeOriginal === "    :  :     :  :  ")
        {
          delete exif.DateTimeOriginal;
        }

        callback(null, exif);
      }
      catch (e)
      {
        callback("Could not get EXIF data from " + filename + ", reason: " + e.toString());
      }
    });
  });
};
