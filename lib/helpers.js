
var util = require("util");
var events = require("events");
var moment = require("moment");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixHelpersManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "helpers";

  murrix.client.on("done", function()
  {
    murrix.client.register("helper_nodeGetFilesList", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, type: true, } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = self.getItemQuery(nodeData._id, nodeData.type, [ "file" ]);
        var options = { collection: "items", fields: { _id: true, name: true, when: true, cacheId: true, "exif.MIMEType": true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var list = [];

          itemDataList.sort(murrix.utils.sortItemFunction);

          for (var n = 0; n < itemDataList.length; n++)
          {
            list.push({ _id: itemDataList[n]._id, name: itemDataList[n].name, cacheId: itemDataList[n].cacheId, type: itemDataList[n].exif ? itemDataList[n].exif.MIMEType : null });
          }

          callback(null, list);
        });
      });
    });

    murrix.client.register("helper_nodeGetTimelineList", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, type: true, } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = self.getItemQuery(nodeData._id, nodeData.type, [ "file", "text" ]);
        var options = { collection: "items", fields: { _id: true, when: true, what: true, where: true, name: true, text: true, cacheId: true, "exif.MIMEType": true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var results = {};
          var timeline = [];

          for (var n = 0; n < itemDataList.length; n++)
          {
            var itemData = itemDataList[n];

            var datestamp = false;
            var datestampCompare = 0;

            if (itemData.when === false || itemData.when === null || itemData.when.timestamp === false || itemData.when.timestamp === null)
            {
              datestamp = false;
            }
            else
            {
              var timestamp = moment.utc(itemData.when.timestamp * 1000).local();
              datestamp = [ timestamp.year(), timestamp.month(), timestamp.date() ];

              var datestampString = murrix.utils.lpad(datestamp[0] + "", "0", 4);
              datestampString += murrix.utils.lpad(datestamp[1] + "", "0", 2);
              datestampString += murrix.utils.lpad(datestamp[2] + "", "0", 2);
              datestampCompare = parseInt(datestampString, 10);
            }

            if (!results[datestampCompare])
            {
              results[datestampCompare] = {};
              results[datestampCompare].datestamp = datestamp;
              results[datestampCompare]["texts"] = [];
              results[datestampCompare]["audio"] = [];
              results[datestampCompare]["images"] = [];
            }

            if (itemData.what === "text")
            {
              results[datestampCompare]["texts"].push({ _id: itemData._id, name: itemData.name, type: itemData.type, when: itemData.when, text: itemData.text, _who: itemData._who, where: itemData.where });
            }
            else if (itemData.what === "file")
            {
              if (murrix.utils.mimeIsImage(itemData.exif.MIMEType) || murrix.utils.mimeIsVideo(itemData.exif.MIMEType))
              {
                results[datestampCompare]["images"].push({ _id: itemData._id, name: itemData.name, cacheId: itemData.cacheId, type: itemData.exif ? itemData.exif.MIMEType : null });
              }
              else if (murrix.utils.mimeIsAudio(itemData.exif.MIMEType))
              {
                results[datestampCompare]["audio"].push({ _id: itemData._id, name: itemData.name, type: itemData.exif ? itemData.exif.MIMEType : null });
              }
            }
          }

          for (var datestampCompare in results)
          {
            var item = {};

            item.datestampCompare = datestampCompare;
            item.datestamp = results[datestampCompare].datestamp;
            item.texts = results[datestampCompare].texts;
            item.images = results[datestampCompare].images;
            item.audio = results[datestampCompare].audio;

            timeline.push(item);
          }

          timeline.sort(function(a, b)
          {
            return a.datestampCompare - b.datestampCompare;
          });

          callback(null, timeline);
        });
      });
    });

    murrix.client.register("helper_itemGetEnvironment", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = self.getItemQuery(nodeData._id, nodeData.type, [ "file", "text" ]);
        var options = { collection: "items", fields: { _id: true, when: true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var environment = {};
          environment.count = itemDataList.length;
          environment.index = 0;
          environment.prevId = args.itemId;
          environment.nextId = args.itemId;

          itemDataList.sort(murrix.utils.sortItemFunction);

          for (var n = 0; n < itemDataList.length; n++)
          {
            if (itemDataList[n]._id === args.itemId)
            {
              environment.index = n + 1;
              environment.prevId = itemDataList[n - 1 < 0 ? itemDataList.length - 1 : n - 1]._id;
              environment.nextId = itemDataList[n + 1 >= itemDataList.length ? 0 : n + 1]._id;
              break;
            }
          }

          callback(null, environment);
        });
      });
    });

    murrix.client.register("helper_nodeGetMapMarkers", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = self.getItemQuery(nodeData._id, nodeData.type, [ "file", "text", "position" ]);
        var options = { collection: "items", fields: { _id: true, when: true, where: true, name: true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var list = [];

          itemDataList.sort(murrix.utils.sortItemFunction);

          for (var n = 0; n < itemDataList.length; n++)
          {
            if (itemDataList[n].where && itemDataList[n].where.latitude)
            {
              list.push({ _id: itemDataList[n]._id, name: itemDataList[n].name, when: itemDataList[n].when, where: itemDataList[n].where });
            }
          }

          callback(null, list);
        });
      });
    });

    murrix.client.register("helper_nodeGetAge", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = { $or: [] };
        query.what = "text";
        query._parents = args.nodeId;
        query.$or.push({ type: "birth" });
        query.$or.push({ type: "death" });

        var options = { collection: "items", fields: { _id: true, when: true, type: true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var age = { ageNow: false, ageAtDeath: false };
          var birthItem = false;
          var deathItem = false;

          for (var n = 0; n < itemDataList.length; n++)
          {
            if (itemDataList[n].type === "birth")
            {
              birthItem = itemDataList[n];
            }
            else if (itemDataList[n].type === "death")
            {
              deathItem = itemDataList[n];
            }
          }

          if (birthItem && birthItem.when && birthItem.when.timestamp)
          {
            age.ageNow = murrix.utils.calculateAge(birthItem.when.timestamp);

            if (deathItem && deathItem.when && deathItem.when.timestamp)
            {
              age.ageAtDeath = murrix.utils.calculateAge(birthItem.when.timestamp, deathItem.when.timestamp);
            }
          }

          callback(null, age);
        });
      });
    });

    self.emit("done");
  });

  self.getItemQuery = function(nodeId, nodeType, itemTypes)
  {
    var query = { $or: [] };

    query.what = { $in : itemTypes };
    query.$or.push({ _parents: nodeId });

    switch (nodeType)
    {
      case "album":
      {
        break;
      }
      case "person":
      {
        query.$or.push({ "showing._id": nodeId });
        break;
      }
      case "location":
      {
        query.$or.push({ "showing._id": nodeId });
        query.$or.push({ "where._id": nodeId });
        break;
      }
      case "camera":
      {
        query.$or.push({ "showing._id": nodeId });
        query.$or.push({ "_with": nodeId });
        break;
      }
      case "vehicle":
      {
        query.$or.push({ "showing._id": nodeId });
        break;
      }
    };

    return query;
  };
};

util.inherits(MurrixHelpersManager, events.EventEmitter);

exports.Manager = MurrixHelpersManager;
