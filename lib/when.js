
var MurrixUtils = require('./utils.js');

when = function()
{
  var self = this;

  self.GetTimestamp = function(when)
  {

  };

  self.GetFormated = function(when, currentTimezone)
  {

  };





  self.timestamp = function(value)
  {
    if (value)
    {
      return Math.floor(new Date(value).getTime() / 1000);
    }

    return Math.floor(new Date().getTime() / 1000);
  };

  self.parseTimezone = function(string)
  {
    if (string === false || string === "Unknown")
    {
      return "+00:00";
    }

    var timezone = string.match(/\(GMT(.*)\)/)[1];

    if (timezone === "")
    {
      return "+00:00";
    }

    return timezone;
  };

  self.updateWhen = function(session, when, references, mode, callback)
  {
    console.log(when);

    if (when.source.type === "gps")
    {
      when.timestamp = self.timestamp(when.source.datestring + " +00:00");

      callback(null, when);
    }
    else if (when.source.type === "manual")
    {
      var timezone = self.parseTimezone(when.source.timezone);
      var datestring = when.source.datestring;
      var parts = datestring.replace(/-/g, " ").replace(/:/g, " ").split(" ");

      when.timestamp = false;
console.log(parts);
      if (parts[0] === "XXXX") // No Year
      {
        callback(null, when);
        return;
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
console.log(datestring);
      when.timestamp = self.timestamp(datestring);
console.log(when.timestamp);
      if (when.source.daylightSavings) // TODO: Verify this in some way
      {
        when.timestamp -= 3600;
      }
console.log(when.timestamp);
      callback(null, when);
    }
    else if (when.source.type === "camera")
    {
      if (when.source.reference === "None" || !references || references.length === 0)
      {
        when.timestamp = self.timestamp(when.source.datestring + " " + self.parseTimezone(when.source.timezone));

        // If camera automatically changes it time for daylight savings, we need to compensate for it here
        if (mode === "autoDaylightSavings" || mode === "autoDatetime")
        {
          if (MurrixUtils.isDaylightSavings(when.source.datestring))
          {
            when.timestamp -= 3600;
          }
        }

        callback(null, when);
      }
      else
      {
        when.timestamp = self.timestamp(when.source.datestring + " +00:00");
        var index = false;

        if (when.source.reference === false) // Use default reference
        {
          index = 0;
        }
        else
        {
          for (var n = 0; n < references.length; n++)
          {
            if (references[n]._id === when.source.reference)
            {
              index = n;
              break;
            }
          }
        }

        if (index === false)
        {
          callback("Could not find the specified reference");
          return;
        }
console.log(when.timestamp);
        when.timestamp += references[index].offset;
console.log(when.timestamp);
        if (references[index].type === "timezone")
        {
          if (MurrixUtils.isDaylightSavings(when.source.datestring))
          {
            when.timestamp -= 3600;
            console.log(when.timestamp);
          }
        }

console.log(when.timestamp);
        callback(null, when);
      }
    }
    else
    {
      callback("Unknown source type, " + when.source.type);
    }
  };

  self._updateWhens = function(session, nodeManager, index, list, references, callback)
  {
    if (index === list.length)
    {
      callback(null);
      return;
    }

    // Update all when structures for thise items and save if changed
    self.updateWhen(session, list[index].when, references, function(error, when)
    {
      if (error)
      {
        console.log("Update of when failed to update, this might leave the database in an inconsitent state!");
        callback(error);
        return;
      }

      if (when.timestamp != list[index].when.timestamp)
      {
        nodeManager._saveItem(itemData, function(error, newItemData)
        {
          if (error)
          {
            console.log("Update of when failed to save, this might leave the database in an inconsitent state!");
            callback(error);
            return;
          }

          console.log("Updated when on item " + newItemData._id);

          self._updateWhens(session, nodeManager, index + 1, list, references, callback);
        });
      }
      else
      {
        console.log("Did not updated when on item " + list[index]._id);

        self._updateWhens(session, nodeManager, index + 1, list, references, callback);
      }
    });
  };

  self.createReferenceTimeline = function(session, nodeManager, id, reference, callback)
  {
    // Find camera
    nodeManager._findOne(session, { _id: id }, "nodes", function(error, nodeData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!nodeData)
      {
        callback("Could not find a camera with id " + id);
        return;
      }

      // Add reference to list
      nodeData.referenceTimelines = nodeData.referenceTimelines || [];

      nodeData.referenceTimelines.push(reference);

      // Sort reference list
      nodeData.referenceTimelines.sort(function(a, b)
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

      // Save camera
      nodeManager._saveNode(nodeData, function(error, newNodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        // Find all items with camera as _with
        nodeManager._find(session, { _with: id }, "items", function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var list = [];

          for (var n in itemDataList)
          {
            list.push(itemDataList[n]);
          }

          self._updateWhens(session, nodeManager, 0, list, nodeData.referenceTimelines, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, newNodeData);
          });
        });
      });
    });
  };

  self.removeReferenceTimeline = function(session, nodeManager, id, referenceId, callback)
  {
    // Find camera
    nodeManager._findOne(session, { _id: id }, "nodes", function(error, nodeData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!nodeData)
      {
        callback("Could not find a camera with id " + id);
        return;
      }

      // Add reference to list
      nodeData.referenceTimelines = nodeData.referenceTimelines || [];

      // Sort reference list
      nodeData.referenceTimelines = nodeData.referenceTimelines.filter(function(element)
      {
        console.log(element, referenceId);
        return element._id !== referenceId;
      });

      // Save camera
      nodeManager._saveNode(nodeData, function(error, newNodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        // Find all items with camera as _with
        nodeManager._find(session, { _with: id }, "items", function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var list = [];

          for (var n in itemDataList)
          {
            list.push(itemDataList[n]);
          }

          self._updateWhens(session, nodeManager, 0, list, nodeData.referenceTimelines, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, newNodeData);
          });
        });
      });
    });
  };
/*
  {
    timestamp: false, // Best effort timestamp based on information in source
    timezone: false, // Timezone to use to display time, base on set location, if none is set base on timezone in source information (this should be stored in the when section)

    source: { // Always GMT +00:00, UTC does not change daylight savings
      type: "gps",

      datestring: ""
    }

    source: {
      type: "exif",

      datestring: "",
      timezone: false, // Timezone for the datestring
      daylightSavings: false, // Have the datestring been compensated for daylight savings, get from camera
      utcOffset: 0, // UTC timestamp offset, get from camera
    }

    source: {
      type: "manual",

      datestring: "",
      timezone: false, // Timezone for the datestring
      daylightSavings: false // This should be calculated from the date and approved when entering the information
    }

    source: {
      type: "fuzzy",

      datestring: "", // Contain XX for unknown numbers
      timezone: false, // Timezone for the datestring
      daylightSavings: false, // This should be calculated from the date or manual if resolution is to low and approved when entering the information

      range: false // A number which represents the range of the last real digit in the datestring
    }*/



};

exports.When = when;
