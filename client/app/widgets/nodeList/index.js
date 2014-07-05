
define([
  "widget",
  "text!./index.html",
  "knockout",
  "tpl!./nodeListItem.html"
], function(widget, template, ko) {
  widget({
    template: template,
    name: "nodeList",
    onCreate: function(settings) {
      this.model.list = settings.list;
      this.model.listAlbum = ko.computed(function() {
        return this.model.list().filter(function(element) {
          return element.type === "album";
        });
      }.bind(this));
      this.model.listPerson = ko.computed(function() {
        return this.model.list().filter(function(element) {
          return element.type === "person";
        });
      }.bind(this));
      this.model.listLocation = ko.computed(function() {
        return this.model.list().filter(function(element) {
          return element.type === "location";
        });
      }.bind(this));
      this.model.listCamera = ko.computed(function() {
        return this.model.list().filter(function(element) {
          return element.type === "camera";
        });
      }.bind(this));
      this.model.listVehicle = ko.computed(function() {
        return this.model.list().filter(function(element) {
          return element.type === "vehicle";
        });
      }.bind(this));
      this.model.selected = ko.observable("all");
      
      this.model.select = function(data) {
        this.model.selected(data);
      }.bind(this);
    }
  });
});
