
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/location",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("nodeEdit");
      this.model.title = ko.observable("Location");
    }
  });
});
