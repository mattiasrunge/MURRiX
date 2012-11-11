
var MurrixUtils = require('./utils.js');
var sha1 = require('sha1');
var ObjectID = require('mongodb').ObjectID;

function User(db)
{
  var self = this;

  self.user = false;

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
    
      db.collection("users", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get users collection");
          callback(error);
          return;
        }

        collection.findOne({ _id: session.document._user }, function(error, userData)
        {
          if (error)
          {
            console.log("Could not run query");
            callback(error);
            return;
          }

          if (!userData)
          {
            console.log("No user found but need to update session");

            delete session.document._user;

            session.save(function(error)
            {
              if (error)
              {
                console.log("Failed to save session");
                callback(error);
                return;
              }

              callback(null, false);
            });
          }

          console.log("Found user with id " + session.document._user);
          self.user = userData;
          callback(null, userData);
        });
      });
    }
    else
    {
      console.log("No user found");
      callback(null, false);
    }
  };

  self.login = function(session, username, password, callback)
  {
    db.collection("users", function(error, collection)
    {
      if (error)
      {
        console.log("Could not get users collection");
        callback(error);
        return;
      }

      var query = { "username": username, "password": sha1(password) };

      console.log(query);
      
      collection.findOne(query, function(error, userData)
      {
        if (error)
        {
          console.log("Could not run query");
          callback(error);
          return;
        }

        if (!userData)
        {
          console.log("No user node found");
          callback(null, false); // No error but no user found
          return;
        }

        userData.lastLogin = MurrixUtils.timestamp();

        collection.save(userData, function(error)
        {
          if (error)
          {
            console.log("Could not run query");
            callback(error);
            return;
          }

          session.document._user = userData._id;
          session.save(function(error)
          {
            if (error)
            {
              console.log("Failed to save session");
              callback(error);
              return;
            }

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

      db.collection("users", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get users collection");
          callback(error);
          return;
        }

        collection.update({ _id: id }, { $set: { "password": sha1(password) } }, function(error, document)
        {
          if (error)
          {
            console.log("Could not run query");
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

      db.collection("users", function(error, collection)
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

      db.collection("groups", function(error, collection)
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

      db.collection("groups", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get groups collection");
          callback(error);
          return;
        }

        if (!groupData.name || groupData.name === "")
        {
          callback("Can not create group without name!");
          return;
        }

        groupData.description = groupData.description || "";
        groupData.added = groupData.added || { timestamp: MurrixUtils.timestamp(), _by: user._id };

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

      db.collection("users", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get users collection");
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

        userData.added = userData.added || { timestamp: MurrixUtils.timestamp(), _by: user._id };
        userData.lastLogin = userData.lastLogin || false;
        userData.password = userData.password || sha1(self.generatePassword());
        userData._person = userData._person || false;
        userData.admin = userData.admin || false;
        userData._groups = userData._groups || [];

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

      db.collection("groups", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get groups collection");
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

          db.collection("users", function(error, collection)
          {
            if (error)
            {
              console.log("Could not get users collection");
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

      db.collection("users", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get users collection");
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
    db.collection("users", function(error, collection)
    {
      if (error)
      {
        console.log("Could not get users collection");
        callback(error);
        return;
      }

      collection.findOne({ username: "admin" }, function(error, userData)
      {
        if (error)
        {
          console.log("Could not run query");
          callback(error);
          return;
        }

        if (userData === null)
        {
          console.log("Could not find admin user!");

          userData = {};

          userData._id = new ObjectID().toString();
          userData.name = "Administrator";
          userData.added = { timestamp: MurrixUtils.timestamp(), _by: userData._id };
          userData.admin = true;
          userData.username = "admin";
          userData.password = sha1("password");
          userData._person = false;
          userData._groups = [];

          collection.insert(userData, function(error, userData)
          {
            if (error)
            {
              console.log(error);
              callback(error);
              return;
            }

            console.log("Admin user created!");
            callback(null);
          });
        }
        else
        {
          console.log("Admin user found!");
          callback(null);
        }
      });
    });
  };
}

exports.User = User;
