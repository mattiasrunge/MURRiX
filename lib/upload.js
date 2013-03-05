
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var ObjectID = require("mongodb").ObjectID;

function MurrixUploadManager(murrix)
{
  var self = this;

  self.name = "upload";
  self.chunkSize = 524288 * 4;
  self.defaultRights = 775;

  self.find = function(session, id, callback)
  {
    if (!session.document.files)
    {
      session.document.files = {};
    }

    if (!session.document.files[id])
    {
      callback("No such upload id " + id + " in progress!", null);
      return;
    }

    callback(null, session.document.files[id]);
  };

  self.moveFile = function(session, uploadId, targetId, callback)
  {
    var newPath = murrix.config.getPathFiles() + targetId;

    self.find(session, uploadId, function(error, file)
    {
      if (error)
      {
        callback("Did not find any upload file with id " +uploadId + ", reason: " + error);
        return;
      }

      var is = fs.createReadStream(file.filepath);
      var os = fs.createWriteStream(newPath);

      murrix.logger.info(self.name, "Will move " + file.filepath + " to " + newPath + "...");

      util.pump(is, os, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to move file, reason: " + error);
          callback(error);
          return;
        }

        fs.unlinkSync(file.filepath);

        delete session.document.files[uploadId];

        session.save(function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.logger.info(self.name, "Successfully moved uploaded file");
          callback(null);
        });
      });
    });
  };

  self.start = function(session, size, filename, callback)
  {
    if (!session.document.files)
    {
      session.document.files = {};
    }

    file = { id: new ObjectID().toString(), size: size, name: filename, offset: 0, chunkSize: self.chunkSize, complete: false };

    file.filepath = murrix.config.getPathTemp() + "murrix_upload_" + file.id;

    fs.open(file.filepath, "a", self.defaultRights, function(error, fd)
    {
      if (error)
      {
        callback("Could not open " + file.filepath);
        return;
      }

      file.fd = fd;

      session.document.files[file.id] = file;

      session.save(function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, file.id, file.offset, file.chunkSize);
      });
    });
  };

  self.chunk = function(session, id, data, callback)
  {
    self.find(session, id, function(error, file)
    {
      if (error)
      {
        callback(error, id);
        return;
      }

      var buffer = new Buffer(data, "base64");

      fs.write(file.fd, buffer, 0, buffer.length, file.offset, function(error)
      {
        if (error)
        {
          callback("Could not write to file!", id);
          return;
        }

        file.offset += buffer.length;

        if (file.offset >= file.size)
        {
          fs.close(file.fd, function()
          {
            file.fd = null;

            murrix.utils.md5File(file.filepath, function(error, checksum)
            {
              if (error)
              {
                callback(error, id);
                return;
              }

              file.checksum = checksum;

              murrix.utils.readExif(file.filepath, function(error, data)
              {
                if (error)
                {
                  callback(error, id);
                  return;
                }

                file.exif = data;

                session.save(function(error)
                {
                  if (error)
                  {
                    callback(error);
                    return;
                  }

                  callback(null, id, 100, 0, 0); // Complete!
                });
              });
            });
          });
        }
        else
        {
          session.save(function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var progress = Math.min(99, Math.floor((file.offset / file.size) * 100)); // Never send back more than 99% here, 100% is the complete case

            callback(null, id, progress, file.offset, file.chunkSize);
          });
        }
      });
    });
  };
}

exports.Manager = MurrixUploadManager;
