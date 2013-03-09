
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var MurrixChain = require("./chain.js").MurrixChain;
var ObjectID = require("mongodb").ObjectID;
var events = require("events");

function MurrixImportManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "import";

  murrix.client.on("done", function()
  {
    murrix.client.register("importUploadedFile", function(session, args, callback)
    {
      self.importUploadedFile(session, args.uploadId, args.parentId, callback);
    });

    murrix.client.register("importUploadedFileVersion", function(session, args, callback)
    {
      self.importUploadedFileVersion(session, args.uploadId, args.itemId, callback);
    });

    self.emit("done");
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

  self.importDirectory = function(session, directory, options, callback)
  {
    var abspath = path.resolve(murrix.basePath(), directory);

    murrix.logger.info(self.name, "Will import " + abspath);

    fs.readdir(abspath, function(error, list)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
        return;
      }

      var directories = [];
      var files = [];

      for (var n = 0; n < list.length; n++)
      {
        var stat = fs.statSync(abspath + "/" + list[n]);

        if (stat.isDirectory())
        {
          directories.push(list[n]);
        }
        else if (stat.isFile())
        {
          files.push({ name: list[n], isRaw: false, size: stat.size });
        }
      }

      var typeChain = new MurrixChain();

      for (var n = 0; n < files.length; n++)
      {
        typeChain.add(files[n], function(file, options, chainCallback)
        {
          murrix.utils.readMimeType(abspath + "/" + file.name, function(error, mimetype)
          {
            if (error)
            {
              chainCallback(error);
              return;
            }

            file.isRaw = murrix.utils.mimeIsRawImage(mimetype);
            chainCallback();
          });
        });
      }

      typeChain.final(function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          callback(error);
        }

        files.sort(function(a, b)
        {
          if (a.isRaw && !b.isRaw)
          {
            return 1;
          }
          else if (!a.isRaw && b.isRaw)
          {
            return -1;
          }

          return 0;
        });

        murrix.logger.info(self.name, "Will create parent node of type " + options.type + " called " + path.basename(abspath));

        nodeData = {};
        nodeData.type = options.type;
        nodeData.name = path.basename(abspath);

        murrix.db.nodes.save(session, nodeData, function(error, nodeDataNew)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.logger.info(self.name, "Created node " + nodeDataNew.name + " with id " + nodeDataNew._id + " successfully!");

          var chain = new MurrixChain();

          for (var n = 0; n < files.length; n++)
          {
            chain.add(files[n], function(file, options, chainCallback)
            {
              if (!file.isRaw)
              {
                murrix.logger.info(self.name, "Will import " + file.name + "!");
                self.importFile(session, file.name, abspath + "/" + file.name, nodeDataNew._id, function(error, itemData)
                {
                  if (error)
                  {
                    chainCallback(error);
                    return;
                  }

                  murrix.logger.info(self.name, "Imported " + itemData.name + " with id " + itemData._id + " successfully!");
                  chainCallback();
                });
              }
              else
              {
                var name = path.basename(file.name, path.extname(file.name));
                var query = {};

                query.$and = [ { name: { $regex: "^" + name + "[.]", $options: "-i" } }, { name: { $ne: file.name } } ];
                query._parents = [ nodeDataNew._id ];

                murrix.db.findOne(query, "items", function(error, itemData)
                {
                  if (error)
                  {
                    chainCallback(error);
                    return;
                  }

                  if (!itemData)
                  {
                    murrix.logger.debug(self.name, "Found nowhere to hide " + file.name + " will import instead!");

                    self.importFile(session, file.name, abspath + "/" + file.name, nodeDataNew._id, function(error, itemData)
                    {
                      if (error)
                      {
                        chainCallback(error);
                        return;
                      }

                      murrix.logger.info(self.name, "Imported " + itemData.name + " with id " + itemData._id + " successfully!");
                      chainCallback();
                    });

                    return;
                  }

                  murrix.logger.info(self.name, "Will import " + file.name + " as a version to " + itemData.name + "!");

                  self.importFileVersion(session, file.name, file.size, abspath + "/" + file.name, itemData._id, function(error, itemData)
                  {
                    if (error)
                    {
                      chainCallback(error);
                      return;
                    }

                    murrix.logger.info(self.name, "Imported version of " + itemData.name + " with id " + itemData._id + " successfully!");
                    chainCallback();
                  });
                });
              }
            });
          }

          chain.final(function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, error);
              callback(error);
            }

            callback();
          });

          chain.run();
        });

      });

      typeChain.run();
    });
  };

  self.importFile = function(session, filename, sourceFilename, parentId, callback)
  {
    var id = murrix.db.generateId();

    murrix.utils.copyFile(sourceFilename, murrix.config.getPathFiles() + id, function(error)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self._createItem(session, id, filename, sourceFilename, parentId, function(error, itemData)
      {
        if (error)
        {
          murrix.utils.removeFile(murrix.config.getPathFiles() + id);
          callback(error);
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

        var versionId = murrix.db.generateId();

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

  self._createItem = function(session, id, name, filename, parentId, callback)
  {
    var chain = new MurrixChain();
    var itemData = {};

    itemData._newId = id;
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
      if (itemData.exif.GPSDateTime)
      {
        itemData.when.source = {};
        itemData.when.source.type = "gps";
        itemData.when.source.datestring = murrix.utils.cleanDatestring(itemData.exif.GPSDateTime);

        itemData.where = {};
        itemData.where.longitude = itemData.exif.GPSLongitude;
        itemData.where.latitude = itemData.exif.GPSLatitude;
        itemData.where.source = "gps";
      }
      else if (itemData.exif.DateTimeOriginal)
      {
        itemData.when.source = {};
        itemData.when.source.type = "camera";
        itemData.when.source.datestring = murrix.utils.cleanDatestring(itemData.exif.DateTimeOriginal);
        itemData.when.source.reference = false;
        itemData.when.source.timezone = false;
      }

      if (itemData.exif.Orientation === 8) // 270 CW (90 CCW)
      {
        // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
        if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
        {
          itemData.angle = 90;
        }
      }
      else if (itemData.exif.Orientation === 6) // 90 CW (270 CCW)
      {
        // A workaround for images which are already rotated but have not updated the exif data, should work most of the time
        if (itemData.exif.ExifImageWidth > itemData.exif.ExifImageHeight)
        {
          itemData.angle = 270;
        }
      }
      else if (itemData.exif.Orientation === 3) // 180 CW (180 CCW)
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
      if (itemData.exif.SerialNumber)
      {
        murrix.db.findOne({ type: "camera", serial: itemData.exif.SerialNumber }, "nodes", function(error, nodeData)
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

util.inherits(MurrixImportManager, events.EventEmitter);

exports.Manager = MurrixImportManager;
