
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/profile",
    transition: "entrance-in",
    onInit: function() {
      this.model.loading = ko.observable(false);
      this.model.user = murrix.user;
    }
  });
});
