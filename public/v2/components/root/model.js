"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/location",
    "lib/user",
    "lib/notification"
], function(template, ko, location, user, notification) {
    return {
        template: template,
        viewModel: function(params) {
            this.user = user.user;
            this.loading = notification.loading;
            this.page = ko.observable(false);
            this.nodeId = ko.observable(false);
            this.item = ko.observable(false);
            this.nodeIdRaw = ko.observable(false);

            this.page = ko.pureComputed(function() {
                return location.current().page;
            });

            this.randomNode = function() {
    //             murrix.server.emit("node.random", {}, function(error, nodeData) {
    //             if (error) {
    //                 notification.error(error);
    //                 return;
    //             }
    //
    //             router.navigateTo("/node/" + nodeData._id);
    //             return;
    //             });
            }.bind(this);

            this.signout = function() {
                user.logout();
            }.bind(this);

            this.nodeId.subscribe(function(value) {
                console.log("nodeId", value);

                if (value) {
                    location.goto({ page: "node", id: value });
                }
            });

            this.nodeIdRaw.subscribe(function(value) {
                console.log("nodeIdRaw", value);
                this.nodeId(value);
            }.bind(this));
        }
    };
});
