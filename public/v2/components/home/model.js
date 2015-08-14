"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/user",
    "lib/location"
], function(template, ko, user, location) {
    return {
        template: template,
        viewModel: function(params) {
            this.user = user.user;
            this.visited = ko.observableArray();
            this.section = ko.pureComputed(function() {
                return location.current().section;
            });

            this.searchLinks = ko.pureComputed(function() {
                return [];
//                 return this.zones().filter(function(element) {
//                     return element.model.type && element.model.type() === "search";
//                 }).map(function(element) {
//                     return {
//                         active: element.model.active,
//                         path: element.model.path,
//                         icon: element.model.icon,
//                         title: element.model.title
//                     };
//                 });
            }.bind(this));

            this.adminLinks = ko.pureComputed(function() {
                return [];
//                 return this.zones().filter(function(element) {
//                     return element.model.type && element.model.type() === "admin";
//                 }).map(function(element) {
//                     return {
//                         active: element.model.active,
//                         path: element.model.path,
//                         icon: element.model.icon,
//                         title: element.model.title
//                     };
//                 });
            }.bind(this));
        }
    };
});
