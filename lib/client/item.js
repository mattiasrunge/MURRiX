
var db = require("../db");
var user = require("../user");
var utils = require("../utils");
var moment = require("moment");

exports.event = {};

exports.find = function(session, args, callback)
{
  var options = {};

  options.collection = "items";

  if (args.limit)
  {
    options.limit = args.limit;
  }
  
  // TODO: Add access checks!

  db.find(args.query, options, callback);
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
    
    exports.find(session, { query: { _id: args._id }, limit: 1 }, function(error, itemDataList)
    {
      if (error)
      {
        callback(error);
        return;
      }
      
      if (itemDataList.length === 0)
      {
        callback("Could not find any item with that id");
        return;
      }
      
      var comment = {};

      comment.added = { timestamp: utils.time.timestamp(), _by: userData._id };
      comment.text = args.text;

      itemDataList[0].comments.push(comment);

      db.save(itemDataList[0], "items", callback);
    });
  });
};

exports.identifyMimetype = function(session, args, callback)
{
  var type = "other";
  
  if (utils.file.isImage(args.mimetype))
  {
    type = "image";
  }
  else if (utils.file.isVideo(args.mimetype))
  {
    type = "video";
  }
  else if (utils.file.isAudio(args.mimetype))
  {
    type = "audio";
  }
  
  callback(null, type);
};
