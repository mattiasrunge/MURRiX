
var user = require("../user");

exports.event = {};

exports.login = function(session, args, callback)
{
  user.login(session, args.username, args.password, false, callback);
};

exports.logout = function(session, args, callback)
{
  user.logout(session, callback);
};

exports.current = function(session, args, callback)
{
  user.current(session, callback);
};

exports.saveProfile = function(session, args, callback)
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
      callback("Must be logged in to save profile!");
      return;
    }

    userData.name = args.name;
    userData.username = args.username;
    userData.email = args.email;
    userData._person = args._person;

    user.save(session, userData, callback);
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

    if (!userData.admin)
    {
      callback("No rights get user!");
      return;
    }

    user.get(session, args, callback);
  });
};

exports.changePassword = function(session, args, callback)
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
      callback("Can not change password when not logged in!");
      return;
    }

    user.changePassword(session, userData._id, args.password, callback);
  });
};

exports.find = function(session, args, callback)
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

    args.options = args.options || {};
    args.query = args.query || {};

    user.find(session, args.query, args.options, callback);
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

    user.save(session, args, callback);
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

    user.remove(session, args, callback);
  });
};




exports.event.current = function(session, args, callback)
{
  exports.current(session, args, callback);
};
/*
 *
      user_data_list = user_data_list.map(function(user_data)
      {
        delete user_data.password;
        return user_data;
      });*/