
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var MurrixChain = require("./chain.js").MurrixChain;
var ObjectID = require("mongodb").ObjectID;

function MurrixImportManager(murrix)
{
  var self = this;

  self.name = "import";

  murrix.on("init", function()
  {
    murrix.client.register("importUploadedFile", function(session, args, callback)
    {
      self.importUploadedFile(session, args.uploadId, args.parentId, callback);
    });

    murrix.client.register("importUploadedFileVersion", function(session, args, callback)
    {
      self.importUploadedFileVersion(session, args.uploadId, args.itemId, callback);
    });
  });

  self.importUploadedFile = function(session, uploadId, parentId, callback)
  {
    murrix.upload.find(session, uploadId, function(error, fileItem)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.importFile(session, fileItem.name, fileItem.filepath, parentId, function(error, itemData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.upload.remove(session, uploadId, function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to remove uploaded file, reason: " + error);
          }

          callback(null, itemData);
        });
      });
    });
  };

  self.importUploadedFileVersion = function(session, uploadId, itemId, callback)
  {
    murrix.upload.find(session, uploadId, function(error, fileItem)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.importFileVersion(session, fileItem.name, fileItem.size, fileItem.filepath, itemId, function(error, itemData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.upload.remove(session, uploadId, function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to remove uploaded file, reason: " + error);
          }

          callback(null, itemData);
        });
      });
    });
  };

  self.importFile = function(session, filename, sourceFilename, parentId, callback)
  {
    self._createItem(session, filename, sourceFilename, parentId, function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      murrix.utils.copyFile(sourceFilename, murrix.config.getPathFiles() + itemData._id, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to copy file, will remove item from database, reason: " + error);

          self.items.remove(session, itemData._id, function(error2)
          {
            if (error2)
            {
              murrix.logger.error(self.name, "Failed to remove item from database, reason: " + error2);
            }

            callback(error);
          });

          return;
        }

        callback(null, itemData);
      });
    });
  };

  self.importFileVersion = function(session, filename, size, sourceFilename, itemId, callback)
  {
    murrix.db.findOne({ _id: itemId }, "items", function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      murrix.utils.md5File(sourceFilename, function(error, checksum)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var versionId = new ObjectID().toString();

        itemData.versions = itemData.versions || [];
        itemData.versions.push({ id: versionId, name: filename, size: size, checksum: checksum });

        murrix.db.items.save(session, itemData, function(error, itemDataNew)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.utils.copyFile(sourceFilename, murrix.config.getPathFiles() + versionId, function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Failed to copy file, reason: " + error);
              callback("Failed to copy file, reason: " + error);
              return;
            }

            callback(null, itemData);
          });
        });
      });
    });
  };

  self._createItem = function(session, name, filename, parentId, callback)
  {
    var chain = new MurrixChain();
    var itemData = {};

    itemData._parents = [ parentId ];
    itemData.what = "file";
    itemData.name = name;
    itemData.when = { timestamp: false, source: false };
    itemData.where = false;
    itemData.exif = {};
    itemData.checksum = false;
    itemData.angle = 0;
    itemData.mirror = false;
    itemData.description = "";
    itemData._with = false;
    itemData.cacheId = 0;

    chain.add(null, function(data, options, chainCallback)
    {
      murrix.utils.md5File(filename, function(error, checksum)
      {
        if (error)
        {
          chainCallback(error);
          return;
        }

        itemData.checksum = checksum;
        chainCallback();
      });
    });

    chain.add(null, function(data, options, chainCallback)
    {
      murrix.utils.readExif(filename, function(error, exif)
      {
        if (error)
        {
          chainCallback(error);
          return;
        }

        itemData.exif = exif;
        chainCallback();
      });
    });

    chain.add(null, function(data, options, chainCallback)
    {
      if (file.exif.GPSDateTime)
      {
        itemData.when.source = {};
        itemData.when.source.type = "gps";
        itemData.when.source.datestring = murrix.utils.cleanDatestring(file.exif.GPSDateTime);

        itemData.where = {};
        itemData.where.longitude = file.exif.GPSLongitude;
        itemData.where.latitude = file.exif.GPSLatitude;
        itemData.where.source = "gps";
      }
      else if (file.exif.DateTimeOriginal)
      {
        itemData.when.source = {};
        itemData.when.source.type = "camera";
        itemData.when.source.datestring = murrix.utils.cleanDatestring(file.exif.DateTimeOriginal);
        itemData.when.source.reference = false;
        itemData.when.source.timezone = false;
      }

      if (file.exif.Orientation === 8) // 270 CW (90 CCW)
      {
        // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
        if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
        {
          itemData.angle = 90;
        }
      }
      else if (file.exif.Orientation === 6) // 90 CW (270 CCW)
      {
        // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
        if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
        {
          itemData.angle = 270;
        }
      }
      else if (file.exif.Orientation === 3) // 180 CW (180 CCW)
      {
        if (itemData.exif.ExifImageHeight > itemData.exif.ExifImageWidth)
        {
          itemData.angle = 180;
        }
      }

      chainCallback();
    });

    chain.add(null, function(data, options, chainCallback)
    {
      if (file.exif.SerialNumber)
      {
        murrix.db.findOne({ type: "camera", serial: file.exif.SerialNumber }, "nodes", function(error, nodeData)
        {
          if (error)
          {
            chainCallback("Failed to get camera, reason: " + error);
            return;
          }

          if (nodeData)
          {
            itemData._with = nodeData._id;
          }

          chainCallback();
        });

        return;
      }

      chainCallback();
    });

    chain.final(function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
      }

      murrix.db.items.save(session, itemData, function(error, itemDataNew)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, itemDataNew);
      });
    });

    chain.run();
  };
}

exports.Manager = MurrixImportManager;
