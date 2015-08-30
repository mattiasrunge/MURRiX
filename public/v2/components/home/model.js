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
            this.visited = ko.observableArray(); // TODO
            this.section = ko.pureComputed(function() {
                return location.current().section;
            });
        }
    };
});
