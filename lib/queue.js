
function MurrixQueue(murrix, name, sort)
{
  var self = this;

  self.name = "queue";
  self.collectionName = "queue_" + name;
  self.sort = [ "timestamp" ];

  if (sort)
  {
    for (var n = 0; n < sort.length; n++)
    {
      self.sort.unshift("item." + sort[n]);
    }
  }

  self.push = function(id, item, callback)
  {
    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      var queueItem = {};
      queueItem._id = id;
      queueItem.timestamp = murrix.utils.timestamp();
      queueItem.item = item;

      collection.save(queueItem, function(error)
      {
        if (error)
        {
          callback("Could not run query, reason: " + error);
          return;
        }

        callback();
      });
    });
  };

  self.exists = function(id, callback)
  {
    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      collection.count({ _id: id }, function(error, count)
      {
        if (error)
        {
          callback("Could not run query, reason: " + error);
          return;
        }

        callback(null, count > 0);
      });
    });
  };

  self.size = function(callback)
  {
    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        callback("Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      collection.count({ }, function(error, count)
      {
        if (error)
        {
          callback("Could not run query, reason: " + error);
          return;
        }

        callback(null, count);
      });
    });
  };

  self.shift = function(callback)
  {
    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get " + self.collectionName + " collection, error: " + error);
        callback(error);
        return;
      }

      collection.find({}, { sort: self.sort, limit: 1 }, function(error, cursor)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not run query, reason: " + error);
          callback(error);
          return;
        }

        cursor.nextObject(function(error, queueItem)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not get object, reason: " + error.name);
            callback(error.name);
            return;
          }

          if (!queueItem)
          {
            callback(null, false);
            return;
          }

          collection.remove({ _id: queueItem._id }, function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Could not remove item from queue, reason: " + error.name);
              callback(error.name);
              return;
            }

            callback(null, queueItem._id, queueItem.item);
          });
        });
      });
    });
  };
};

exports.MurrixQueue = MurrixQueue;
