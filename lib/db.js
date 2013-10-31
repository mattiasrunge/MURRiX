
var mongo = require("mongodb");
var logger = new require("./logger")("db");
var triggers = new require("./triggers");

var db = null;

exports.open = function(host, port, name, callback)
{
  var server = new mongo.Server(host, port, { auto_reconnect: true });
  db = new mongo.Db(name, server, { safe: true });

  db.open(function(error, mongoDb)
  {
    if (error)
    {
      callback("Failed to connect to mongoDB, reason: " + error.toString());
      return;
    }

    callback();
  });
};

exports.close = function(callback)
{
  db.close();
  db = null;

  callback();
};

exports.destroyDatabase = function(guarantee, callback)
{
  if (guarantee !== "iamsure")
  {
    callback("Could not verify that the destory command is valid!");
    return;
  }

  db.dropDatabase(function(error)
  {
    if (error)
    {
      callback(error);
      return;
    }

    exports.close(callback);
  });
};

exports.newId = function()
{
  return (new mongo.ObjectID()).toString();
};

exports.remove = function(id, collection_name, callback)
{
  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    exports.findOne({ _id: id }, collection_name, function(error, current_doc)
    {
      if (error)
      {
        callback(error);
        return;
      }

      triggers.before("remove", collection_name, current_doc, current_doc, function(error, updated_doc)
      {
        if (error)
        {
          callback(error);
          return;
        }

        collection.remove({ _id: updated_doc._id }, function(error)
        {
          if (error)
          {
            callback(error.toString());
            return;
          }

          triggers.after("remove", collection_name, current_doc, updated_doc, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback();
          });
        });
      });
    });
  });
};

exports.save = function(new_doc, collection_name, callback)
{
  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    if (new_doc._id)
    {
      exports.findOne({ _id: new_doc._id }, collection_name, function(error, current_doc)
      {
        if (error)
        {
          callback(error);
          return;
        }

        triggers.before("update", collection_name, current_doc, new_doc, function(error, updated_doc)
        {
          if (error)
          {
            callback(error);
            return;
          }

          collection.update({ _id: updated_doc._id }, updated_doc, { }, function(error)
          {
            if (error)
            {
              callback(error.toString());
              return;
            }

            triggers.after("update", collection_name, current_doc, updated_doc, function(error, updated_doc)
            {
              if (error)
              {
                callback(error);
                return;
              }

              callback(null, updated_doc);
            });
          });
        });
      });
    }
    else
    {
      if (new_doc.__id)
      {
          new_doc._id = new_doc.__id;
          delete new_doc.__id;
      }
      else
      {
        new_doc._id = exports.newId();
      }

      triggers.before("create", collection_name, {}, new_doc, function(error, updated_doc)
      {
        if (error)
        {
          callback(error);
          return;
        }

        collection.insert(updated_doc, function(error, updated_docs)
        {
          if (error)
          {
            callback(error.toString());
            return;
          }

          triggers.after("create", collection_name, {}, updated_docs[0], function(error, updated_doc)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, updated_doc);
          });
        });
      });
    }
  });
};

exports.findOne = function(query, options, callback)
{
  var collection_name = typeof options === "string" ? options : options.collection;
  var fields = options.fields || false;

  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    var resultFunction = function(error, result)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      callback(null, result);
    };

    if (fields)
    {
      collection.findOne(query, fields, resultFunction);
    }
    else
    {
      collection.findOne(query, resultFunction);
    }
  });
};

exports.find = function(query, options, callback)
{
  var collection_name = typeof options === "string" ? options : options.collection;
  var limit = options.limit || 0;
  var skip = options.skip || 0;
  var sort = options.sort || [ "_id" ];
  var sort_ascending = (options.sort_ascending || "asc") === "asc" ? 1 : -1;
  var fields = options.fields || false;

  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    var resultFunction = function(error, cursor)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      var docs = [];

      cursor.sort(sort, sort_ascending).skip(skip).limit(limit).each(function(error, doc)
      {
        if (error)
        {
          callback(error.toString());
          return;
        }

        if (doc)
        {
          docs.push(doc);
        }
        else
        {
          callback(null, docs);
        }
      });
    };

    if (fields)
    {
      collection.find(query, fields, resultFunction);
    }
    else
    {
      collection.find(query, resultFunction);
    }
  });
};

exports.count = function(query, options, callback)
{
  var collection_name = typeof options === "string" ? options : options.collection;

  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    collection.find(query, function(error, cursor)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      cursor.count(function(error, count)
      {
        if (error)
        {
          callback(error.toString());
          return;
        }

        callback(null, count);
      });
    });
  });
};

exports.distinct = function(query, options, callback)
{
  var collection_name = typeof options === "string" ? options : options.collection;

  db.collection(collection_name, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    collection.distinct(query, function(error, result)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      callback(null, result);
    });
  });
};

exports.group = function(query, options, callback)
{
  if (!options.reduce)
  {
    callback("Can not call group without a reduce function");
    return;
  }

  db.collection(options.collection, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    options.fields = options.fields || [];
    options.initial = options.initial || {};

    collection.group(options.fields, query, options.initial, options.reduce, function(error, results)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      callback(null, results);
    });
  });
};

exports.aggregate = function(options, collection, callback)
{
  db.collection(collection, function(error, collection)
  {
    if (error)
    {
      callback(error.toString());
      return;
    }

    collection.aggregate(options, function(error, results)
    {
      if (error)
      {
        callback(error.toString());
        return;
      }

      callback(null, results);
    });
  });
};
