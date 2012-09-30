
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var sha1 = require('sha1');

function User(db)
{
  var self = this;

  this.db = db;

  self.getUser = function(session, callback)
  {
    if (session && session.document && session.document.lUser)
    {
      db.collection("nodes", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get nodes collection");
          callback(true, null);
          return;
        }

        collection.findOne({ _id: session.document.lUser }, function(error, document)
        {
          if (error)
          {
            console.log("Could not run query");
            callback(true, null);
            return;
          }

          if (!document)
          {
            console.log("No user found found but need to update session");

            delete session.document.lUser;
            session.save(function() {});

            callback(null, false);
            return;
          }

          console.log("Found user with id " + session.document.lUser);
          callback(null, document);
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
    db.collection("nodes", function(error, collection)
    {
      if (error)
      {
        console.log("Could not get nodes collection");
        callback(true, null);
        return;
      }

      collection.findOne({ username: username, password: sha1(password), type: "person" }, function(error, document)
      {
        if (error)
        {
          console.log("Could not run query");
          callback(true, null);
          return;
        }

        if (!document)
        {
          console.log("No user node found");
          callback(null, false); // No error but no session found
          return;
        }

        session.document.lUser = document._id;
        session.save(function(error)
        {
          if (error)
          {
            console.log("Failed to save session");
            callback(true, null);
            return;
          }

          callback(null, document);
        });
      });
    });
  };

  self.logout = function(session, callback)
  {
    if (session.document.lUser)
    {
      delete session.document.lUser;
      session.save(function(error)
      {
        callback(error);
      });

      return;
    }

    callback(null);
  };

  self.changePassword = function(session, password, callback)
  {
    self.getUser(session, function(error, user)
    {
      if (error)
      {
        callback(true);
        return;
      }

      db.collection("nodes", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get nodes collection");
          callback(true);
          return;
        }

        collection.update({ _id: user._id }, { $set: { password: sha1(password) } }, function(error, document)
        {
          if (error)
          {
            console.log("Could not run query");
            callback(true);
            return;
          }

          callback(null);
        });
      });
    });
  };
};

exports.User = User;
