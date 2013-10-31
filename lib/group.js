
var db = require("./db");
var logger = new require("./logger")("group");
var utils = require("./utils");
var user = require("./user");

exports.find = function(session, query, options, callback)
{
  options.collection = "groups";

  db.find(query, options, function(error, group_data_list)
  {
    if (error)
    {
      callback("Error while getting group list, reason: " + error);
      return;
    }

    callback(null, utils.array.createHash(group_data_list, "_id"));
  });
};

exports.get = function(session, id, callback)
{
  db.findOne({ _id: id }, "groups", callback);
};

exports.save = function(session, group_data, callback)
{
  user.current(session, function(error, current_user_data)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!group_data.name || group_data.name === "")
    {
      callback("Can not save group without name!");
      return;
    }

    if (!group_data._id)
    {
      group_data.added = { timestamp: utils.time.timestamp(), _by: current_user_data._id };
    }

    group_data.description = group_data.description || "";
    group_data.modified = { timestamp: utils.time.timestamp(), _by: current_user_data._id };

    db.save(group_data, "groups", function(error, group_data)
    {
      if (error)
      {
        callback("Error while saving group, reason: " + error);
        return;
      }

      callback(null, group_data);
    });
  });
};

exports.remove = function(session, id, callback)
{
  db.remove(id, "groups", function(error)
  {
    if (error)
    {
      callback("Error while removing group, reason: " + error);
      return;
    }

    callback(null);
  });
};
