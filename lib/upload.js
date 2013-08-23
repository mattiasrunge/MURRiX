
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var ObjectID = require("mongodb").ObjectID;
var events = require("events");

function MurrixUploadManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "upload";
  self.chunkSize = 524288 * 4;
  self.defaultRights = 775;

  murrix.client.on("done", function()
  {
    murrix.client.register("fileStart", function(session, args, callback)
    {
      self.start(session, args.size, args.filename, callback);
    });

    murrix.client.register("fileChunk", function(session, args, callback)
    {
      self.chunk(session, args.id, args.data, callback);
    });

    self.emit("done");
  });

  self.find = function(session, id, callback)
  {
    if (!session.document.files)
    {
      session.document.files = {};
    }

    if (!session.document.files[id])
    {
      callback("No such upload id exists, " + id);
      return;
    }

    callback(null, session.document.files[id]);
  };

  self.remove = function(session, id, callback)
  {
    self.find(session, id, function(error, fileItem)
    {
      if (error)
      {
        callback(error);
        return;
      }

      fs.unlink(fileItem.filepath, function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        delete session.document.files[id];

        session.save(function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          callback();
        });
      });
    });
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

    console.log("start", file);

    fs.open(file.filepath, "a", self.defaultRights, function(error, fd)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not open " + file.filepath);
        callback("Could not open " + file.filepath);
        return;
      }

      file.fd = fd;

      session.document.files[file.id] = file;

      murrix.logger.debug(self.name, "Saving session in upload start");

      session.save(function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to save session in upload start, reason: " + error);
          callback("Failed to save session in upload start, reason: " + error);
          return;
        }

        murrix.logger.debug(self.name, "Session saved in upload start!");
        callback(null, file.id, file.offset, file.chunkSize);
      });
    });
  };

  self.chunk = function(session, id, data, callback)
  {
    murrix.logger.debug(self.name, "Finding session with id " + id);
    self.find(session, id, function(error, file)
    {
      if (error)
      {
        callback(error, id);
        return;
      }

      murrix.logger.debug(self.name, "Decoding upload data!");
      var buffer = new Buffer(data, "base64");
      murrix.logger.debug(self.name, "Upload data decoded!");

      fs.write(file.fd, buffer, 0, buffer.length, file.offset, function(error)
      {
        if (error)
        {
          murrix.logger.error("Could not write to file, reason: " + error);
          callback("Could not write to file, reason: " + error, id);
          return;
        }

        file.offset += buffer.length;

        if (file.offset >= file.size)
        {
          fs.close(file.fd, function()
          {
            file.fd = null;

            murrix.logger.debug(self.name, "Calculating checksum in upload end!");

            murrix.utils.md5File(file.filepath, function(error, checksum)
            {
              if (error)
              {
                murrix.logger.error(self.name, "Failed to get checksum in upload end, reason: " + error);
                callback("Failed to get checksum in upload end, reason: " + error, id);
                return;
              }

              file.checksum = checksum;

              murrix.logger.debug(self.name, "Reading exif data in upload end");

              murrix.utils.readExif(file.filepath, function(error, data)
              {
                if (error)
                {
                  murrix.logger.error(self.name, "Failed to read exif in upload end, reason: " + error);
                  callback("Failed to read exif in upload end, reason: " + error, id);
                  return;
                }

                file.exif = data;

                murrix.logger.debug(self.name, "Saving session in upload end");

                session.save(function(error)
                {
                  if (error)
                  {
                    murrix.logger.error(self.name, "Failed to save session in upload end, reason: " + error);
                    callback("Failed to save session in upload end, reason: " + error);
                    return;
                  }

                  murrix.logger.debug(self.name, "Session saved in upload end!");
                  callback(null, id, 100, 0, 0); // Complete!
                });
              });
            });
          });
        }
        else
        {
          murrix.logger.debug(self.name, "Saving session in upload chunk");
          session.save(function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Failed to save session in upload chunk, reason: " + error);
              callback("Failed to save session in upload chunk, reason: " + error);
              return;
            }

            var progress = Math.min(99, Math.floor((file.offset / file.size) * 100)); // Never send back more than 99% here, 100% is the complete case

            murrix.logger.debug(self.name, "Session saved in upload chunk, progress is " + progress);

            callback(null, id, progress, file.offset, file.chunkSize);
          });
        }
      });
    });
  };
}

util.inherits(MurrixUploadManager, events.EventEmitter);

exports.Manager = MurrixUploadManager;
