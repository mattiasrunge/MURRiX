
define([
  "widget",
  "text!./index.html",
  "notification",
  "jquery",
  "knockout",
  "typeahead",
  "murrix"
], function(widget, template, notification, $, ko, typeahead, murrix) {
  widget({
    template: template,
    name: "nodeSelect",
    onCreate: function(settings) {
      settings.limit = settings.limit || 10;
      
      this.model.disable = ko.computed(function() {
        return settings.disable() || murrix.user() === false; 
      });
      this.model.placeholder = ko.observable(ko.unwrap(settings.placeholder));
      this.model.value = ko.observable("");
      this.model.valid = ko.observable(false);
      this.model.focus = ko.observable(false);
      this.model.bold = ko.computed(function() {
        return !this.model.focus() && this.model.valid() && this.model.value() !== "";
      }.bind(this));
      
      var options = {
        items:  settings.limit,
        source: function(queryString, callback) {
          var query = { name: { $regex: ".*" + queryString + ".*", $options: "-i" } };

          if (settings.types && settings.types.length > 0) {
            query.type = { $in: settings.types };
          }

          murrix.server.emit("node.find", { query: query, limit: settings.limit, profilePicture: true }, function(error, nodeDataList) {
            if (error) {
              notification.error(error);
              callback([]);
              return;
            }

            nodeDataList = nodeDataList.map(function(element) {
              element.toString = function() { return this._id; };
              return element;
            });
            
            callback(nodeDataList);
          });
        },
        updater: function(key) {
//           if (settings.id() === key) {
//             settings.id.valueHasMutated();
//           } else {
            settings.id(key);
//           }

          return this.model.value();
        }.bind(this),
        sorter: function(items) {
          return items;
        },
        matcher: function(nodeData) {
          return ~nodeData.name.toLowerCase().indexOf(this.query.toLowerCase());
        },
        highlighter: function(nodeData) {
          var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
          var name = nodeData.name.replace(new RegExp("(" + query + ")", "ig"), function($1, match) {
            return "<strong>" + match + "</strong>";
          });

          var url = "http://placekitten.com/g/32/32";

          if (nodeData._profilePicture) {
            url = "/media/" + nodeData.profilePictureInfo.id + "/image/80/80?angle=" + nodeData.profilePictureInfo.angle + "&mirror=" + nodeData.profilePictureInfo.mirror;
          }
          
          return "<div><img style='margin-right: 20px; width: 32px; height: 32px;' class='pull-left' src='" + url + "'/><span style='padding: 6px; display: inline-block;'>" + name + "</span></div>";
        }
      };
      
      var setValid = function() {
        if (settings.id() !== false) {
          var query = { _id: settings.id() };

          murrix.server.emit("node.find", { query: query }, function(error, nodeDataList) {
            if (error) {
              notification.error(error);
              return
            }

            if (nodeDataList.length === 0) {
              console.log("No match found");
              return;
            }

            this.model.value(nodeDataList[0].name);
            this.model.valid(true);
          }.bind(this));
        } else {
          this.model.value("");
        }
      }.bind(this);

      this.subscriptions.push(this.model.focus.subscribe(function(value) {
        if (!value) {
          if (this.model.value() === "") {
            settings.id(false);
            return;
          } else {
            setValid();
          }
        }
      }.bind(this)));

      this.subscriptions.push(settings.id.subscribe(function(value) {
        setValid();
      }));

      setValid();
      
      $(this.element).typeahead(options);
    },
    onDestroy: function() {
      $(this.element).typeahead("destroy");
    }
  });
});
