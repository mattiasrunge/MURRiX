
define([
  "zone",
  "notification",
  "router",
  "text!./index.html",
  "./recent/index",
  "./name/index",
  "./label/index",
  "./year/index",
  "./profile/index",
  "./settings/index",
  "./users/index",
  "./groups/index",
  "ko-ext",
  "bootstrap", 
  "murrix",
  "when"
], function(zone, notification, router, template, ZoneRecent, ZoneName, ZoneLabel, ZoneYear, ZoneProfile, ZoneSettings, ZoneUsers, ZoneGroups, ko, bootstrap, murrix, when) {
  return zone({
    template: template,
    route: "/home",
    zones: [ ZoneRecent, ZoneName, ZoneYear, ZoneLabel, ZoneProfile, ZoneSettings, ZoneUsers, ZoneGroups ],
    onInit: function() {
      this.model.user = murrix.user;
      this.model.userNode = murrix.userNode;
      this.model.visited = ko.observableArray();
      
      this.model.searchLinks = ko.computed(function() {
        return this.model.zones().filter(function(element) {
          return element.model.type && element.model.type() === "search";
        }).map(function(element) {
          return {
            active: element.model.active,
            path: element.model.path,
            icon: element.model.icon,
            title: element.model.title
          };
        });
      }.bind(this));
      
      this.model.adminLinks = ko.computed(function() {
        return this.model.zones().filter(function(element) {
          return element.model.type && element.model.type() === "admin";
        }).map(function(element) {
          return {
            active: element.model.active,
            path: element.model.path,
            icon: element.model.icon,
            title: element.model.title
          };
        });
      }.bind(this));
    },
    onLoad: function(d, args) {
      if (murrix.user() === false) {
        d.resolve({ "redirect": "/signin" });
        return;
      }
      
      function loadVisited(d) {
        var ids = [];
        
        if (murrix.user() !== false && murrix.user()._visited) {
          ids = murrix.user()._visited;
        }
        
        if (ids.length === 0) {
          d.resolve();
          return;
        }
        
        murrix.server.emit("node.find", { query: { _id: { $in: ids } } }, function(error, nodeDataList) {
          if (error) {
            notification.error(error);
            d.reject(error);
            return;
          }

          var nodeList = nodeDataList.filter(function(element) {
            return ids.indexOf(element._id) !== -1;
          });

          this.model.visited(nodeList);
          d.resolve();
        }.bind(this));
      }
      
      murrix.user.subscribe(function(value) {
        var d = when.defer();
        
        loadVisited.bind(this)(d);
        
        d.promise.catch(function(error) {
          notification.error(error);
        });
      }.bind(this));
    
      loadVisited.bind(this)(d);
    }
  });
});
