
function MurrixQueue(murrix, name, sort)
{
  var self = this;

  self.name = "queue";
  self.collectionName = "queue_" + name;
  self.items = [];
//   self.sort = [ "timestamp" ];
//
//   if (sort)
//   {
//     for (var n = 0; n < sort.length; n++)
//     {
//       self.sort.unshift("item." + sort[n]);
//     }
//   }

  self.sync = function(callback)
  {
    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get " + self.collectionName + " collection, error: " + error);
        callback("Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      collection.find({}, function(error, cursor)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not run query, reason: " + error);
          callback("Could not run query, reason: " + error);
          return;
        }

        var list = [];

        cursor.each(function(error, data)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not run query, reason: " + error.name);
            callback("Could not run query, reason: " + error.name);
            return;
          }

          if (data)
          {
            list.push(data);
          }
          else
          {
            self.items = list;
            self._sort();
            callback();
          }
        });
      });
    });
  };

  self._sort = function()
  {
    self.items.sort(function(a, b)
    {
      // TODO: The item.type specifics should be an inparameter of some kind
      if (a.item.type === b.item.type)
      {
        return b.timestamp - a.timestamp;
      }

      return -murrix.utils.natcasecmp(b.item.type, a.item.type);
    });
  };

  self.push = function(id, item)
  {
    var queueItem = {};
    queueItem._id = id;
    queueItem.timestamp = murrix.utils.timestamp();
    queueItem.item = item;

    self.items.push(queueItem);
    self._sort();

    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      collection.save(queueItem, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not run query, reason: " + error);
          return;
        }
      });
    });
  };

  self.exists = function(id)
  {
    for (var n = 0; n < self.items.length; n++)
    {
      if (self.items[n]._id === id)
      {
        return true;
      }
    }

    return false;
  };

  self.size = function()
  {
    return self.items.length;
  };

  self.shift = function()
  {
    var queueItem = self.items.shift();
    self._sort();

    murrix.db.mongoDb.collection(self.collectionName, function(error, collection)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not get " + self.collectionName + " collection, error: " + error);
        return;
      }

      collection.remove({ _id: queueItem._id }, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not remove item from queue, reason: " + error.name);
          return;
        }
      });
    });

    return queueItem.item;
  };
}

exports.MurrixQueue = MurrixQueue;
