
var fs = require("fs");
var util = require("util");
var path = require("path");
var parseString = require("xml2js").parseString;
var MurrixChain = require("./chain.js").MurrixChain;
var ObjectID = require("mongodb").ObjectID;
var events = require("events");

function MurrixScrapersManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "scrapers";
  self.scraping = false;
  self.timer = null;

  murrix.client.on("done", function()
  {
    self.emit("done");
  });

  murrix.db.on("connectDone", function()
  {
    murrix.logger.info(self.name, "Will do a scraping every 30 seconds!");

    // Do initial dump
//     self.scrape(function(error)
//     {
//       if (error)
//       {
//         murrix.logger.error(self.name, error);
//       }
//     });
//
//     setInterval(function()
//     {
//       self.scrape(function(error)
//       {
//         if (error)
//         {
//           murrix.logger.error(self.name, error);
//         }
//       });
//     }, 30000);

    self.emit("done");
  });

  self.scrape = function(callback)
  {
    var chain = new MurrixChain();

    chain.add({}, self.scrapeTracks);

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
  };

  self.scrapeTracks = function(args, options, callback)
  {
    if (self.scraping)
    {
      murrix.logger.info(self.name, "Already scraping, canceling run!");
      return;
    }

    self.scraping = true;

    var chain = new MurrixChain();

    murrix.logger.debug(self.name, "Doing scrape of tracks");

    var tracks = [ // TODO: Move this to some config file
      { _id: "51ea5abb32a886ea4c000012", file: "/home/migan/Dropbox/Apps/GPSLogger for Android/gpslogger.gpx", name: "segling2013", _with: "51eaaca27965264b19000001" }
    ];

    for (var l = 0; l < tracks.length; l++)
    {
      chain.add(tracks[l], function(track, options, chainCallback)
      {
        fs.readFile(track.file, "utf8", function(error, data)
        {
          if (error)
          {
            chainCallback(error);
            return;
          }

          murrix.logger.debug(self.name, track.file + " read, will now parse track " + track.name + "!");

          parseString(data, function (error, result)
          {
            murrix.logger.debug(self.name, "parseString");

            if (error)
            {
              chainCallback(error);
              return;
            }

            murrix.logger.debug(self.name, "Parse done, getting last track point!");

            self._getLastTrackPoint(track._id, track.name, function(error, point)
            {
              if (error)
              {
                chainCallback(error);
                return;
              }

              murrix.logger.debug(self.name, point);

              var lastTimestamp = 0;

              if (point)
              {
                lastTimestamp = point.when.timestamp;
              }

              murrix.logger.debug(self.name, "lastTimestamp=" + lastTimestamp);

              var positions = [];

              for (var n = 0; n < result.gpx.trk.length; n++)
              {
                var trk = result.gpx.trk[n];

                for (var i = 0; i < trk.trkseg.length; i++)
                {
                  var trkseg = trk.trkseg[i];

                  for (var k = 0; k < trkseg.trkpt.length; k++)
                  {
                    var trkpt = trkseg.trkpt[k];

                    var position = {};
                    position.latitude = parseFloat(trkpt.$.lat);
                    position.longitude = parseFloat(trkpt.$.lon);
                    position.elevation = trkpt.ele && trkpt.ele.length > 0 ? parseFloat(trkpt.ele[0]) : false;
                    position.course = trkpt.course && trkpt.course.length > 0 ? parseFloat(trkpt.course[0]) : false;
                    position.speed = trkpt.speed && trkpt.speed.length > 0 ? parseFloat(trkpt.speed[0]) : false;
                    position.hdop = parseFloat(trkpt.hdop[0]);
                    position.source = trkpt.src && trkpt.src.length > 0 ? trkpt.src[0] : false;
                    position.satellites = trkpt.sat && trkpt.sat.length > 0 ? parseInt(trkpt.sat[0], 10) : false;
                    position.time = trkpt.time[0];

                    if (new Date(position.time).getTime() / 1000 > lastTimestamp)
                    {
                      positions.push(position);
                    }
                  }
                }
              }

              murrix.logger.info(self.name, "Found " + positions.length + " new positions for track " + track.name + " on node " + track._id);

//               var createChain = new MurrixChain();
//
//               for (var n = 0; n < positions.length; n++)
//               {
//                 createChain.add({ track: track, position: positions[n] }, function(args, options, chainCallback2)
//                 {
//                   self._createItem(args.track, args.position, chainCallback2);
//                 });
//               }
//
//               createChain.final(function(error)
//               {
//                 if (error)
//                 {
//                   murrix.logger.error(self.name, error);
//                   chainCallback(error);
//                   return;
//                 }
//
//                 chainCallback();
//               });
//
//               createChain.run();

              chainCallback();
            });
          });
        });
      });
    }

    chain.final(function(error)
    {
      self.scraping = false;

      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
        return;
      }

      callback();
    });

    chain.run();
  };

  self._createItem = function(track, position, callback)
  {
    var chain = new MurrixChain();
    var itemData = {};

    itemData._parents = [ track._id ];
    itemData.what = "position";
    itemData.when = { timestamp: false, source: false };
    itemData._with = track._with;
    itemData.track = track.name

    itemData.when.source = {};
    itemData.when.source.type = position.source;
    itemData.when.source.datestring = murrix.utils.cleanDatestring(position.time);

    itemData.where = {};
    itemData.where.longitude = track.longitude;
    itemData.where.latitude = track.latitude;
    itemData.where.source = position.source;
    itemData.where.elevation = position.elevation;
    itemData.where.course = position.course;
    itemData.where.speed = position.speed;
    itemData.where.hdop = position.hdop;
    itemData.where.satellites = position.satellites;

    // TODO: Solve this in a nicer way
    var session = {};
    session.document = {};
    session.document._id = "50fbb6983ac1a1547300001e";
    session.getId = function() { return session.document._id; };
    session.save = function(callback) { callback(); };

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

  self._getLastTrackPoint = function(id, track, callback)
  {
    var query = { $or: [] };

    query.what = "position";
    query.track = track;
    query.$or.push({ _parents: id });

    var options = { collection: "items", limit: 1, sort: "when.timestamp", sortDirection: "desc", fields: { _id: true, when: true, where: true, track: true } };

    murrix.db.find(query, options, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (itemDataList.length === 0)
      {
        callback(null, false);
        return;
      }

      callback(itemDataList[0]);
    });
  };
}

util.inherits(MurrixScrapersManager, events.EventEmitter);

exports.Manager = MurrixScrapersManager;
