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
            this.nodeIdString = ko.pureComputed(function() {
                return location.current().nodeId;
            });

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
                    location.goto({ page: "node", nodeId: value });
                }
            });

            this.nodeIdString.subscribe(function(value) {
                this.nodeId(value || false);
            }.bind(this));

            this.nodeId(this.nodeIdString());
        }
    };
});
