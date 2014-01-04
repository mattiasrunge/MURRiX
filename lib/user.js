
var Logger = require("./logger");
var db = require("./db");
var utils = require("./utils");

var logger = new Logger("user");
var user = false;

exports.current = function(session, callback)
{
  if (!session || !session._user)
  {
    callback(null, false);
    return;
  }

  if (user && user._id === session._user)
  {
    callback(null, user);
    return;
  }

  exports.get(session, session._user, function(error, user_data)
  {
    if (error)
    {
      callback("Error while finding user, reason: " + error);
      return;
    }

    user = user_data ? user_data : false;

    if (!user )
    {
      logger.debug("No user found but need to update session!");
      delete session._user;
    }

    callback(null, user);
  });
};

exports.isLoggedIn = function(session)
{
  return session && session._user;
};

exports.get = function(session, id, callback)
{
  db.findOne({ _id: id }, "users", callback);
};

exports.login = function(session, username, password, override, callback)
{
  var query = { "username": username };

  if (!override)
  {
    query["password"] = utils.crypto.sha1(password);
  }


  db.findOne(query, "users", function(error, user_data)
  {
    if (error)
    {
      logger.error("Error while finding user, reason: " + error);
      callback("Error while finding user, reason: " + error);
      return;
    }

    if (!user_data)
    {
      logger.info("Could not find a user with username " + username);
      callback(null, false); // No error but no user found
      return;
    }

    user_data.lastLogin = utils.time.timestamp();

    db.save(user_data, "users", function(error, user_data)
    {
      if (error)
      {
        logger.error("Could not save last login, reason: " + error);
        callback("Could not save last login, reason: " + error);
        return;
      }

      session._user = user_data._id;

      logger.info(user_data.name + " (" + user_data.username + ") logged in!");

      user = user_data;

      callback(null, user);
    });
  });
};

exports.become = function(session, username, callback)
{
  exports.login(session, username, null, true, callback)
};

exports.logout = function(session, callback)
{
  user = false;

  if (session._user)
  {
    delete session._user;
  }

  callback();
};

exports.changePassword = function(session, id, password, callback)
{
  exports.get(session, id, function(error, user_data)
  {
    if (error)
    {
      callback(error);
      return;
    }

    user_data.password = utils.crypto.sha1(password);

    db.save(user_data, "users", function(error, user_data)
    {
      if (error)
      {
        callback("Could not save new password, reason: " + error);
        return;
      }

      logger.info(user_data.name + " (" + user_data.username + ") changed password!");

      callback(null, user_data);
    });
  });
};

exports.find = function(session, query, options, callback)
{
  exports.current(session, function(error, user_data)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (user_data === false)
    {
      callback("No rights to get users!");
      return;
    }

    options.collection = "users";

    db.find(query, options, function(error, user_data_list)
    {
      if (error)
      {
        callback("Error while getting user list, reason: " + error);
        return;
      }

      callback(null, utils.array.createHash(user_data_list, "_id"));
    });
  });
};

exports.save = function(session, user_data, callback)
{
  exports.current(session, function(error, current_user_data)
  {
    if (error)
    {
      callback(error);
      return;
    }

    if (!user_data.name || user_data.name === "")
    {
      callback("Can not save user without name!");
      return;
    }

    if (!user_data.username || user_data.username === "")
    {
      callback("Can not save user without username!");
      return;
    }

    if (!user_data._id)
    {
      user_data.password = utils.crypto.sha1(user_data.password || utils.crypto.generatePassword());
      user_data.added = { timestamp: utils.time.timestamp(), _by: current_user_data._id };
      user_data.lastLogin = false;
    }

    user_data.modified = { timestamp: utils.time.timestamp(), _by: current_user_data._id };
    user_data._person = user_data._person || false;
    user_data.admin = user_data.admin || false;
    user_data._groups = user_data._groups || [];

    db.save(user_data, "users", function(error, user_data)
    {
      if (error)
      {
        callback("Error while saving user, reason: " + error);
        return;
      }

      callback(null, user_data);
    });
  });
};

exports.remove = function(session, id, callback)
{
  db.remove(id, "users", function(error)
  {
    if (error)
    {
      callback("Error while removing user, reason: " + error);
      return;
    }

    callback();
  });
};
