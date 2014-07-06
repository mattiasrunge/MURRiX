﻿
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/map",
     onInit: function() {
      this.model.title = ko.observable("Map");
      this.model.type = ko.observable("node");
    }
  });
});
