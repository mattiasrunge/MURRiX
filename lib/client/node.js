
var db = require("../db");
var user = require("../user");
var utils = require("../utils");
var moment = require("moment");
var Chain = require("achain.js");

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
  options.limit = args.limit ? args.limit : undefined;
  options.skip = args.skip ? args.skip : undefined;

  addAccessCheckToQuery(session, args.query, false, function(error, query)
  {
    db.find(query, options, function(error, nodeDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
      
      var chain = new Chain();
      
      if (args.profilePicture)
      {
        chain.addMany(nodeDataList, function(nodeData, options, next)
        {
          exports.getProfilePictureInfo(session, { _id: nodeData._id }, function(error, result)
          {
            nodeData.profilePictureInfo = result;
            next(error);
          });
        });
      }
      
      if (args.age)
      {
        chain.addMany(nodeDataList, function(nodeData, options, next)
        {
          exports.getAgeInfo(session, { _id: nodeData._id }, function(error, result)
          {
            nodeData.ageInfo = result;
            next(error);
          });
        });
      }
      
      chain.run(function(error)
      {
        callback(error, nodeDataList);
      });
    });
  });
};

exports.count = function(session, args, callback)
{
  var options = {};

  options.collection = "nodes";
  options.limit = args.limit ? args.limit : undefined;
  options.skip = args.skip ? args.skip : undefined;

  addAccessCheckToQuery(session, args.query, false, function(error, query)
  {
    db.count(query, options, callback);
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

    args.query = { _id: { $in: result[0]['_parents'] } };

    exports.find(session, args, function(a, b) { callback(a, b); });
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

exports.getAgeInfo = function(session, args, callback)
{
  var result = {};
  
  exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, nodeDataList)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    if (nodeDataList.length === 0)
    {
      callback(null, result);
      return;
    }
    
    var options = {};
    options.collection = "items";

    var query = { $or: [] };
    query.what = "text";
    query._parents = nodeDataList[0]._id;
    query.$or.push({ type: "birth" });
    query.$or.push({ type: "death" });

    db.find(query, options, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
    
      for (var n = 0; n < itemDataList.length; n++)
      {
        if (itemDataList[n].when && itemDataList[n].when.source && itemDataList[n].when.source.datestring)
        {
          if (itemDataList[n].type === "birth")
          {
            result.birth = itemDataList[n].when.source.datestring.substr(0, itemDataList[n].when.source.datestring.indexOf(" ")).replace(/(-XX)/g, "");
            result.birthTimestamp = itemDataList[n].when.timestamp;
          }
          else if (itemDataList[n].type === "death")
          {
            result.death = itemDataList[n].when.source.datestring.substr(0, itemDataList[n].when.source.datestring.indexOf(" ")).replace(/(-XX)/g, "");
            result.deathTimestamp = itemDataList[n].when.timestamp;
          }
        }
      }
      
      if (result.birthTimestamp)
      {
        result.age = utils.time.age(result.birthTimestamp);

        if (result.deathTimestamp)
        {
          result.ageAtDeath = utils.time.age(result.birthTimestamp, result.deathTimestamp);
        }
      }
      
      callback(null, result);
    });
  });
};

exports.getProfilePictureInfo = function(session, args, callback)
{
  var result = {};
      
  result.type = false;
  result.id = false;
  
  exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, nodeDataList)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    if (nodeDataList.length === 0)
    {
      callback(null, result);
      return;
    }
    
    result.type = nodeDataList[0].type;
    
    if  (!nodeDataList[0]._profilePicture)
    {
      callback(null, result);
      return;
    }
    
    var options = {};

    options.collection = "items";
    options.limit = 1

    db.find({ _id: nodeDataList[0]._profilePicture }, options, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
      
      if (itemDataList.length > 0)
      {
        result.id = itemDataList[0]._id;
        
        if (itemDataList[0].angle)
        {
          result.angle = itemDataList[0].angle;
        }
        
        if (itemDataList[0].mirror)
        {
          result.mirror = itemDataList[0].mirror;
        }
        
        if (itemDataList[0].exif.Compression === "dvsd")
        {
          result.deinterlace = true;
        }
        
        if (itemDataList[0].thumbPosition)
        {
          result.timeindex = itemDataList[0].thumbPosition;
        }
      }
      
      callback(null, result);
    });
  });
};

exports.getChildIdList = function(session, args, callback)
{
  exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, nodeDataList)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    if (nodeDataList.length === 0)
    {
      callback(null,  []);
      return;
    }
    
    var options = {};

    options.collection = "items";

    db.find({ _parents: args._id, what: { $in: args.types } }, options, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
      
      var list = [];
      
      for (var n = 0; n < itemDataList.length; n++)
      {
        list.push({
          _id: itemDataList[n]._id,
          timestamp: itemDataList[n].when ? itemDataList[n].when.timestamp : false
        });
      }
      
      callback(null, list);
    });
  });
};

exports.comment = function(session, args, callback)
{
  user.current(session, function(error, userData)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, nodeDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
      
      if (nodeDataList.length === 0)
      {
        callback("Could not find any node with that id");
        return;
      }
      
      var comment = {};

      comment.added = { timestamp: utils.time.timestamp(), _by: userData._id };
      comment.text = args.text;

      nodeDataList[0].comments.push(comment);

      db.save(nodeDataList[0], "nodes", callback);
    });
  });
};

exports.getName = function(session, args, callback)
{
  exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, nodeDataList)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    if (nodeDataList.length === 0)
    {
      callback(null, false);
      return;
    }
    
    callback(null, nodeDataList[0]);
  });
};

exports.random = function(session, args, callback)
{
  exports.count(session, { query: {} }, function(error, count)
  {
    if (error)
    {
      callback(error);
      return;
    }

    var index = Math.floor(Math.random() * count);

    args = {};
    args.query = {};
    args.limit = 1;
    args.skip = index;

    exports.find(session, args, function(error, results)
    {
      if (error)
      {
        callback(error);
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
};
