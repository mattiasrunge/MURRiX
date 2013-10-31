
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

// TODO: Setting location should trigger a update of presentation timezone

// Update timestamp if when.source on item changes
// Update timestamp if _with on item changes
before_chain.add(function(args, options, callback)
{
  if (options.event === "create" || options.event === "update")
  {
    if (options.current_doc._with !== options.new_doc._with || JSON.stringify(options.current_doc.when) !== JSON.stringify(options.new_doc.when))
    {
      logger.info("Item (" + options.current_doc._id + "), has changed its when structure or with link, will regenerate timestamp...");

      db.findOne({ _id: options.new_doc._with }, "nodes", function(error, node_data)
      {
        if (error)
        {
          callback("Failed to get camera node, reason: " + error);
          return;
        }

        options.new_doc.when = options.new_doc.when || {};
        options.new_doc.when.source = options.new_doc.when.source || false;
        options.new_doc.when.timestamp = options.new_doc.when.timestamp || false;

        var cameraSettings = {};
        cameraSettings.referenceTimelines = [];
        cameraSettings.mode = false;

        if (node_data)
        {
          cameraSettings.referenceTimelines = murrix.utils.sortCameraReferenceTimeline(node_data.referenceTimelines || []);
          cameraSettings.mode = node_data.mode;
        }

        options.new_doc.when.timestamp = utils.getWhenTimestamp(options.new_doc.when.source, cameraSettings);

        callback();
      });

      return;
    }
  }

  callback();
});

// Rotate showing if angle or mirror changes
before_chain.add(function(args, options, callback)
{
  if (options.event === "update")
  {
    if ((options.current_doc.angle !== options.new_doc.angle || options.current_doc.mirror !== options.new_doc.mirror) && options.new_doc.showing)
    {
      logger.debug("Item (" + options.current_doc._id + ") has a changed angle or mirror flag, will adjust showing boxes...");

      var angleOffset = (options.current_doc.angle || 0) - (options.new_doc.angle || 0);

      for (var n = 0; n < options.new_doc.showing.length; n++)
      {
        var x = options.new_doc.showing[n].x;
        var y = options.new_doc.showing[n].y;
        var width = options.new_doc.showing[n].width;
        var height = options.new_doc.showing[n].height;

        if (angleOffset === 90 || angleOffset === -270)
        {
          options.new_doc.showing[n].x = 1 - y;
          options.new_doc.showing[n].y = x;
          options.new_doc.showing[n].width = height;
          options.new_doc.showing[n].height = width;
        }
        else if (angleOffset === -90 || angleOffset === 270)
        {
          options.new_doc.showing[n].x = y;
          options.new_doc.showing[n].y = 1 - x;
          options.new_doc.showing[n].width = height;
          options.new_doc.showing[n].height = width;
        }
        else if (Math.abs(angleOffset) === 180)
        {
          options.new_doc.showing[n].x = 1 - x;
          options.new_doc.showing[n].y = 1 - y;
        }

        if (options.current_doc.mirror !== options.new_doc.mirror)
        {
          options.new_doc.showing[n].x = 1 - options.new_doc.showing[n].x;
        }
      }
    }
  }

  callback();
});

// On angle, mirror change clear cache and update changetimestamp or clear cache when item removed
before_chain.add(function(args, options, callback)
{
  if (options.event === "remove")
  {
    logger.info("Item (" + options.current_doc._id + ") removed, will clear cached files...");

    cache.clear(options.current_doc._id, [], callback);

    return;
  }
  else if (options.event === "update")
  {
    if (options.current_doc.angle !== options.new_doc.angle || options.current_doc.mirror !== options.new_doc.mirror)
    {
      logger.info("Angle and/or mirror has changed on item (" + options.current_doc._id + "), will clear cache and set a new cache id...");

      options.new_doc.cacheId = murrix.utils.time.timestamp();
      cache.clear(options.current_doc._id, [], callback);

      return;
    }
    else if (options.current_doc.thumbPosition !== options.new_doc.thumbPosition)
    {
      logger.info("Thumb position has changed on item (" + options.current_doc._id + "), will not clear video cache only image cache...");

      options.new_doc.cacheId = murrix.utils.time.timestamp();
      cache.clear(options.current_doc._id, ["video"], callback);

      return;
    }
  }

  callback();
});


///////////////////////////////////////////////////////////////////
// After chain
///////////////////////////////////////////////////////////////////

// On event trigger to delete file, remove file from disk
after_chain.add(function(args, options, callback)
{
  if (options.event === "remove")
  {
    if (options.current_doc.what === "file")
    {
      logger.info("Item (" + options.current_doc._id + ") removed, will delete files...");

      logger.debug("Will remove " + config.getPathFiles() + options.current_doc._id + "...");
      utils.file.remove(config.getPathFiles() + options.current_doc._id);

      if (options.current_doc.versions)
      {
        for (var n = 0; n < options.current_doc.versions.length; n++)
        {
          logger.debug("Will remove " + config.getPathFiles() + options.current_doc.versions[n].id + "...");
          utils.file.remove(config.getPathFiles() + options.current_doc.versions[n].id);
        }
      }
    }
  }

  callback();
});

// On event trigger queing of cache
after_chain.add(function(args, options, callback)
{
  if (options.event === "create" || options.event === "update")
  {
    if (options.current_doc.cacheId !== options.new_doc.cacheId && options.new_doc.what === "file" && !utils.file.isRawimage(options.new_doc.exif.MIMEType))
    {
      logger.info("Cache id has changed on item (" + options.current_doc._id + "), will queue the creation of some cached common sizes...");

      if (utils.file.isImage(options.new_doc.exif.MIMEType))
      {
        // TODO: This list should match what the GUI needs, have it in a file somewhere.
        cache.queueItem(options.new_doc._id, { type: "image", width: 250,  height: 250, square: 1 });
        cache.queueItem(options.new_doc._id, { type: "image", width: 80,   height: 80,  square: 1 });
        cache.queueItem(options.new_doc._id, { type: "image", width: 1400, height: 0,   square: 0 });
      }
      else if (utils.file.isVideo(options.new_doc.exif.MIMEType) || utils.file.isAudio(options.new_doc.exif.MIMEType))
      {
        cache.queueItem(options.new_doc._id, { type: "video" });
      }
    }
  }

  callback();
});


module.exports = function()
{
  var self = this;

  self.before = function(options, callback)
  {
    if (options.collection_name !== "items")
    {
      callback();
      return;
    }

    before_chain.run(options, callback);
  };

  self.after = function(options, callback)
  {
    if (options.collection_name !== "items")
    {
      callback();
      return;
    }

    after_chain.run(options, callback);
  };
};
