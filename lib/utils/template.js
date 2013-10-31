
var path = require("path");
var fs = require("fs");

exports.actions = [
  {
    tag: "include",
    filter: function(data, options)
    {
      if (data.indexOf("#") === 0)
      {
        return "<!-- '" + data.substr(1) + "' not included -->";
      }

      try
      {
        return fs.readFileSync(options.dirname + data, "utf8");
      }
      catch (e)
      {
        return "<!-- " + e + " -->";
      }
    }
  },
  {
    tag: "link",
    filter: function(data, options)
    {
      if (data.indexOf("#") === 0)
      {
        return "<!-- '" + data.substr(1) + "' not linked -->";
      }

      try
      {
        var stat = fs.statSync(options.dirname + data);

        return data + "?v=" + ((new Date(stat.mtime)).getTime() / 1000);
      }
      catch (e)
      {
        return "<!-- " + e + " -->";
      }
    }
  }
];

exports.compile = function(template, callback)
{
  var options = { dirname: path.dirname(template) + "/" };

  fs.readFile(template, "utf8", function(error, data)
  {
    if (error)
    {
      callback(error);
      return;
    }

    for (var n = 0; n < exports.actions.length; n++)
    {
      var re = new RegExp("\\{\\{" + exports.actions[n].tag + ":(.+?)\\}\\}", "g");

      data = data.replace(re, function(full_match, matched)
      {
        return exports.actions[n].filter(matched, options);
      });
    }

    callback(null, data);
  });

};
