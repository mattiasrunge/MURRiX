
var TagsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.tags = ko.observableArray();
  self.loading = ko.observable(false);
  self.errorText = ko.observable("");

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "tags"))
    {
      self.show(value.action === "tags");
    }
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self._load();
    }
  });

  self._load = function()
  {
    var reduce = "function(doc, prev) { for (var n in doc.tags) { prev[doc.tags[n]] = prev[doc.tags[n]] || 0; prev[doc.tags[n]]++; } }";

    self.loading(true);
    self.errorText("");
    self.tags.removeAll();

    murrix.server.emit("group", { reduce: reduce, options: { collection: "nodes"} }, function(error, result)
    {
      self.loading(false);

      if (error)
      {
        self.errorText(error);
        return;
      }

      if (result.length === 0)
      {
        return;
      }

      var min = false;
      var max = false;

      for (var tag in result[0])
      {
        if (min === false)
        {
          min = result[0][tag];
        }
        else
        {
          min = Math.min(min, result[0][tag]);
        }

        if (max === false)
        {
          max = result[0][tag];
        }
        else
        {
          max = Math.max(max, result[0][tag]);
        }
      }

      var minFontSize = 10.0;
      var maxFontSize = 50.0;

      var tags = [];

      for (var tag in result[0])
      {
        var size = minFontSize + (result[0][tag] / max) * (maxFontSize - minFontSize);

        tags.push({ name: tag, count: result[0][tag], size: size });
      }

      tags.sort(function(a, b)
      {
        return b.count - a.count;
      });

      self.tags(tags);
    });
  };
};
