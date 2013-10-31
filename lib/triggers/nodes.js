
var Logger = require("../logger");
var cache = new require("../cache");
var Chain = require("achain.js");
var utils = require("../utils");
var db = require("../db");

var logger = new Logger("triggers");
var before_chain = new Chain();
var after_chain = new Chain();

///////////////////////////////////////////////////////////////////
// Before chain
///////////////////////////////////////////////////////////////////

// TODO: On node remove, remove from _profilePictures, showing, _partners, family.parents etc


// Setting _partner on person node should set _partner on the partner node also
var update_partner_recurse_list = [];

before_chain.add(function(args, options, callback)
{
  var chain = new Chain();

  if (options.event === "create" || options.event === "update")
  {
    var old_partner = options.current_doc.family ? options.current_doc.family._partner : false;
    var new_partner = options.new_doc.family ? options.new_doc.family._partner : false;

    if (old_partner != new_partner)
    {
      if (old_partner)
      {
        chain.add(function(args, options, callback)
        {
          if (murrix.utils.array.in(options.current_doc._id, update_partner_recurse_list))
          {
            logger.debug("For old person with id " + options.current_doc._id + ", the partner with id " + options.current_doc.family._partner + ", seem to already be in a trigger, will do nothing and avoid infinate recursion!");
            callback();
            return;
          }

          logger.debug("old person with id " + options.new_doc._id + ", the partner with id " + options.new_doc.family._partner + ", we will reset the partner.");

          db.findOne({ _id: options.current_doc.family._partner }, "nodes", function(error, node_data)
          {
            if (error)
            {
              callback("Failed to get old partner node, reason: " + error);
              return;
            }

            if (!node_data)
            {
              logger.debug("Old partner with id " + options.current_doc.family._partner + " was not found, probably invalid id, will not reset!");
              callback();
              return;
            }

            if (node_data.family._partner !== options.new_doc._id)
            {
              logger.debug("Old partner with id " + options.current_doc.family._partner + " did not have the current node as partner, will not reset!");
              callback();
              return;
            }

            node_data.family._partner = false;

            update_partner_recurse_list.push(options.current_doc.family._partner);

            db.save(node_data, "nodes", function(error)
            {
              update_partner_recurse_list = utils.array.remove(options.current_doc.family._partner, update_partner_recurse_list);
              callback(error);
            });
          });
        });
      }

      if (new_partner)
      {
        chain.add(function(args, options, callback)
        {
          if (murrix.utils.array.in(options.new_doc._id, update_partner_recurse_list))
          {
            logger.debug("For new person with id " + options.new_doc._id + ", the partner with id " + options.new_doc.family._partner + ", seem to already be in a trigger, will do nothing and avoid infinate recursion!");
            callback();
            return;
          }

          logger.debug("New person with id " + options.new_doc._id + ", the partner with id " + options.new_doc.family._partner + ", we will set the partner to this person.");

          db.findOne({ _id: options.new_doc.family._partner }, "nodes", function(error, node_data)
          {
            if (error)
            {
              callback("Failed to get new partner node, reason: " + error);
              return;
            }

            if (!node_data)
            {
              callback("New partner with id " + options.new_doc.family._partner + " was not found, probably invalid id!");
              return;
            }

            node_data.family._partner = options.new_doc._id;

            update_partner_recurse_list.push(options.new_doc.family._partner);

            db.save(node_data, "nodes", self.EVENT_NODE_UPDATE, function(error)
            {
              update_partner_recurse_list = utils.array.remove(options.current_doc.family._partner, update_partner_recurse_list);
              callback(error);
            });
          });
        });
      }
    }
  }

  chain.run(callback);
});

// Update timestamp on items if camera changes
before_chain.add(function(args, options, callback)
{
  if (options.event === "remove")
  {
    if (options.current_doc.mode !== options.new_doc.mode || JSON.stringify(options.current_doc.referenceTimelines) !== JSON.stringify(options.new_doc.referenceTimelines))
    {
      var cameraSettings = {};
      cameraSettings.referenceTimelines = murrix.utils.sortCameraReferenceTimeline(options.new_doc.referenceTimelines || []);
      cameraSettings.mode = options.new_doc.mode;

      db.find({ _with: options.new_doc._id }, "items", function(error, item_data_list)
      {
        if (error)
        {
          callback("Failed to get items, reason: " + error);
          return;
        }

        logger.info("Mode or reference timelines has changed on camera node (" + options.new_doc._id + "), will regenerate timestamps for " + item_data_list.length + " subitem(s)...");

        var chain = new Chain();

        chain.addMany(item_data_list, function(item_data, options, callback)
        {
          item_data.when = item_data.when || {};
          item_data.when.source = item_data.when.source || false;
          item_data.when.timestamp = murrix.utils.getWhenTimestamp(item_data.when.source, cameraSettings);

          db.save(item_data, "items", callback);
        });

        chain.run(options, callback);
      });

      return;
    }
  }

  callback();
});

// On node remove, remove all items where node is only parent otherwise remove from parent list
before_chain.add(function(args, options, callback)
{
  if (options.event === "remove")
  {
    db.find({ _parents: options.current_doc._id }, "items", function(error, item_data_list)
    {
      if (error)
      {
        callback("Failed to get items, reason: " + error);
        return;
      }

      logger.info("Node (" + options.current_doc._id + ") removed, will delete " + item_data_list.length + " subitem(s)...");

      var chain = new Chain();

      chain.addMany(item_data_list, function(item_data, options, callback)
      {
        item_data._parents = utils.array.remove(options.current_doc._id, item_data._parents);

        if (item_data._parents.length === 0)
        {
          logger.debug("Item (" + item_data._id + ") has no more parents, will remove it...");
          db.remove(item_data._id, "items", callback);
        }
        else
        {
          logger.debug("Item (" + item_data._id + ") has other parents, will update parent list...");
          db.save(item_data, "items", callback);
        }
      });

      chain.run(options, callback);
    });

    return;
  }

  callback();
});


module.exports = function()
{
  var self = this;

  self.before = function(options, callback)
  {
    if (options.collection_name !== "nodes")
    {
      callback();
      return;
    }

    before_chain.run(options, callback);
  };

  self.after = function(options, callback)
  {
    if (options.collection_name !== "nodes")
    {
      callback();
      return;
    }

    after_chain.run(options, callback);
  };
};
