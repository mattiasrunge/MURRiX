
define([
  "zone",
  "text!./index.html",
  "notification",
  "knockout",
  "moment",
  "murrix"
], function(zone, template, notification, ko, moment, murrix) {
  return zone({
    template: template,
    route: "/timeline",
    transition: "entrance-in",
    onInit: function() {
      this.model.loading = ko.observable(false);
      this.model.commentText = ko.observable("");
      this.model.node = murrix.node;
      this.model.list = ko.observableArray();
      this.model.title = ko.observable("Timeline");
      this.model.type = ko.observable("node");
    },
    onLoad: function(d, args) {
      this.model.loading(true);
      this.model.list.removeAll();

      murrix.server.emit("item.find", { query: { _parents: args.nodeId, what: { $in: [ 'file', 'text' ] } } }, function(error, itemDataList) {
        this.model.loading(false);

        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        itemDataList.sort(function(a, b) {
          if (!a.when) {
            return -1;
          } else if (!b.when) {
            return 1;
          } else if (a.when.timestamp === b.when.timestamp) {
            return 0;
          } else if (!a.when.timestamp) {
            return -1;
          } else if (!b.when.timestamp) {
            return 1;
          }
          
          var offset = Math.abs(Math.min(a.when.timestamp, b.when.timestamp));
          return (offset + a.when.timestamp) - (offset + b.when.timestamp);
        });
        
        var timestampList = {};
        var ordinaryList = [];

        for (var n = 0; n < itemDataList.length; n++) {
          var key = "Unknown date";
          var sortKey = "0";
          
          if (itemDataList[n].when !== false && itemDataList[n].when !== null && itemDataList[n].when.timestamp !== false && itemDataList[n].when.timestamp !== null) {
            var time = moment.utc(itemDataList[n].when.timestamp * 1000).local();
            key = time.format("dddd, MMMM Do YYYY");
            sortKey = time.format("YYYYMMDD");
          }
          
          timestampList[key] = timestampList[key] || {};
          timestampList[key].date = key;
          timestampList[key].sortKey = sortKey;
          timestampList[key].texts = timestampList[key].texts || [];
          timestampList[key].files = timestampList[key].files || [];
          
          if (itemDataList[n].what === "file") {
            itemDataList[n].url = "/media/" + itemDataList[n]._id + "/image/80/80?";
            
            if (itemDataList[n].angle) {
              itemDataList[n].url += "angle=" + itemDataList[n].angle + "&";
            }
            
            if (itemDataList[n].mirror) {
              itemDataList[n].url += "mirror=true&";
            }
            
            if (itemDataList[n].exif.Compression === "dvsd") {
              itemDataList[n].url += "deinterlace=true&";
            }
            
            if (itemDataList[n].thumbPosition) {
              itemDataList[n].url += "timeindex=" + itemDataList[n].thumbPosition + "&";
            }

            timestampList[key].files.push(itemDataList[n]);
          } else if (itemDataList[n].what === "text") {
            timestampList[key].texts.push(itemDataList[n]);
          }
        }
        
        for (var key in timestampList) {
          ordinaryList.push(timestampList[key]);
        }
        
        ordinaryList.sort(function(a, b) {
          if (a.sortKey < b.sortKey) {
            return -1;
          } else if (a.sortKey > b.sortKey) {
            return 1;
          }
          
          return 0;
        });

        this.model.list(ordinaryList);
        d.resolve();
      }.bind(this));
    }
  });
});
