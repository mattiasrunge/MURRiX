
var TagsModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "tags", title: "Browse tags" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.load = function(callback)
  {
    var reduce = "function(doc, prev) { for (var n in doc.tags) { prev[doc.tags[n]] = prev[doc.tags[n]] || 0; prev[doc.tags[n]]++; } }";

    murrix.server.emit("group", { options: { collection: "nodes", reduceFunction: reduce } }, function(error, result)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (result.length === 0)
      {
        callback(null, []);
        return;
      }

      var min = false;
      var max = false;
      var minFontSize = 10.0;
      var maxFontSize = 50.0;
      var tags = [];

      for (var tag in result[0])
      {
        min = min === false ? result[0][tag] : Math.min(min, result[0][tag]);
        max = max === false ? result[0][tag] : Math.max(max, result[0][tag]);
      }

      for (tag in result[0])
      {
        var size = minFontSize + (result[0][tag] / max) * (maxFontSize - minFontSize);

        tags.push({ name: tag, count: result[0][tag], size: size });
      }

      tags.sort(function(a, b)
      {
        return b.count - a.count;
      });

      callback(null, tags);
    });
  };
};
