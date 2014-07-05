
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/settings",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("admin");
      this.model.title = ko.observable("Settings");
      this.model.icon = ko.observable("fa-cog");
    },
    onLoad: function(d, args) {
      d.resolve();
    }
  });
});
