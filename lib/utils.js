
exports.array = require("./utils/array");
exports.file = require("./utils/file");
exports.sort = require("./utils/sort");
exports.number = require("./utils/number");
exports.position = require("./utils/position");
exports.string = require("./utils/string");
exports.template = require("./utils/template");
exports.time = require("./utils/time");
exports.crypto = require("./utils/crypto");

exports.eventMerge = function(obj, events, doneEvent)
{
  doneEvent = doneEvent || "done";
  var count = 0;

  var eventHandler = function()
  {
    count++;

    if (count === events.length)
    {
      count = 0;
      obj.emit(doneEvent);
    }
  };

  for (var n = 0; n < events.length; n++)
  {
    obj.on(events[n], eventHandler);
  }
};

exports.sortCameraReferenceTimeline = function(timelines)
{
  timelines.sort(function(a, b)
  {
    /* Less than 0: Sort "a" to be a lower index than "b"
      * Zero: "a" and "b" should be considered equal, and no sorting performed.
      * Greater than 0: Sort "b" to be a lower index than "a".
      *
      * type === 'utc' should be at top, type === 'timezone' at the bottom
      * if type is the same preserve order to not mess things up, new we pushed to the end should not become the default unless it is the only one!
      */

    if (a.type === b.type)
    {
      return 0;
    }
    else if (a.type === "utc" && b.type === "timezone")
    {
      return -1;
    }
    else if (a.type === "timezone" && b.type === "utc")
    {
      return 1;
    }

    console.log("Found unknown type combination in sort of reference timelines", a, b);
    return 0;
  });

  return timelines;
};

exports.getWhenTimestamp = function(itemSource, cameraSettings)
{
  var timestamp = false;

  if (itemSource === false)
  {
    return false;
  }

  if (itemSource.type === "gps")
  {
    return exports.time.timestamp(itemSource.datestring + " +00:00");
  }
  else if (itemSource.type === "manual")
  {
    var timezone = exports.time.parseTimezone(itemSource.timezone);
    var datestring = itemSource.datestring;
    var parts = datestring.replace(/-/g, " ").replace(/:/g, " ").split(" ");

    if (parts[0] === "XXXX") // No Year
    {
      return false;
    }
    else if (parts[1] === "XX") // No Month
    {
      datestring = parts[0] + "-01-01 00:00:00 " + timezone;
    }
    else if (parts[2] === "XX") // No Day
    {
      datestring = parts[0] + "-" + parts[1] + "-01 00:00:00 " + timezone;
    }
    else if (parts[3] === "XX") // No Hour
    {
      datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " 00:00:00 " + timezone;
    }
    else if (parts[4] === "XX") // No Minute
    {
      datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":00:00 " + timezone;
    }
    else if (parts[5] === "XX") // No second
    {
      datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":00 " + timezone;
    }
    else // Full date and time
    {
      datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":" + parts[5] + " " + timezone;
    }

    timestamp = exports.time.timestamp(datestring);

    if (itemSource.daylightSavings) // TODO: Verify this in some way
    {
      timestamp -= 3600;
    }

    return timestamp;
  }
  else if (itemSource.type === "camera")
  {
    if (itemSource.reference === "None" || !cameraSettings.referenceTimelines || cameraSettings.referenceTimelines.length === 0)
    {
      timestamp = exports.time.timestamp(itemSource.datestring + " " + exports.time.parseTimezone(itemSource.timezone));

      // If camera automatically changes it time for daylight savings, we need to compensate for it here
      if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
      {
        if (exports.time.isDaylightSavings(itemSource.datestring))
        {
          timestamp -= 3600;
        }
      }

      return timestamp;
    }

    timestamp = exports.time.timestamp(itemSource.datestring + " +00:00");
    var index = false;

    if (itemSource.reference === false) // Use default reference
    {
      index = 0;
    }
    else
    {
      for (var n = 0; n < cameraSettings.referenceTimelines.length; n++)
      {
        if (cameraSettings.referenceTimelines[n]._id === itemSource.reference)
        {
          index = n;
          break;
        }
      }
    }

    if (index === false)
    {
      timestamp = exports.time.timestamp(itemSource.datestring + " " + exports.time.parseTimezone(itemSource.timezone));

      // If camera automatically changes it time for daylight savings, we need to compensate for it here
      if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
      {
        if (exports.time.isDaylightSavings(itemSource.datestring))
        {
          timestamp -= 3600;
        }
      }

      return timestamp;
    }

    if (cameraSettings.referenceTimelines[index].type === "timezone")
    {
      timestamp = exports.time.timestamp(itemSource.datestring + " " + exports.time.parseTimezone(cameraSettings.referenceTimelines[index].name));

      // If camera automatically changes it time for daylight savings, we need to compensate for it here
      if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
      {
        if (exports.time.isDaylightSavings(itemSource.datestring))
        {
          timestamp -= 3600;
        }
      }
    }
    else
    {
      timestamp += cameraSettings.referenceTimelines[index].offset;
    }

    return timestamp;
  }
  else if (itemSource.type === false)
  {
    return false;
  }
  else
  {
//     murrix.logger.error(self.name, "Unknown source type, " + itemSource.type);
//     murrix.logger.error(self.name, itemSource);
  }

  return false;
};





exports.createArchive = function(filename, list, callback)
{
  callback("Not implemented");
//   var path = murrix.config.getPathTemp() + murrix.utils.timestamp();
//
//   self.createDirectory(path, function(error)
//   {
//     if (error)
//     {
//       callback(error);
//       return;
//     }
//
//     var chain = new MurrixChain();
//
//     for (var n = 0; n < list.length; n++)
//     {
//       chain.add(list[n], function(item, options, chainCallback)
//       {
//         var targetFilename = path + "/" + item.name;
//
//         fs.symlink(item.path, targetFilename, function(error)
//         {
//           if (error)
//           {
//             chainCallback("Failed to symlink " + item.path + " to " + targetFilename + ", reason: " + error);
//             return;
//           }
//
//           chainCallback();
//         });
//       });
//     }
//
//     chain.final(function(error)
//     {
//       if (error)
//       {
//         callback(error);
//         return;
//       }
//
//       var args = [ "-r", filename, "." ];
//
//       self.run("zip", args, { cwd: path }, function(error, output)
//       {
//         self.removeDirectory(path);
//
//         if (error)
//         {
//           callback("Could not get create archive, reason: " + error);
//           return;
//         }
//
//         fs.exists(filename, function(exists)
//         {
//           if (!exists)
//           {
//             callback("Could not get create archive file does not exist!");
//             return;
//           }
//
//           callback();
//         });
//       });
//     });
//
//     chain.run();
//   });
};


exports.sortItemFunction = function(a, b)
{
  if ((!b.when || b.when.timestamp === false) && (!a.when || a.when.timestamp === false))
  {
    if (!b.name || !a.name)
    {
      return 0;
    }

    return -exports.sort.natcasecmp(b.name, a.name);
  }
  else if ((b.when && b.when.timestamp !== false) && (!a.when || a.when.timestamp === false))
  {
    return -1;
  }
  else if ((a.when && a.when.timestamp !== false) && (!b.when || b.when.timestamp === false))
  {
    return 1;
  }
  else if ((!b.when || b.when.timestamp === false) || (!a.when || a.when.timestamp === false))
  {
    return 0;
  }

  var offset = 0;

  if (a.when.timestamp < 0 || b.when.timestamp < 0)
  {
    offset = Math.abs(Math.min(a.when.timestamp, b.when.timestamp));
  }

  return (a.when.timestamp + offset) - (b.when.timestamp + offset);
};
