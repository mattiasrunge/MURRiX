
var fs = require('fs');
var path = require('path');
var ObjectID = require('mongodb').ObjectID;
var MurrixUtils = require('./utils.js');

function SessionObject(document)
{
  var self = this;

  self.document = document;

  self.getId = function()
  {
    if (self.document)
    {
      return self.document._id;
    }

    return null;
  };

  self.save = function(callback)
  {
    var filename = "/tmp/murrix_session_" + self.getId();
    
    fs.writeFile(filename, JSON.stringify(self.document), function(error)
    {
      if (error)
      {
        console.log("Could not write session to disk with filename " + filename);
        callback(true);
        return;
      }

      console.log("Session saved with filename " + filename);
      callback(null);
    });
  };
}

function Session(db, name)
{
  var self = this;

  this.name = name;
  this.db = db;
  this.sessions = {};
  this.cookieExpire = 3600 * 24 * 7 * 2;

  self.start = function(request, response, callback)
  {
    var id = self.getIdFromCookieString(request.headers.cookie);

    var expireTimestamp = (new Date()).getTime() + (self.cookieExpire * 1000);
    var expireString = (new Date(expireTimestamp)).toUTCString();

    self.find(id, function(error, session)
    {
      if (error)
      {
        console.log("Error while trying to find session with id " + id);
        callback(true, null);
        return;
      }

      if (session === false)
      {
        session = new SessionObject({ _id: new ObjectID().toString() });
        console.log("Creating a new session with id " + session.getId());
        
        session.save(function(error)
        {
          if (error)
          {
            callback(true, null);
            return;
          }

          id = session.getId();

          self.sessions[id] = session;

          request.session = session;

          response.setHeader("Set-Cookie", self.name + "=" + id + "; path=/; expires=" + expireString);

          console.log("Session saved with id " + id);

          callback(null, session);
        });
      }
      else
      {
        request.session = session;

        response.setHeader("Set-Cookie", self.name + "=" + id + "; path=/; expires=" + expireString);

        console.log("Session found with id " + session.getId());

        callback(null, session);
      }
    });
  };

  self.getIdFromCookieString = function(cookieString)
  {
    var cookies = MurrixUtils.parseCookieString(cookieString);

    if (cookies[name])
    {
      return cookies[name];
    }

    return false;
  };

  self.find = function(id, callback)
  {
    /* Check if already in memory */
    if (self.sessions[id])
    {
      console.log("Session cached!");
      callback(null, self.sessions[id]);
      return;
    }


    /* Check if file exists on disk */
    var filename = "/tmp/murrix_session_" + id;

    path.exists(filename, function(exists)
    {
      if (!exists)
      {
        console.log("No session file found on filename " + filename);
        callback(null, false);
        return;
      }

      fs.readFile(filename, function(error, data)
      {
        if (error)
        {
          console.log("Could not read file " + filename);
          callback(true, null);
          return;
        }

        self.sessions[id] = new SessionObject(JSON.parse(data));
        callback(null, self.sessions[id]);
      });
    });
  };
}

exports.Session = Session;
