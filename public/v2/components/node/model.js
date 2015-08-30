"use strict";

define([
    "text!./template.html",
    "knockout",
    "jquery",
    "lib/location",
    "lib/socket",
    "lib/notification"
], function(template, ko, $, location, socket, notification) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/node", false); // TODO: Dispose!
            this.node = ko.observable(false);
            this.section = ko.pureComputed(function() {
                return location.current().section;
            });
            this.nodeId = ko.pureComputed(function() {
                return ko.unwrap(location.current().nodeId);
            });

            this.load = function() {
                this.loading(true);

                socket.emit("find", { query: { _id: this.nodeId() }, options: { collection: "nodes" } }, function(error, nodeDataList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    console.log("find node", nodeDataList);

                    if (nodeDataList.length === 0) {
                        this.node(false);
                        notification.error("No such node found!");
                        return;
                    }

                    this.node(nodeDataList[0]);
                }.bind(this));
            }.bind(this);

            this.load();
            var s = this.nodeId.subscribe(function() {
                this.load();
            }.bind(this));

            this.dispose = function() {
                s.dispose();
            }
        }
    };
});
