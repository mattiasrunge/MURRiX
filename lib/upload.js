
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var MurrixUtils = require('./utils.js');

function UploadManager()
{
  var self = this;

  self.chunkSize = 524288;
  self.defaultRights = 0775;
  self.pathPrefix = "/tmp/murrix_upload_";

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

  self.start = function(session, size, filename, callback)
  {
    if (!session.document.files)
    {
      session.document.files = {};
    }

    file = { id: new ObjectID().toString(), size: size, name: filename, offset: 0, chunkSize: self.chunkSize, complete: false };

    file.filepath = self.pathPrefix + file.id;

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
      console.log(data);
      var buffer = new Buffer(data, "base64");

      fs.write(file.fd, buffer, 0, buffer.length, file.offset, function(error)
      {
        if (error)
        {
          callback("Could not write to file!", id);
          return;
        }

        file.offset += buffer.length;

        session.save(function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }
          
          if (file.offset >= file.size)
          {
            fs.close(file.fd, function()
            {
              file.fd = null;
              callback(null, id, 100, 0, 0); // Complete!
            });
          
            return;
          }
        
          var progress = Math.min(99, Math.floor(file.offset / file.size)); // Never send back more than 99% here, 100% is the complete case
        
          callback(null, id, progress, file.offset, file.chunkSize);
        });
      });
    });
  };
}

exports.UploadManager = UploadManager;
