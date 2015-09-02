"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/socket",
    "lib/notification",
    "lib/user",
    "lib/tools"
], function(template, ko, socket, notification, user, tools) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/node_import", false); // TODO: Dispose!
            this.list = ko.observableArray();
            this.node = ko.pureComputed(function() {
                return ko.unwrap(params.node);
            });

            this.load = function() {

            }.bind(this);

            var s = this.node.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});
