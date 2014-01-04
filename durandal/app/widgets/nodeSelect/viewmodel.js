
define(['jquery', 'knockout', 'typeahead', 'murrix'], function($, ko, typeahead, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.disable = ko.computed(function()
    {
      return settings.disable() || murrix.user() === false; 
    });
    self.placeholder = ko.observable(settings.placeholder);
    self.value = ko.observable("");
    self.valid = ko.observable(false);
    self.focus = ko.observable(false);
    self.bold = ko.computed(function()
    {
      return !self.focus() && self.valid() && self.value() !== "";
    });

    settings.limit = settings.limit || 10;

    var options = {
      items:  settings.limit,
      source: function(queryString, callback)
      {
        var query = { name: { $regex: ".*" + queryString + ".*", $options: "-i" } };

        if (settings.types && settings.types.length > 0)
        {
          query.type = { $in: settings.types };
        }

        murrix.server.emit("node.find", { query: query, limit:  settings.limit, profilePicture: true }, function(error, nodeDataList)
        {
          if (error)
          {
            console.log(error);
            callback([]);
            return;
          }

          var toString = function() { return this._id; };

          for (var n = 0; n < nodeDataList.length; n++)
          {
            nodeDataList[n].toString = toString;
          }

          callback(nodeDataList);
        });
      },
      updater: function(key)
      {
//         if (settings.id() === key)
//         {
//           settings.id.valueHasMutated();
//         }
//         else
        {
          settings.id(key);
        }

        return self.value();
      },
      sorter: function(items)
      {
        return items;
      },
      matcher: function(nodeData)
      {
        return ~nodeData.name.toLowerCase().indexOf(this.query.toLowerCase());
      },
      highlighter: function(nodeData)
      {
        var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
        var name = nodeData.name.replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
        {
          return "<strong>" + match + "</strong>";
        });

        var url = "http://placekitten.com/g/32/32";

        if (nodeData._profilePicture)
        {
          url = "/media/" + nodeData.profilePictureInfo.id + "/image/80/80?angle=" + nodeData.profilePictureInfo.angle + "&mirror=" + nodeData.profilePictureInfo.mirror;
        }
        
        return "<div><img style='margin-right: 20px; width: 32px; height: 32px;' class='pull-left' src='" + url + "'/><span style='padding: 6px; display: inline-block;'>" + name + "</span></div>";
      }
    };

    $(settings.child).typeahead(options);

    self.focus.subscribe(function(value)
    {
      if (!value)
      {
        if (self.value() === "")
        {
          settings.id(false);
          return;
        }
        else
        {
          setValid();
        }
      }
    });

    settings.id.subscribe(function(value)
    {
      setValid();
    });

    setValid();

    function setValid()
    {
      if (settings.id() !== false)
      {
        var query = { _id: settings.id() };

        murrix.server.emit("node.find", { query: query }, function(error, nodeDataList)
        {
          if (error)
          {
            console.log(error);
            return
          }

          if (nodeDataList.length === 0)
          {
            console.log("No match found");
            return;
          }

          self.value(nodeDataList[0].name);
          self.valid(true);
        });
      }
      else
      {
        self.value("");
      }
    }
  };

  return ctor;
});
