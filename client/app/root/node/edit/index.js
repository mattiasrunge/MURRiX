
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix",
  "./information/index",
  "./access/index",
  "./upload/index",
  "./location/index",
  "./people/index",
  "./time/index",
  "./todo/index"
], function(zone, template, ko, murrix, ZoneInformation, ZoneAccess, ZoneUpload, ZoneLocation, ZonePeople, ZoneTime, ZoneTodo) {
  return zone({
    template: template,
    route: "/edit",
    transition: "entrance-in",
    zones: [ ZoneInformation, ZoneAccess, ZoneUpload, ZoneLocation, ZonePeople, ZoneTime, ZoneTodo ],
    onInit: function() {
      this.model.title = ko.observable("Edit");
      this.model.type = ko.observable("node");
      
       this.model.editLinks = ko.computed(function() {
        return this.model.zones().filter(function(element) {
          return element.model.type && element.model.type() === "nodeEdit";
        }).map(function(element) {
          return {
            active: element.model.active,
            path: element.model.activePath,
            title: element.model.title
          };
        });
      }.bind(this));
    }
  });
});
