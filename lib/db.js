
var path = require("path");
var mongo = require("mongodb");
var stewardess = require("stewardess");
var moment = require("moment");
var events = require("events");
var util = require("util");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixDatabaseManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "database";
  self.mongoDb = null;
  self.nodes = {};
  self.items = {};

  murrix.utils.eventMerge(self, ["clientRegisterDone", "connectDone"]);

  murrix.client.on("done", function()
  {
    murrix.client.register("saveNode", function(session, args, callback)
    {
      self.nodes.save(session, args, callback);
    });

    murrix.client.register("saveItem", function(session, args, callback)
    {
      self.items.save(session, args, callback);
    });

    murrix.client.register("hideRaw", function(session, args, callback)
    {
      self.items.hideRaw(session, args, callback);
    });

    murrix.client.register("removeItem", function(session, args, callback)
    {
      self.items.remove(session, args, callback);
    });

    murrix.client.register("removeNode", function(session, args, callback)
    {
      self.nodes.remove(session, args, callback);
    });

    murrix.client.register("commentNode", function(session, args, callback)
    {
      self.nodes.comment(session, args.id, args.text, callback);
    });

    murrix.client.register("commentItem", function(session, args, callback)
    {
      self.items.comment(session, args.id, args.text, callback);
    });

    murrix.client.register("findNodesByYear", function(session, args, callback)
    {
      self.nodes.findByYear(session, args, callback);
    });

    murrix.client.register("findRandom", function(session, args, callback)
    {
      self.nodes.findRandom(session, args, callback);
    });

    murrix.client.register("find", function(session, args, callback)
    {
      self.findWithRights(session, args.query || {}, args.options || {}, callback);
    });

    murrix.client.register("findOne", function(session, args, callback)
    {
      self.findOneWithRights(session, args.query || {}, args.options || {}, callback);
    });

    murrix.client.register("count", function(session, args, callback)
    {
      self.countWithRights(session, args.query || {}, args.options || {}, callback);
    });

    murrix.client.register("distincs", function(session, args, callback)
    {
      self.distinct(args.query || {}, args.options || {}, callback); // TODO: Rights
    });

    murrix.client.register("group", function(session, args, callback)
    {
      self.group(args.query || {}, args.options || {}, callback); // TODO: Rights
    });

    self.emit("clientRegisterDone");
  });

  murrix.config.on("done", function()
  {
    var mongoServer = new mongo.Server(murrix.config.databaseHost, murrix.config.databasePort, { auto_reconnect: true });
    self.mongoDb = new mongo.Db(murrix.config.databaseName, mongoServer, { safe: true });

    self.mongoDb.open(function(error, mongoDb)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to connect to mongoDB, reason: " + error);
        exit(1);
        return;
      }

      murrix.logger.info(self.name, "We are connected to mongo DB!");
      self.emit("connectDone");
    });
  });


  self.generateId = function()
  {
    return new mongo.ObjectID().toString();
  };

  self.remove = function(dataId, collectionName, triggerEvent, callback)
  {
    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.findOne({ _id: dataId }, collectionName, function(error, dataOld)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.triggers.triggerPreSave(triggerEvent, dataOld, {}, function(error, dataNew)
        {
          if (error)
          {
            callback(error);
            return;
          }

          collection.remove({ _id: dataId }, function(error, numberOfRemovedRows)
          {
            if (error)
            {
              callback(error);
              return;
            }

            murrix.triggers.triggerPostSave(triggerEvent, dataOld, {}, function(error)
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
      });
    });
  };

  self.save = function(data, collectionName, triggerEvent, callback)
  {
    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (data._id)
      {
        self.findOne({ _id: data._id }, collectionName, function(error, dataOld)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.triggers.triggerPreSave(triggerEvent, dataOld, data, function(error, dataNew)
          {
            if (error)
            {
              callback(error);
              return;
            }

            collection.update({ _id: data._id }, dataNew, { }, function(error, numberOfUpdatedRows)
            {
              if (error)
              {
                callback(error);
                return;
              }

              murrix.triggers.triggerPostSave(triggerEvent, dataOld, dataNew, function(error)
              {
                if (error)
                {
                  callback(error);
                  return;
                }

                callback(null, data);
              });
            });
          });
        });
      }
      else
      {
        if (data._newId)
        {
            data._id = data._newId;
            delete data._newId;
        }
        else
        {
          data._id = self.generateId();
        }

        murrix.triggers.triggerPreSave(triggerEvent, {}, data, function(error, dataNew)
        {
          if (error)
          {
            callback(error);
            return;
          }

          collection.insert(dataNew, function(error, dataInserted)
          {
            if (error)
            {
              callback(error);
              return;
            }

            murrix.triggers.triggerPostSave(triggerEvent, {}, dataNew, function(error)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null, dataInserted[0]);
            });
          });
        });
      }
    });
  };

  self.findOne = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
     {
        callback(error);
        return;
      }

      collection.findOne(query, function(error, result)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, result);
      });
    });
  };

  self.find = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;
    var limit = options.limit || 0;
    var skip = options.skip || 0;
    var sort = options.sort || [ "name" ];
    var sortDirection = options.sortDirection || 1;
    var fields = options.fields || false;

    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var resultFunction = function(error, cursor)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var results = [];

        cursor.sort(sort, sortDirection).skip(skip).limit(limit).each(function(error, data)
        {
          if (error)
          {
            callback(error.name);
            return;
          }

          if (data)
          {
            results.push(data);
          }
          else
          {
            callback(null, results);
          }
        });
      };

      if (fields)
      {
        collection.find(query, fields, resultFunction);
      }
      else
      {
        collection.find(query, resultFunction);
      }
    });
  };

  self.findWithRights = function(session, query, options, callback)
  {
    var collectionName = (typeof options === "string" ? options : options.collection);

    if (collectionName === "nodes")
    {
      self.nodes.addAccessCheckToQuery(session, query, false, function(error, query)
      {
        self.find(query, options, callback);
      });

      return;
    }
    else if (collectionName === "items")
    {
      self.find(query, options, callback); // TODO: This is not good enough right wise

      return;
    }
    else if (collectionName === "triggers")
    {
      murrix.user.getUser(session, function(error, user)
      {
        if (error)
        {
          callback("Could not get user");
          return;
        }

        if (!user || user.admin !== true)
        {
          callback("Not allowed to access triggers!");
          return;
        }

        self.find(query, options, callback);
      });

      return;
    }

    callback("No access to collection " + collectionName);
  };

  self.findOneWithRights = function(session, query, options, callback)
  {
    self.findWithRights(session, query, options, function(error, dataList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (dataList.length === 0)
      {
        callback("Could not find any node");
        return;
      }

      callback(null, dataList[0]);
    });
  };

  self.count = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      collection.find(query, function(error, cursor)
      {
        if (error)
        {
          callback(error);
          return;
        }

        cursor.count(function(error, count)
        {
          if (error)
          {
            callback(error);
            return;
          }

          callback(null, count);
        });
      });
    });
  };

  self.countWithRights = function(session, query, options, callback)
  {
    var collectionName = (typeof options === "string" ? options : options.collection);

    if (collectionName === "nodes")
    {
      self.nodes.addAccessCheckToQuery(session, query, false, function(error, query)
      {
        self.count(query, options, callback);
      });

      return;
    }
    else if (collectionName === "items")
    {
      self.count(query, options, callback); // TODO: This is not good enough right wise

      return;
    }
    else if (collectionName === "triggers")
    {
      murrix.user.getUser(session, function(error, user)
      {
        if (error)
        {
          callback("Could not get user");
          return;
        }

        if (!user || user.admin !== true)
        {
          callback("Not allowed to access triggers!");
          return;
        }

        self.count(query, options, callback);
      });

      return;
    }

    callback("No access to collection " + collectionName);
  };

  self.distinct = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      collection.distinct(query, function(error, result)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, result);
      });
    });
  };

  self.group = function(query, options, callback)
  {
    var collectionName = typeof options === "string" ? options : options.collection;

    if (!options.reduceFunction)
    {
      callback("Can not call group without a reduce function");
      return;
    }

    self.mongoDb.collection(collectionName, function(error, collection)
    {
      if (error)
      {
        callback(error);
        return;
      }

      collection.group([], query, {}, options.reduceFunction, function(error, results)
      {
        if (error)
        {
          callback(error);
          return;
        }

        callback(null, results);
      });
    });
  };


  self.nodes.addAccessCheckToQuery = function(session, query, adminRequired, callback)
  {
    murrix.user.getUser(session, function(error, user)
    {
      if (error)
      {
        callback("Could not get user");
        return;
      }

      if (user)
      {
        if (!user.admin)
        {
          var newQuery = {};

          newQuery.$or = [];

          newQuery.$or.push({ "added._by": user._id });
          newQuery.$or.push({ _id: user._id });

          if (adminRequired)
          {
            if (user._groups && user._groups.length > 0)
            {
              newQuery.$or.push({ _admins: { $in: user._groups } });
            }
          }
          else
          {
            newQuery.$or.push({ "public": true });

            if (user._groups && user._groups.length > 0)
            {
              newQuery.$or.push({ _readers: { $in: user._groups } });
              newQuery.$or.push({ _admins: { $in: user._groups } });
            }
          }

          newQuery.removed = false;

          query = { $and: [ query, newQuery ] };
        }
      }
      else
      {
        if (adminRequired)
        {
          callback("Admin access is not granted to anything is there is no user signed in!");
          return;
        }
        else
        {
          query["public"] = true;
        }

        query.removed = false;
      }

      callback(null, query);
    });
  };

  self.nodes.findRandom = function(session, options, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var collectionName = typeof options === "string" ? options : options.collection;

      self.nodes.addAccessCheckToQuery(session, { }, false, function(error, query)
      {
        self.count(query, collectionName, function(error, count)
        {
          if (error)
          {
            callback(error, null);
            return;
          }

          var index = Math.floor(Math.random() * count);

          options = {};
          options.limit = 1;
          options.skip = index;
          options.collection = collectionName;

          self.find(query, options, function(error, results)
          {
            if (error)
            {
              callback(error, null);
              return;
            }

            if (results.length === 0)
            {
              callback("Random find returned no results!");
              return;
            }

            callback(null, results[0]);
          });
        });
      });
    });
  };

  self.nodes.remove = function(session, nodeId, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!userNode)
      {
        callback("Anonymous user can not remove a node!");
        return;
      }

      self.nodes.addAccessCheckToQuery(session, { _id: nodeId }, true, function(error, query)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.count(query, "nodes", function(error, count)
        {
          if (error)
          {
            callback(error);
            return;
          }

          if (count === 0)
          {
            callback("No admin access to this node, can not remove!");
            return;
          }

          murrix.logger.info(self.name, "Will remove node with id " + nodeId);

          self.remove(nodeId, "nodes", murrix.triggers.EVENT_NODE_REMOVE, callback);
        });
      });
    });
  };

  self.nodes.save = function(session, nodeData, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!userNode)
      {
        callback("Anonymous user can not save a node!");
        return;
      }

      if (!nodeData.name || nodeData.name === "")
      {
        callback("Can not save node without a name!");
        return;
      }

      if (!nodeData.type || nodeData.type === "")
      {
        callback("Type of node is undefined or not allowed!");
        return;
      }


      /* Verify attributes for all types */
      nodeData.added = nodeData.added || { timestamp: murrix.utils.timestamp(), _by: userNode._id };
      nodeData.modified = { timestamp: murrix.utils.timestamp(), _by: userNode._id };
      nodeData.description = nodeData.description || "";
      nodeData.comments = nodeData.comments || [];
      nodeData._admins = nodeData._admins || [];
      nodeData._readers = nodeData._readers || [];
      nodeData["public"] = nodeData["public"] || false;
      nodeData.tags = nodeData.tags || [];
      nodeData.removed = nodeData.removed || false;
      nodeData._profilePicture = nodeData._profilePicture || false;


      if (nodeData._id)
      {
        self.nodes.addAccessCheckToQuery(session, { _id: nodeData._id }, true, function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          self.count(query, "nodes", function(error, count)
          {
            if (error)
            {
              callback(error);
              return;
            }

            if (count === 0)
            {
              callback("No admin access to this node, can not save!");
              return;
            }

            self.save(nodeData, "nodes", murrix.triggers.EVENT_NODE_UPDATE, callback);
          });
        });
      }
      else
      {
        self.save(nodeData, "nodes", murrix.triggers.EVENT_NODE_CREATE, callback);
      }
    });
  };

  self.nodes.comment = function(session, nodeId, text, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.nodes.addAccessCheckToQuery(session, { _id: nodeId }, false, function(error, query)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.findOne(query, "nodes", function(error, nodeData)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var comment = {};

          comment.added = { timestamp: murrix.utils.timestamp(), _by: userNode._id };
          comment.text = text;

          nodeData.comments.push(comment);

          self.save(nodeData, "nodes", murrix.triggers.EVENT_NODE_UPDATE, callback);
        });
      });
    });
  };

  self.nodes.findByYear = function(session, year, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.nodes.addAccessCheckToQuery(session, { }, false, function(error, query)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var startTime = moment([ year ]);
        var endTime = startTime.clone().add("years", 1);

        query.$and = query.$and || [];
        query.$and.push({ "when.timestamp": { $exists: true } });
        query.$and.push({ "when.timestamp": { $ne: false } });
        query.$and.push({ "when.timestamp": { $gt: startTime.unix() } });
        query.$and.push({ "when.timestamp": { $lt: endTime.unix() } });

        self.find(query, "items", function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var parentIdList = [];

          for (var key in itemDataList)
          {
            for (var n = 0; n < itemDataList[key]._parents.length; n++)
            {
              if (!murrix.utils.inArray(itemDataList[key]._parents[n], parentIdList))
              {
                parentIdList.push(itemDataList[key]._parents[n]);
              }
            }
          }

          self.findWithRights(session, { _id: { $in: parentIdList } }, "nodes", callback);
        });
      });
    });
  };


  self.items.remove = function(session, itemId, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!userNode)
      {
        callback("Anonymous user can not remove an item!");
        return;
      }

      self.findOne({ _id: itemId }, "items", function(error, itemData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        /* If this is an item the user must have admin rights on the parent */
        self.nodes.addAccessCheckToQuery(session, { _id: { $in: itemData._parents } }, true, function(error, query)
        {
          if (error)
          {
            callback("Could not add access checks to query!", null);
            return;
          }

          if (query === false)
          {
            callback("No rights on parents, can not remove item!", null);
            return;
          }

          self.count(query, "nodes", function(error, count)
          {
            if (error)
            {
              callback(error);
              return;
            }

            if (count !== itemData._parents.length)
            {
              callback("No admin access to one or more of the parent nodes, can not remove!");
              return;
            }

            murrix.logger.info(self.name, "Will remove the item called " + itemData.name + " with id " + itemData._id);

            self.remove(itemData._id, "items", murrix.triggers.EVENT_ITEM_REMOVE, callback);
          });
        });
      });
    });
  };

  self.items.save = function(session, itemData, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!userNode)
      {
        callback("Anonymous user can not save an item!");
        return;
      }

      if (!itemData._parents || itemData._parents.length === 0)
      {
        callback("Can not save item without parents!");
        return;
      }

      if (!itemData.what || itemData.what === "")
      {
        callback("What of item is undefined or not allowed!");
        return;
      }


      /* Verify attributes for all types */
      itemData.added = itemData.added || { timestamp: murrix.utils.timestamp(), _by: userNode._id };
      itemData.modified = { timestamp: murrix.utils.timestamp(), _by: userNode._id };
      itemData._who = itemData._who || false;
      itemData._with = itemData._with || false;
      itemData.when = itemData.when || { timestamp: false, source: false };
      itemData.where = itemData.where || {};
      itemData.showing = itemData.showing || [];
      itemData.comments = itemData.comments || [];
      itemData.removed = itemData.removed || false;


      /* If this is an item the user must have admin rights on the parent */
      self.findOne({ _id: itemData._id }, "items", function(error, itemDataDb)
      {
        if (error)
        {
          callback(error);
          return;
        }

        // If we got an object here it is a save call not a create call and save should check rights on the existing parents
        // TODO: Evaulate if this is actually 100%, maybe merge paret lists?
        var parents = itemData._parents;

        if (itemDataDb)
        {
          parents = itemDataDb._parents;
        }

        self.nodes.addAccessCheckToQuery(session, { _id: { $in: parents } }, true, function(error, query)
        {
          if (error)
          {
            callback("Could not add access checks to query!", null);
            return;
          }

          if (query === false)
          {
            callback("No rights on parents, can not change/create item!", null);
            return;
          }

          self.count(query, "nodes", function(error, count)
          {
            if (error)
            {
              callback(error);
              return;
            }

            if (count !== itemData._parents.length)
            {
              callback("No admin access to one or more of the parent nodes, can not save!");
              return;
            }

            if (itemData._id)
            {
              self.save(itemData, "items", murrix.triggers.EVENT_ITEM_UPDATE, callback);
            }
            else
            {
              self.save(itemData, "items", murrix.triggers.EVENT_ITEM_CREATE, callback);
            }
          });
        });
      });
    });
  };

  self.items.comment = function(session, itemId, text, callback)
  {
    murrix.user.getUser(session, function(error, userNode)
    {
      if (error)
      {
        callback(error);
        return;
      }

      self.findOne({ _id: itemId }, "items", function(error, itemData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.nodes.addAccessCheckToQuery(session, { _id: { $in: itemData._parents } }, false, function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          self.count(query, "nodes", function(error, count)
          {
            if (error)
            {
              callback(error);
              return;
            }

            if (count === 0)
            {
              callback("No read access to any of the parent nodes, can not save comment!");
              return;
            }

            var comment = {};

            comment.added = { timestamp: murrix.utils.timestamp(), _by: userNode._id };
            comment.text = text;

            itemData.comments.push(comment);

            self.save(itemData, "items", murrix.triggers.EVENT_ITEM_UPDATE, callback);
          });
        });
      });
    });
  };

  self.items.hideRaw = function(session, itemDataRaw, callback)
  {
    var name = path.basename(itemDataRaw.name, path.extname(itemDataRaw.name));
    var query = {};

    query.$and = [ { name: { $regex: "^" + name + "[.]", $options: "-i" } }, { name: { $ne: itemDataRaw.name } } ];
    query._parents = itemDataRaw._parents;

    self.findOne(query, "items", function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!itemData)
      {
        murrix.logger.debug(self.name, "Found nowhere to hide " + itemDataRaw.name + ", id " + itemDataRaw._id);
        callback(null, false, null);
        return;
      }

      itemData.versions = itemData.versions || [];
      itemData.versions.push({ id: itemDataRaw._id, name: itemDataRaw.name, size: itemDataRaw.exif.FileSize });

      murrix.logger.info(self.name, "Adding raw version to " + itemData.name + ", id " + itemData._id);
      murrix.logger.debug(self.name, JSON.stringify(itemData.versions));

      self.items.save(session, itemData, function(error, itemDataNew)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.mongoDb.collection("items", function(error, collection)
        {
          if (error)
          {
            callback(error);
            return;
          }

          collection.remove({ _id: itemDataRaw._id }, function(error, removed)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, true, itemDataNew);
          });
        });
      });
    });
  };

  self.storeTrackPosition = function(session, position, parentId, deviceId, callback)
  {
    var chain = new MurrixChain();
    var itemData = {};

    itemData._parents = [ parentId ];
    itemData.what = "position";
    itemData.track = true;
    itemData.when = { timestamp: false, source: false };
    itemData._with = deviceId;

    itemData.when.source = {};
    itemData.when.source.type = position.source;
    itemData.when.source.datestring = position.datestring;

    itemData.where = {};
    itemData.where.longitude = position.longitude;
    itemData.where.latitude = position.latitude;
    itemData.where.source = position.source;
    itemData.where.altitude = position.altitude;
    itemData.where.bearing = position.bearing;
    itemData.where.speed = position.speed;

    murrix.logger.debug(self.name, "Saving item!");

    murrix.db.items.save(session, itemData, function(error, itemDataNew)
    {
      if (error)
      {
        callback(error);
        return;
      }

      murrix.logger.debug(self.name, "Saving item saved with id " + itemDataNew._id);

      callback(null, itemDataNew);
    });
  };

  self.items.importFile = function(session, name, uploadId, parentId, callback)
  {
    murrix.upload.find(session, uploadId, function(error, file)
    {
      if (error)
      {
        callback("Could not find uploaded file with id " + uploadId + ", reason: " + error);
        return;
      }

      var parts = [];
      var itemData = {};
      var source = {};

      itemData._parents = [ parentId ];
      itemData.what = "file";

      itemData.name = name;
      itemData.exif = file.exif;
      itemData.checksum = file.checksum;
      itemData.angle = 0;
      itemData.mirror = false;
      itemData.description = "";
      itemData._with = false;
      itemData.cacheId = 0;

      if (file.exif.GPSDateTime)
      {
        source.type = "gps";
        source.datestring = murrix.utils.cleanDatestring(file.exif.GPSDateTime);

        itemData.when = { timestamp: false, source: source };
      }
      else if (file.exif.DateTimeOriginal)
      {
        source.type = "camera";
        source.datestring = murrix.utils.cleanDatestring(file.exif.DateTimeOriginal);
        source.reference = false;
        source.timezone = false;

        itemData.when = { timestamp: false, source: source };
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

      if (file.exif.GPSDateTime)
      {
        itemData.where = {};

        itemData.where.longitude = file.exif.GPSLongitude;
        itemData.where.latitude = file.exif.GPSLatitude;
        itemData.where.source = "gps";
      }

      var chain = stewardess();

      if (file.exif.SerialNumber)
      {
        chain.add(function(options, next)
        {
          self.findOne({ type: "camera", serial: file.exif.SerialNumber }, "nodes", function(error, nodeData)
          {
            if (error)
            {
              options.error = "Failed to get camera, reason: " + error;
              murrix.logger.error(self.name, options.error);
              next("break");
              return;
            }

            if (nodeData)
            {
              itemData._with = nodeData._id;
            }

            next();
          });
        });
      }

      chain.final(function(options)
      {
        if (options.error)
        {
          callback(error);
          return;
        }

        self.items.save(session, itemData, function(error, itemData)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.upload.moveFile(session, file.id, itemData._id, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, itemData);
          });
        });
      });

      chain.run({});
    });
  };
}

util.inherits(MurrixDatabaseManager, events.EventEmitter);

exports.Manager = MurrixDatabaseManager;
