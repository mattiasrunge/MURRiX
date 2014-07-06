
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/information",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("nodeEdit");
      this.model.title = ko.observable("Information");
      this.model.loading = ko.observable(false);
      this.model.motherId = ko.observable(false);
      this.model.fatherId = ko.observable(false);
      this.model.partnerId = ko.observable(false);
      this.model.homeId = ko.observable(false);
      
      this.model.submit = function() {
        
      }.bind(this);
      
      this.model.reset = function() {
        
      }.bind(this);
    }
  });
});
