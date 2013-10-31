
var db = require("../db");
var user = require("../user");
var utils = require("../utils");
var moment = require("moment");

function addAccessCheckToQuery(session, query, adminRequired, callback)
{
  user.current(session, function(error, userData)
  {
    if (error)
    {
      callback("Could not get user, reason: " + error);
      return;
    }

    if (userData)
    {
      if (!userData.admin)
      {
        var newQuery = {};

        newQuery.$or = [];

        newQuery.$or.push({ "added._by": userData._id });
        newQuery.$or.push({ _id: userData._id });

        if (adminRequired)
        {
          if (userData._groups && userData._groups.length > 0)
          {
            newQuery.$or.push({ _admins: { $in: userData._groups } });
          }
        }
        else
        {
          newQuery.$or.push({ "public": true });

          if (userData._groups && userData._groups.length > 0)
          {
            newQuery.$or.push({ _readers: { $in: userData._groups } });
            newQuery.$or.push({ _admins: { $in: userData._groups } });
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

exports.event = {};

exports.find = function(session, args, callback)
{
  var options = {};

  options.collection = "nodes";

  if (args.limit)
  {
    options.limit = args.limit;
  }

  addAccessCheckToQuery(session, args.query, false, function(error, query)
  {
    db.find(query, options, callback);
  });
};

exports.findByYear = function(session, args, callback)
{
  var startTime = moment([ args.year ]);
  var endTime = startTime.clone().add("years", 1);

  var query = {};
  query.$and = query.$and || [];
  query.$and.push({ "when.timestamp": { $exists: true } });
  query.$and.push({ "when.timestamp": { $ne: false } });
  query.$and.push({ "when.timestamp": { $gt: startTime.unix() } });
  query.$and.push({ "when.timestamp": { $lt: endTime.unix() } });

  var options = [
    {
      $match: query
    },
    {
      $unwind: "$_parents"
    },
    {
      $group: {
        _id: "parents",
        _parents: { $addToSet: "$_parents" }
      }
    }
  ];

  db.aggregate(options, "items", function(error, result)
  {
    if (error)
    {
      console.log("Could not aggregate, reason: " + error);
      callback("Could not aggregate, reason: " + error);
      return;
    }

    if (result.length === 0)
    {
      callback(null, []);
      return;
    }

    addAccessCheckToQuery(session, { _id: { $in: result[0]['_parents'] } }, false, function(error, query)
    {
      if (error)
      {
        callback("Could not create access query, reason: " + error);
        return;
      }

      args.options = args.options || {};
      args.options.collection = "nodes";

      db.find(query, args.options, function(a, b) { console.log("e", new Date()); callback(a,b); });
    });
  });
};

exports.getLabels = function(session, args, callback)
{
  user.current(session, function(error, userData)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (userData === false)
    {
      callback("Must be logged in to view tags!");
      return;
    }

    var options = [
      {
        $unwind: "$tags"
      },
      {
        $group: {
          _id: "tags",
          tags: { $addToSet: "$tags" }
        }
      }
    ];

    db.aggregate(options, "nodes", function(error, result)
    {
      if (error)
      {
        console.log("Could not aggregate, reason: " + error);
        callback("Could not aggregate, reason: " + error);
        return;
      }

      if (result.length === 0)
      {
        callback(null, []);
        return;
      }

      callback(null, result[0]['tags'].sort(utils.sort.natcasecmp));
    });
  });
};
