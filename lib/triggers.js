
var stewardess = require("stewardess");
var fs = require("fs");
var path = require("path");
var MurrixChain = require("./chain.js").MurrixChain;
var events = require("events");
var util = require("util");

function MurrixTriggersManager(murrix, userTriggersFile)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "triggers";

  self.EVENT_ITEM_UPDATE = "updateItem";
  self.EVENT_ITEM_CREATE = "createItem";
  self.EVENT_ITEM_REMOVE = "removeItem";
  self.EVENT_NODE_UPDATE = "updateNode";
  self.EVENT_NODE_CREATE = "createNode";
  self.EVENT_NODE_REMOVE = "removeNode";

  murrix.db.on("done", function()
  {
    fs.exists(userTriggersFile, function(exists)
    {
      if (exists)
      {
        murrix.logger.info(self.name, "Found user triggers file at " + userTriggersFile);

        var triggers = require(userTriggersFile);

        murrix.db.mongoDb.collection("triggers", function(error, collection)
        {
          if (error)
          {
            murrix.logger.error(self.name, error);
            return;
          }

          var chain = new MurrixChain();

          for (var n = 0; n < triggers.length; n++)
          {
            chain.add(triggers[n], function(trigger, options, callback)
            {
              murrix.logger.info(self.name, "Found user trigger called " + trigger.name);

              collection.update({ _id: trigger._id }, trigger, { upsert: true }, function(error, numberOfUpdatedRows)
              {
                if (error)
                {
                  callback(error);
                  return;
                }

                callback();
              });
            });
          }

          chain.final(function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, error);
              return;
            }

            self.emit("done");
          });

          chain.run();
        });
      }
      else
      {
        self.emit("done");
      }
    });
  });


  self._chainUserTriggers = function(options, next)
  {
    murrix.db.find({ event: options.event }, "triggers", function(error, triggerList)
    {
      if (error)
      {
        options.error = "Unable to find triggers, reason: " + error;
        murrix.logger.error(self.name, options.error);
        next("break");
        return;
      }

      for (var id in triggerList)
      {
        var trigger = triggerList[id];
        var matched = true;

        for (var n = 0; n < trigger.criterias.length; n++)
        {
          if (trigger.criterias[n].match === "eq")
          {
            if (options.dataNew[trigger.criterias[n].key] !== trigger.criterias[n].value)
            {
              matched = false;
              break;
            }
          }
          else if (trigger.criterias[n].match === "ne")
          {
            if (options.dataNew[trigger.criterias[n].key] === trigger.criterias[n].value)
            {
              matched = false;
              break;
            }
          }
          else if (trigger.criterias[n].match === "in")
          {
            if (!murrix.utils.inArray(trigger.criterias[n].value, options.dataNew[trigger.criterias[n].key]))
            {
              matched = false;
              break;
            }
          }
          else if (trigger.criterias[n].match === "nin")
          {
            if (murrix.utils.inArray(trigger.criterias[n].value, options.dataNew[trigger.criterias[n].key]))
            {
              matched = false;
              break;
            }
          }
          else
          {
            murrix.logger.error(self.name, "Unknown match type:" + trigger.criterias[n].match);
            murrix.logger.debug(self.name, trigger.criterias[n]);
            matched = false;
          }
        }

        if (matched)
        {
          for (var n = 0; n < trigger.actions.length; n++)
          {
            if (trigger.actions[n].action === "set")
            {
              options.dataNew[trigger.actions[n].key] = trigger.actions[n].value;
            }
            else if (trigger.actions[n].action === "push")
            {
              options.dataNew[trigger.actions[n].key] = options.dataNew[trigger.actions[n].key] || [];
              options.dataNew[trigger.actions[n].key].push(trigger.actions[n].value);
            }
          }
        }
      }

      next();
    });
  };

  self._chainClearCache = function(options, next)
  {
    if (options.event !== self.EVENT_ITEM_UPDATE && options.event !== self.EVENT_ITEM_REMOVE)
    {
      next();
      return;
    }

    var clear = false;

    if (options.event === self.EVENT_ITEM_REMOVE)
    {
      murrix.logger.info(self.name, "Item removed, will clear cached files!");

      clear = true;
    }
    else if (options.dataOld.angle !== options.dataNew.angle ||
             options.dataOld.mirror !== options.dataNew.mirror)
    {
      murrix.logger.info(self.name, "Angle or mirror has changed on item, will clear cache and set a new cache id!");

      options.dataNew.cacheId = murrix.utils.timestamp();

      clear = true;
    }

    if (clear)
    {
      murrix.cache.clear(options.dataOld._id, function(error)
      {
        if (error)
        {
          options.error = "Failed to clear cache, reason: " + error;
          murrix.logger.error(self.name, options.error);
          next("break");
          return;
        }

        next();
      });

      return;
    }

    next();
  };

  self._chainQueueCache = function(options, next)
  {
    if ((options.event !== self.EVENT_ITEM_UPDATE && options.event !== self.EVENT_ITEM_CREATE) || !murrix.server.started)
    {
      next();
      return;
    }

    if (options.dataOld.cacheId !== options.dataNew.cacheId && options.dataNew.what === "file")
    {
      if (murrix.utils.mimeIsRawImage(options.dataNew.exif.MIMEType))
      {
        murrix.logger.info(self.name, "Will not auto queue raw files");
      }
      else
      {
        murrix.logger.info(self.name, "Cache id has changed on item with id " + options.dataNew._id + ", will queue some common sizes of cached versions");

        /* TODO: Investigate what sizes we actually have */
        var cacheOptions = [ /* TODO: This list should match what the GUI needs, have it in a file somewhere */
          { width: 250, height: 250, square: 1, type: "image" },
          { width: 80, height: 80, square: 1, type: "image" },
          { width: 1400, height: 0, square: 0, type: "image" }
        ];

        if (murrix.utils.mimeIsVideo(options.dataNew.exif.MIMEType) || murrix.utils.mimeIsAudio(options.dataNew.exif.MIMEType))
        {
          cacheOptions.push({ type: "video" });
        }

        for (var n = 0; n < cacheOptions.length; n++)
        {
          murrix.cache.queueItem(options.dataNew._id, cacheOptions[n]);
        }
      }
    }

    next();
  };

  self._chainItemUpdateTimestamp = function(options, next)
  {
    if (options.event !== self.EVENT_ITEM_UPDATE && options.event !== self.EVENT_ITEM_CREATE)
    {
      next();
      return;
    }

    if (options.dataOld._with !== options.dataNew._with ||
        JSON.stringify(options.dataOld.when) !== JSON.stringify(options.dataNew.when))
    {
      murrix.logger.info(self.name, "Item with id " + options.dataNew._id + ", has changed the when structure, will regenerate timestamp");

      murrix.db.findOne({ _id: options.dataNew._with }, "nodes", function(error, nodeData)
      {
        if (error)
        {
          options.error = "Failed to get camera node, reason: " + error;
          murrix.logger.error(self.name, options.error);
          next("break");
          return;
        }

        options.dataNew.when = options.dataNew.when || {};
        options.dataNew.when.source = options.dataNew.when.source || false;
        options.dataNew.when.timestamp = options.dataNew.when.timestamp || false;

        var cameraSettings = {};
        cameraSettings.referenceTimelines = [];
        cameraSettings.mode = false;

        if (nodeData)
        {
          cameraSettings.referenceTimelines = murrix.utils.sortCameraReferenceTimeline(nodeData.referenceTimelines || []);
          cameraSettings.mode = nodeData.mode;
        }

        options.dataNew.when.timestamp = murrix.utils.getWhenTimestamp(options.dataNew.when.source, cameraSettings);

        next();
      });

      return;
    }

    next();
  };

  self._chainCameraUpdateItemTimestamp = function(options, next)
  {
    if (options.event !== self.EVENT_NODE_UPDATE)
    {
      next();
      return;
    }

    if (options.dataOld.mode !== options.dataNew.mode ||
        JSON.stringify(options.dataOld.referenceTimelines) !== JSON.stringify(options.dataNew.referenceTimelines))
    {
      murrix.logger.info(self.name, "Mode or reference timelines has changed on camera node with id " + options.dataNew._id + ", will regenerate item timestamps");

      var cameraSettings = {};
      cameraSettings.referenceTimelines = murrix.utils.sortCameraReferenceTimeline(options.dataNew.referenceTimelines || []);
      cameraSettings.mode = options.dataNew.mode;

      murrix.db.find({ _with: options.dataNew._id }, "items", function(error, itemDataList)
      {
        if (error)
        {
          options.error = "Failed to get items, reason: " + error;
          murrix.logger.error(self.name, options.error);
          next("break");
          return;
        }

        var itemChain = stewardess();

        for (var n = 0; n < itemDataList.length; n++)
        {
          var itemData = itemDataList[n];

          itemChain.add(function(options2, next2)
          {
            itemData.when = itemData.when || {};
            itemData.when.source = itemData.when.source || false;
            itemData.when.timestamp = murrix.utils.getWhenTimestamp(itemData.when.source, cameraSettings);

            murrix.db.save(itemData, "items", false, function(error)
            {
              if (error)
              {
                options2.error = "Failed to save item, reason: " + error;
                murrix.logger.error(self.name, options2.error);
                next2("break");
                return;
              }

              next2();
            });
          });
        }

        itemChain.final(function(options2)
        {
          if (options2.error)
          {
            options.error = options2.error;
            next("break");
            return;
          }

          next();
        });

        itemChain.run({});
      });

      return;
    }

    next();
  };


  self.chainItemUpdatePartnerProgessList = [];

  self._chainItemUpdatePartner = function(options, next)
  {
    if (options.event !== self.EVENT_NODE_UPDATE && options.event !== self.EVENT_NODE_CREATE)
    {
      next();
      return;
    }

    var itemChain = stewardess();

    var oldPartner = options.dataOld.family ? options.dataOld.family._partner : false;
    var newPartner = options.dataNew.family ? options.dataNew.family._partner : false;


    if (oldPartner != newPartner)
    {
      if (oldPartner)
      {
        itemChain.add(function(options2, next2)
        {
          if (murrix.utils.inArray(options.dataOld._id, self.chainItemUpdatePartnerProgessList))
          {
            murrix.logger.debug(self.name, "For old person with id " + options.dataOld._id + ", the partner with id " + options.dataOld.family._partner + ", seem to already be in a trigger, will do nothing and avoid infinate recursion!");
            next2();
            return;
          }

          murrix.logger.debug(self.name, "old person with id " + options.dataNew._id + ", the partner with id " + options.dataNew.family._partner + ", we will reset the partner.");

          murrix.db.findOne({ _id: options.dataOld.family._partner }, "nodes", function(error, nodeData)
          {
            if (error)
            {
              options2.error = "Failed to get old partner node, reason: " + error;
              murrix.logger.error(self.name, options2.error);
              next2("break");
              return;
            }

            if (!nodeData)
            {
              murrix.logger.debug(self.name, "Old partner with id " + options.dataOld.family._partner + " was not found, probably invalid id, will not reset!");
              next2();
              return;
            }

            if (nodeData.family._partner !== options.dataNew._id)
            {
              murrix.logger.debug(self.name, "Old partner with id " + options.dataOld.family._partner + " did not have the current node as partner, will not reset!");
              next2();
              return;
            }

            nodeData.family._partner = false;

            self.chainItemUpdatePartnerProgessList.push(options.dataOld.family._partner);

            murrix.db.save(nodeData, "nodes", self.EVENT_NODE_UPDATE, function(error)
            {
              self.chainItemUpdatePartnerProgessList = self.chainItemUpdatePartnerProgessList.filter(function(id)
              {
                return id !== options.dataOld.family._partner;
              });

              if (error)
              {
                options2.error = "Failed to save node, reason: " + error;
                murrix.logger.error(self.name, options2.error);
                next2("break");
                return;
              }

              next2();
            });
          });
        });
      }

      if (newPartner)
      {
        itemChain.add(function(options2, next2)
        {
          if (murrix.utils.inArray(options.dataNew._id, self.chainItemUpdatePartnerProgessList))
          {
            murrix.logger.debug(self.name, "For new person with id " + options.dataNew._id + ", the partner with id " + options.dataNew.family._partner + ", seem to already be in a trigger, will do nothing and avoid infinate recursion!");
            next2();
            return;
          }

          murrix.logger.debug(self.name, "New person with id " + options.dataNew._id + ", the partner with id " + options.dataNew.family._partner + ", we will set the partner to this person.");

          murrix.db.findOne({ _id: options.dataNew.family._partner }, "nodes", function(error, nodeData)
          {
            if (error)
            {
              options2.error = "Failed to get new partner node, reason: " + error;
              murrix.logger.error(self.name, options2.error);
              next2("break");
              return;
            }

            if (!nodeData)
            {
              options2.error = "New partner with id " + options.dataNew.family._partner + " was not found, probably invalid id!";
              murrix.logger.error(self.name, options2.error);
              next2("break");
              return;
            }

            nodeData.family._partner = options.dataNew._id;

            self.chainItemUpdatePartnerProgessList.push(options.dataNew.family._partner);

            murrix.db.save(nodeData, "nodes", self.EVENT_NODE_UPDATE, function(error)
            {
              self.chainItemUpdatePartnerProgessList = self.chainItemUpdatePartnerProgessList.filter(function(id)
              {
                return id !== options.dataNew.family._partner;
              });

              if (error)
              {
                options2.error = "Failed to save node, reason: " + error;
                murrix.logger.error(self.name, options2.error);
                next2("break");
                return;
              }

              next2();
            });
          });
        });
      }
    }


    itemChain.final(function(options2)
    {
      if (options2.error)
      {
        options.error = options2.error;
        next("break");
        return;
      }

      next();
    });

    itemChain.run({});
  };

  self._chainItemUpdateRotateShowing = function(options, next)
  {
    if (options.event !== self.EVENT_ITEM_UPDATE)
    {
      next();
      return;
    }

    if ((options.dataOld.angle !== options.dataNew.angle ||
        options.dataOld.mirror !== options.dataNew.mirror) &&
        options.dataNew.showing)
    {
      var angleOffset = (options.dataOld.angle || 0) - (options.dataNew.angle || 0);

      murrix.logger.debug(self.name, "Item angle or mirror flag has changed, will try to fix the showing if there are any!");

      if (angleOffset === 90 || angleOffset === -270)
      {
        for (var n = 0; n < options.dataNew.showing.length; n++)
        {
          var x = options.dataNew.showing[n].x;
          var y = options.dataNew.showing[n].y;
          var width = options.dataNew.showing[n].width;
          var height = options.dataNew.showing[n].height;

          options.dataNew.showing[n].x = 1 - y;
          options.dataNew.showing[n].y = x;
          options.dataNew.showing[n].width = height;
          options.dataNew.showing[n].height = width;
        }
      }
      else if (angleOffset === -90 || angleOffset === 270)
      {
        for (var n = 0; n < options.dataNew.showing.length; n++)
        {
          var x = options.dataNew.showing[n].x;
          var y = options.dataNew.showing[n].y;
          var width = options.dataNew.showing[n].width;
          var height = options.dataNew.showing[n].height;

          options.dataNew.showing[n].x = y;
          options.dataNew.showing[n].y = 1 - x;
          options.dataNew.showing[n].width = height;
          options.dataNew.showing[n].height = width;
        }
      }
      else if (Math.abs(angleOffset) === 180)
      {
        for (var n = 0; n < options.dataNew.showing.length; n++)
        {
          var x = options.dataNew.showing[n].x;
          var y = options.dataNew.showing[n].y;

          options.dataNew.showing[n].x = 1 - x;
          options.dataNew.showing[n].y = 1 - y;
        }
      }

      if (options.dataOld.mirror !== options.dataNew.mirror)
      {
        for (var n = 0; n < options.dataNew.showing.length; n++)
        {
          var x = options.dataNew.showing[n].x;

          options.dataNew.showing[n].x = 1 - x;
        }
      }
    }

    next();
  };

  self._chainItemRemoveFile = function(options, next)
  {
    if (options.event !== self.EVENT_ITEM_REMOVE)
    {
      next();
      return;
    }

    if (options.dataOld.what !== "file")
    {
      next();
      return;
    }

    var fileChain = new MurrixChain();
    var filesPath = path.resolve(murrix.basePath(), murrix.config.filesPath) + "/";
    var filenames = [];

    filenames.push(filesPath + options.dataOld._id);

    if (options.dataOld.versions)
    {
      for (var n = 0; n < options.dataOld.versions.length; n++)
      {
        filenames.push(filesPath + options.dataOld.versions[n].id);
      }
    }

    // TODO: Create utility function to remove a list of files
    for (var n = 0; n < filenames.length; n++)
    {
      fileChain.add(filenames[n], function(filename, options, callback)
      {
        murrix.utils.removeFile(filename, function(error, existed)
        {
          if (error)
          {
            return callback("Failed to remove file, reason: " + error);
          }

          if (existed)
          {
            murrix.logger.debug(self.name, "Removed " + filename + "!");
          }
          else
          {
            murrix.logger.debug(self.name, filename + " never existed!");
          }

          callback();
        });
      });
    }

    fileChain.final(function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        options.error = error;
        next("break");
        return;
      }

      next();
    });

    fileChain.run();
  };

  self._chainNodeRemoveItems = function(options, next)
  {
    if (options.event !== self.EVENT_NODE_REMOVE)
    {
      next();
      return;
    }

    murrix.db.find({ _parents: options.dataOld._id }, "items", function(error, itemDataList)
    {
      if (error)
      {
        options.error = "Failed to get items, reason: " + error;
        murrix.logger.error(self.name, options.error);
        next("break");
        return;
      }

      var itemChain = new MurrixChain();

      for (var n = 0; n < itemDataList.length; n++)
      {
        var itemData = itemDataList[n];

        itemChain.add(itemData, function(itemData, options, callback)
        {
          itemData._parents = itemData._parents.filter(function(element)
          {
            return element !== options.dataOld._id;
          });

          if (itemData._parents.length === 0)
          {
            murrix.logger.debug(self.name, "Item " + itemData.name + " (" + itemData._id + ") has no more parents, will remove it!");

            murrix.db.remove(itemData._id, "items", self.EVENT_ITEM_REMOVE, function(error)
            {
              if (error)
              {
                return callback("Failed to remove item, reason: " + error);
              }

              callback();
            });
          }
          else
          {
            murrix.logger.debug(self.name, "Item " + itemData.name + " (" + itemData._id + ") has other parents, will update parent list!");

            murrix.db.save(itemData, "items", self.EVENT_ITEM_UPDATE, function(error)
            {
              if (error)
              {
                return callback("Failed to save item, reason: " + error);
              }
            });

            callback();
          }
        });
      }

      itemChain.final(function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          options.error = error;
          next("break");
          return;
        }

        next();
      });

      itemChain.run(options);
    });
  };

  self._createBeforeChain = function(callback)
  {
    var chain = stewardess();

    // Setting _partner on person node should set _partner on the partner node also
    chain.add(function(options, next) { self._chainItemUpdatePartner(options, next); });

    // Update timestamp on items if camera changes
    chain.add(function(options, next) { self._chainCameraUpdateItemTimestamp(options, next); });

    // Update timestamp if when.source on item changes
    // Update timestamp if _with on item changes
    chain.add(function(options, next) { self._chainItemUpdateTimestamp(options, next); });

    // Rotate showing if angle or mirror changes
    chain.add(function(options, next) { self._chainItemUpdateRotateShowing(options, next); });

    // Setting location should trigger a update of presentation timezone

    // On node remove, remove all items where node is only parent otherwise remove from parent list
    chain.add(function(options, next) { self._chainNodeRemoveItems(options, next); });

    // On angle, mirror change clear cache and update changetimestamp or clear cache when item removed
    chain.add(function(options, next) { self._chainClearCache(options, next); });

    // On node remove, remove from _profilePictures, showing, _partners etc

    chain.add(function(options, next) { self._chainUserTriggers(options, next); });

    chain.final(function(options)
    {
      if (options.error)
      {
        callback(options.error);
        return;
      }

      callback(null, options.dataNew);
    });

    return chain;
  };

  self._createAfterChain = function(callback)
  {
    var chain = stewardess();

    // On event trigger to delete file, remove file from disk
    chain.add(function(options, next) { self._chainItemRemoveFile(options, next); });

    // On event trigger queing of cache
    chain.add(function(options, next) { self._chainQueueCache(options, next); });

    chain.final(function(options)
    {
      if (options.error)
      {
        callback(options.error);
        return;
      }

      callback(null, options.dataNew);
    });

    return chain;
  };

  self.triggerPreSave = function(event, dataOld, dataNew, callback)
  {
    if (event === false)
    {
      return;
    }

    var chain = self._createBeforeChain(callback);
    var options = {};

    options.event = event;
    options.dataOld = dataOld;
    options.dataNew = dataNew;

    chain.run(options);
  };

  self.triggerPostSave = function(event, dataOld, dataNew, callback)
  {
    if (event === false)
    {
      return;
    }

    var chain = self._createAfterChain(callback);
    var options = {};

    options.event = event;
    options.dataOld = dataOld;
    options.dataNew = dataNew;

    chain.run(options);
  };
}

util.inherits(MurrixTriggersManager, events.EventEmitter);

exports.Manager = MurrixTriggersManager;
