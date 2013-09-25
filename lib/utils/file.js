
var fs = require("fs");
var util = require("util");
var path = require("path");
var Chain = require("achain.js");

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

exports.copyFile = function(source, destination, callback)
{
  var is = fs.createReadStream(source);
  var os = fs.createWriteStream(destination);

  util.pump(is, os, callback);
};

exports.removeFile = function(filename, callback)
{
  callback = callback || function() {};

  fs.exists(filename, function(exists)
  {
    if (!exists)
    {
      callback(null, false);
      return;
    }

    fs.unlink(filename, function(error)
    {
      callback(error, true);
    });
  });
};

exports.removeFiles = function(filenames, callback)
{
  var chain = new Chain();
  callback = callback || function() {};

  chain.addMany(filenames, function(filename, options, chainCallback)
  {
    exports.removeFile(filename, chainCallback);
  });

  chain.run(callback);
};

exports.removeDirectory = function(path, callback)
{
  callback = callback || function() {};

  fs.exists(path, function(exists)
  {
    if (!exists)
    {
      callback(null, exists);
      return;
    }

    fs.readdir(path, function(error, filenames)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var chain = new Chain();

      chain.addMany(filenames, function(filename, options, chainCallback)
      {
        filename = path + "/" + filename;

        fs.stat(filename, function(error, stats)
        {
          if (error)
          {
            chainCallback(error);
            return;
          }

          if (stats.isDirectory())
          {
            exports.removeDirectory(filename, chainCallback);
          }
          else
          {
            exports.removeFile(filename, chainCallback);
          }
        });
      });

      chain.run(function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        fs.rmdir(path, callback);
      });
    });
  });
};

exports.md5 = function(filename, callback)
{
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
};
