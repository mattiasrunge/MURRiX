
var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;

function MurrixUserManager(murrix)
{
  var self = this;

  self.name = "user";
  self.user = false;

  murrix.on("init", function()
  {
    murrix.client.register("login", function(session, args, callback)
    {
      self.login(session, args.username, args.password, callback);
    });

    murrix.client.register("logout", function(session, args, callback)
    {
      self.logout(session, callback);
    });

    murrix.client.register("changePassword", function(session, args, callback)
    {
      self.changePassword(session, args.id, args.password, callback);
    });

    murrix.client.register("findGroups", function(session, args, callback)
    {
      self.findGroups(session, args.query || {}, args.options || {}, callback);
    });

    murrix.client.register("findUsers", function(session, args, callback)
    {
      self.findUsers(session, args.query || {}, args.options || {}, callback);
    });

    murrix.client.register("saveGroup", function(session, args, callback)
    {
      self.saveGroup(session, args, callback);
    });

    murrix.client.register("saveUser", function(session, args, callback)
    {
      self.saveUser(session, args, callback);
    });

    murrix.client.register("removeGroup", function(session, args, callback)
    {
      self.removeGroup(session, args, callback);
    });

    murrix.client.register("removeUser", function(session, args, callback)
    {
      self.removeUser(session, args, callback);
    });
  });

  self.getUser = function(session, callback)
  {
    if (session && session.document && session.document._user)
    {
      if (self.user && self.user._id === session.document._user)
      {
        callback(null, self.user);
        return;
      }

      self.user = false;

      murrix.db.mongoDb.collection("users", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get users collection");
          callback(error);
          return;
        }

        collection.findOne({ _id: session.document._user }, function(error, userData)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not run query");
            callback(error);
            return;
          }

          if (!userData)
          {
            murrix.logger.debug(self.name, "No user found but need to update session");

            delete session.document._user;

            session.save(function(error)
            {
              if (error)
              {
                murrix.logger.error(self.name, "Failed to save session");
                callback(error);
                return;
              }

              callback(null, false);
            });
          }

          self.user = userData;
          callback(null, userData);
        });
      });
    }
    else
    {
      //murrix.logger.error(self.name, "No user found");
      callback(null, false);
    }
  };

  self.login = function(session, username, password, callback)
  {
    murrix.db.mongoDb.collection("users", function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get users collection");
        callback(error);
        return;
      }

      var query = { "username": username, "password": crypto.createHash('sha1').update(password).digest("hex") };

      //murrix.logger.error(self.name, query);

      collection.findOne(query, function(error, userData)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not run query");
          callback(error);
          return;
        }

        if (!userData)
        {
          murrix.logger.error(self.name, "No user node found");
          callback(null, false); // No error but no user found
          return;
        }

        userData.lastLogin = murrix.utils.timestamp();

        collection.save(userData, function(error)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not run query");
            callback(error);
            return;
          }

          session.document._user = userData._id;
          session.save(function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Failed to save session");
              callback(error);
              return;
            }

            murrix.logger.info(self.name, userData.username + " logged in!");

            self.user = userData;
            callback(null, userData);
          });
        });
      });
    });
  };

  self.logout = function(session, callback)
  {
    self.user = false;

    if (session.document._user)
    {
      delete session.document._user;

      session.save(function(error)
      {
        murrix.logger.info(self.name, "User logged out!");
        callback(error);
      });

      return;
    }

    callback(null);
  };

  self.changePassword = function(session, id, password, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (id !== user._id && !user.admin)
      {
        callback("No rights to change password for user!");
        return;
      }

      murrix.db.mongoDb.collection("users", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get users collection");
          callback(error);
          return;
        }

        collection.update({ _id: id }, { $set: { "password": crypto.createHash('sha1').update(password).digest("hex") } }, function(error, document)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not run query");
            callback(error);
            return;
          }

          callback(null);
        });
      });
    });
  };

  self.findUsers = function(session, query, options, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (user === false)
      {
        callback("No rights to get users!");
        return;
      }

      murrix.db.mongoDb.collection("users", function(error, collection)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var limit = 0;
        var skip = 0;

        if (options.limit !== null)
        {
          limit = options.limit;
        }

        if (options.skip !== null)
        {
          skip = options.skip;
        }

        collection.find(query, function(error, cursor)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var userDataList = {};

          cursor.skip(skip).limit(limit).each(function(error, userData)
          {
            if (userData)
            {
              userDataList[userData._id] = userData;
            }
            else
            {
              callback(null, userDataList);
            }
          });
        });
      });
    });
  };

  self.findGroups = function(session, query, options, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (user === false)
      {
        callback("No rights to get groups!");
        return;
      }

      murrix.db.mongoDb.collection("groups", function(error, collection)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var limit = 0;
        var skip = 0;

        if (options.limit !== null)
        {
          limit = options.limit;
        }

        if (options.skip !== null)
        {
          skip = options.skip;
        }

        collection.find(query, function(error, cursor)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var groupDataList = {};

          cursor.skip(skip).limit(limit).each(function(error, groupData)
          {
            if (groupData)
            {
              groupDataList[groupData._id] = groupData;
            }
            else
            {
              callback(null, groupDataList);
            }
          });
        });
      });
    });
  };

  self.saveGroup = function(session, groupData, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!user.admin)
      {
        callback("No rights create a group!");
        return;
      }

      murrix.db.mongoDb.collection("groups", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get groups collection");
          callback(error);
          return;
        }

        if (!groupData.name || groupData.name === "")
        {
          callback("Can not create group without name!");
          return;
        }

        groupData.description = groupData.description || "";
        groupData.added = groupData.added || { timestamp: murrix.utils.timestamp(), _by: user._id };

        if (groupData._id)
        {
          collection.update({ _id: groupData._id }, groupData, { }, function(error, numberOfUpdatedRows)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, groupData);
          });
        }
        else
        {
          groupData._id = new ObjectID().toString();

          collection.insert(groupData, function(error, groupData)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, groupData[0]);
          });
        }
      });
    });
  };

  self.saveUser = function(session, userData, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!user.admin)
      {
        callback("No rights save a user!");
        return;
      }

      murrix.db.mongoDb.collection("users", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get users collection");
          callback(error);
          return;
        }

        if (!userData.name || userData.name === "")
        {
          callback("Can not save user without name!");
          return;
        }

        if (!userData.username || userData.username === "")
        {
          callback("Can not save user without username!");
          return;
        }

        userData.added = userData.added || { timestamp: murrix.utils.timestamp(), _by: user._id };
        userData.lastLogin = userData.lastLogin || false;
        userData.password = userData.password || crypto.createHash('sha1').update(self.generatePassword()).digest("hex");
        userData._person = userData._person || false;
        userData.admin = userData.admin || false;
        userData._groups = userData._groups || [];// TODO: Any user should not be allowed to add themselves to any group!

        if (userData._id)
        {
          collection.update({ _id: userData._id }, userData, { }, function(error, numberOfUpdatedRows)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, userData);
          });
        }
        else
        {
          userData._id = new ObjectID().toString();

          collection.insert(userData, function(error, userData)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, userData[0]);
          });
        }
      });
    });
  };

  self.removeGroup = function(session, id, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!user.admin)
      {
        callback("No rights remove group!");
        return;
      }

      murrix.db.mongoDb.collection("groups", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get groups collection");
          callback(error);
          return;
        }

        collection.remove({ _id: id }, function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          murrix.db.mongoDb.collection("users", function(error, collection)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Could not get users collection");
              callback(error);
              return;
            }

            collection.update({ _id: { $exists: true } }, { $pull: { _groups: id } }, { multi: true }, function(error)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null);
            });
          });

          callback(null);
        });
      });
    });
  };

  self.removeUser = function(session, id, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!user.admin)
      {
        callback("No rights remove user!");
        return;
      }

      murrix.db.mongoDb.collection("users", function(error, collection)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get users collection");
          callback(error);
          return;
        }

        collection.remove({ _id: id }, function(error)
        {
          if (error)
          {
            callback(error);
            return;
          }

          callback(null);
        });
      });
    });
  };

  self.generatePassword = function()
  {
    var characterList = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!"
    var password = "";

    for (var n = 0; n < 16; n++)
    {
      password += characterList.charAt(Math.floor(characterList.length * Math.random()));
    }

    return password
  };

  self.checkAdminUser = function(callback)
  {
    murrix.db.mongoDb.collection("users", function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get users collection");
        callback(error);
        return;
      }

      collection.findOne({ username: "admin" }, function(error, userData)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not run query");
          callback(error);
          return;
        }

        if (userData === null)
        {
          murrix.logger.error(self.name, "Could not find admin user!");

          userData = {};

          userData._id = new ObjectID().toString();
          userData.name = "Administrator";
          userData.added = { timestamp: murrix.utils.timestamp(), _by: userData._id };
          userData.admin = true;
          userData.username = "admin";
          userData.password = crypto.createHash('sha1').update("password").digest("hex");
          userData._person = false;
          userData._groups = [];

          collection.insert(userData, function(error, userData)
          {
            if (error)
            {
              murrix.logger.error(self.name, error);
              callback(error);
              return;
            }

            murrix.logger.info(self.name, "Admin user created with id " + userData._id + "!");
            callback(null);
          });
        }
        else
        {
          callback(null);
        }
      });
    });
  };
}

exports.Manager = MurrixUserManager;
