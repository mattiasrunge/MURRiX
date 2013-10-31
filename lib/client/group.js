
var user = require("../user");
var group = require("../group");

exports.event = {};

exports.find = function(session, args, callback)
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
      callback("No rights to get groups!");
      return;
    }

    args.options = args.options || {};
    args.query = args.query || {};

    group.find(session, args.query, args.options, callback);
  });
};

exports.get = function(session, args, callback)
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
      callback("No rights get group!");
      return;
    }

    group.get(session, args, callback);
  });
};


exports.save = function(session, args, callback)
{
  user.current(session, function(error, userData)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!userData.admin)
    {
      callback("No rights save user!");
      return;
    }

    group.save(session, args, callback);
  });
};

exports.remove = function(session, args, callback)
{
  user.current(session, function(error, userData)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!userData.admin)
    {
      callback("No rights remove user!");
      return;
    }

    group.remove(session, args, callback);
  });
};
