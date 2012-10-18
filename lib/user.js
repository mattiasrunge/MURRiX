
var MurrixUtils = require('./utils.js');
var sha1 = require('sha1');

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
    
      db.collection("nodes", function(error, collection)
      {
        if (error)
        {
          console.log("Could not get nodes collection");
          callback(true, null);
          return;
        }

        collection.findOne({ _id: session.document._user }, function(error, document)
        {
          if (error)
          {
            console.log("Could not run query");
            callback(true, null);
            return;
          }

          if (!document)
          {
            console.log("No user found but need to update session");

            delete session.document._user;

            session.save(function(error)
            {
              if (error)
              {
                console.log("Failed to save session");
                callback(true, null);
                return;
              }

              callback(null, false);
            });
          }

          console.log("Found user with id " + session.document._user);
          self.user = document;
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

      var query = { "user.username": username, "user.password": sha1(password), type: "person" };

      console.log(query);
      
      collection.findOne(query, function(error, document)
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
          callback(null, false); // No error but no user found
          return;
        }

        session.document._user = document._id;
        session.save(function(error)
        {
          if (error)
          {
            console.log("Failed to save session");
            callback(true, null);
            return;
          }

          self.user = document;
          callback(null, document);
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

        collection.update({ _id: user._id }, { $set: { "user.password": sha1(password) } }, function(error, document)
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
}

exports.User = User;
