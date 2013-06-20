
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var MurrixChain = require("./chain.js").MurrixChain;
var ObjectID = require("mongodb").ObjectID;
var events = require("events");
var Gedcom = require("gedcom-stream");

function MurrixImportManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "import";
  self.ignoreList = [ "Thumbs.db", ".directory" ];

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

  self._findOrCreateImportNode = function(session, abspath, options, callback)
  {
    if (options.id)
    {
      murrix.db.findOneWithRights(session, { _id: options.id }, "nodes", function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.logger.info(self.name, "Found node " + nodeData.name + " with id " + nodeData._id + " successfully!");

        callback(null, nodeData);
      });
    }
    else
    {
      murrix.logger.info(self.name, "Will create parent node of type " + options.type + " called " + path.basename(abspath));

      var nodeData = {};
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

        callback(null, nodeDataNew);
      });
    }
  };

  self.importDirectory = function(session, directory, options, callback)
  {
    var abspath = path.resolve(murrix.basePath(), directory);

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
      var n = 0;

      for (n = 0; n < list.length; n++)
      {
        var stat = fs.statSync(abspath + "/" + list[n]);

        if (stat.isDirectory())
        {
          directories.push(list[n]);
        }
        else if (stat.isFile() && !murrix.utils.inArray(list[n], self.ignoreList))
        {
          files.push({ name: list[n], isRaw: false, size: stat.size });
        }
      }

      var importChain = new MurrixChain();

      if (options.recursive)
      {
        var importFunction = function(directoryName, options2, chainCallback)
        {
          self.importDirectory(session, abspath + "/" + directoryName, options, function(error)
          {
            if (error)
            {
              chainCallback(error);
              return;
            }

            chainCallback();
          });
        };

        for (n = 0; n < directories.length; n++)
        {
          importChain.add(directories[n], importFunction);
        }
      }

      var mimeTypeFunction = function(file, options2, chainCallback)
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
      };

      for (n = 0; n < files.length; n++)
      {
        importChain.add(files[n], mimeTypeFunction);
      }

      importChain.final(function(error)
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

        if (files.length === 0)
        {
          murrix.logger.info(self.name, abspath + " is empty will not import it!");
          callback();
        }
        else
        {
          self._findOrCreateImportNode(session, abspath, options, function(error, nodeData)
          {
            if (error)
            {
              callback(error);
              return;
            }

            murrix.logger.info(self.name, "Created node " + nodeData.name + " with id " + nodeData._id + " successfully!");

            var chain = new MurrixChain();

            for (var n = 0; n < files.length; n++)
            {
              chain.add(files[n], function(file, options, chainCallback)
              {
                if (!file.isRaw)
                {
                  murrix.logger.info(self.name, "Will import " + file.name + "!");
                  self.importFile(session, file.name, abspath + "/" + file.name, nodeData._id, function(error, itemData)
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
                  query._parents = [ nodeData._id ];

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

                      self.importFile(session, file.name, abspath + "/" + file.name, nodeData._id, function(error, itemData)
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

                    murrix.logger.info(self.name, "Will import " + file.name + " as a version of " + itemData.name + "!");

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
        }
      });

      importChain.run();
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

  self.importGedcom = function(session, file, options, callback)
  {
    var abspath = path.resolve(murrix.basePath(), file);
    var gedcom = new Gedcom();

    var nodes = [];

    gedcom.on("data", function(item)
    {
      var node = {};

      if (item.name === "INDI")
      {
        for (var n = 0; n < item.children.length; n++)
        {
          var sitem = item.children[n];

          if (sitem.name === "SEX") // Indicates the sex of an individual--male or female.
          {
            node.gender = sitem.value.toLowerCase();
          }
          else if (sitem.name === "NAME") // A word or combination of words used to help identify an individual, title, or other item. More than one NAME line should be used for people who were known by multiple names.
          {
            node.birthname = sitem.value;
          }
          else if (sitem.name === "BIRT") // The event of entering into life.
          {
          }
          else if (sitem.name === "CHR") // The religious event (not LDS) of baptizing and/or naming a child.
          {
          }
          else if (sitem.name === "RESI") // The act of dwelling at an address for a period of time.
          {
          }
          else if (sitem.name === "EMIG") // An event of leaving one's homeland with the intent of residing elsewhere.
          {
          }
          else if (sitem.name === "IMMI") // An event of entering into a new locality with the intent of residing there.
          {
          }
          else if (sitem.name === "OCCU") // The type of work or profession of an individual.
          {
          }
          else if (sitem.name === "DEAT") // The event when mortal life terminates.
          {
          }
          else if (sitem.name === "BURI") // The event of the proper disposing of the mortal remains of a deceased person.
          {
          }
          else if (sitem.name === "NOTE") // Additional information provided by the submitter for understanding the enclosing data.
          {
          }
          else if (sitem.name === "FAMS") // Identifies the family in which an individual appears as a spouse.
          {
          }
          else if (sitem.name === "FAMC") // Identifies the family in which an individual appears as a child.
          {
          }
          else if (sitem.name === "CHAN") // Indicates a change, correction, or modification. Typically used in connection with a DATE to specify when a change in information occurred.
          {
          }
          else if (sitem.name === "EVEN") // A noteworthy happening related to an individual, a group, or an organization.
          {
          }
          else
          {
            murrix.logger.debug(self.name, "Unknown subitem tag name: " + sitem.name);
          }
        }

        nodes[item.id] = node;
      }
      else if (item.name === "FAM")
      {

      }
      else if (item.name === "SOUR")
      {

      }
      else
      {
        murrix.logger.debug(self.name, "Unknown item tag name: " + item.name);
      }
    });

    gedcom.on("end", function()
    {
      //console.log(JSON.stringify(nodes, null, 2));
      callback();
    });

    fs.createReadStream(abspath).pipe(gedcom);
  };
}

util.inherits(MurrixImportManager, events.EventEmitter);

exports.Manager = MurrixImportManager;
