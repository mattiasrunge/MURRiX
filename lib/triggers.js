
var stewardess = require("stewardess");
var fs = require("fs");

function MurrixTriggerManager(murrix, userTriggersFile)
{
  var self = this;

  self.name = "triggers";

  self.EVENT_ITEM_UPDATE = "updateItem";
  self.EVENT_ITEM_CREATE = "createItem";
  self.EVENT_NODE_UPDATE = "updateNode";
  self.EVENT_NODE_CREATE = "createNode";

  murrix.on("databaseConnected", function()
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

          for (var n = 0; n < triggers.length; n++)
          {
            murrix.logger.info(self.name, "Found user trigger called " + triggers[n].name);

            collection.update({ _id: triggers[n]._id }, triggers[n], { upsert: true }, function(error, numberOfUpdatedRows)
            {
              if (error)
              {
                murrix.logger.error(self.name, error);
                return;
              }
            });
          }
        });
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
    if (options.event !== self.EVENT_ITEM_UPDATE)
    {
      next();
      return;
    }

    if (options.dataOld.angle !== options.dataNew.angle ||
        options.dataOld.mirror !== options.dataNew.mirror)
    {
      murrix.logger.info(self.name, "Angle or mirror has changed on item, will clear cache and set a new cache id");

      options.dataNew.cacheId = murrix.utils.timestamp();

      murrix.cache.clear(options.dataNew._id, function(error)
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
    if (options.event !== self.EVENT_ITEM_UPDATE && options.event !== self.EVENT_ITEM_CREATE)
    {
      next();
      return;
    }

    if (options.dataOld.cacheId !== options.dataNew.cacheId)
    {
      murrix.logger.info(self.name, "Cache id has changed on item with id " + options.dataNew._id + ", will queue some common sizes of cached versions");

      /* TODO: Investigate what sizes we actually have */
      var cacheOptions = [ /* TODO: This list should match what the GUI needs, have it in a file somewhere */
        { width: 250, height: 250, square: 1, type: "image" },
        { width: 80, height: 80, square: 1, type: "image" },
        { width: 1400, height: 0, square: 0, type: "image" },
        { type: "video" } /* TODO: This might generate warnings if item is not a video, maybe check? */
      ];

      for (var n = 0; n < cacheOptions.length; n++)
      {
        murrix.cache.queueItem(options.dataNew._id, cacheOptions[n]);
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
          if (murrix.utils.inArray(options.dataOld.family._partner, self.chainItemUpdatePartnerProgessList))
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
          if (murrix.utils.inArray(options.dataNew.family._partner, self.chainItemUpdatePartnerProgessList))
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

    // On remove clear cache

    // On remove of file item, remove file from filesystem

    // On node remove, remove all items where node is only parent otherwise remove from parent list

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

    // On angle, mirror change clear cache and update changetimestamp
    chain.add(function(options, next) { self._chainClearCache(options, next); });

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

exports.Manager = MurrixTriggerManager;
