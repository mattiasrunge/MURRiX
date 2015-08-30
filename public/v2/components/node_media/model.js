"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/socket",
    "lib/notification",
    "lib/location"
], function(template, ko, socket, notification, location) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/node_media", false); // TODO: Dispose!
            this.list = ko.observableArray();
            this.node = ko.pureComputed(function() {
                return ko.unwrap(params.node);
            });
            this.itemId = ko.pureComputed(function() {
                return ko.unwrap(location.current().itemId) || false;
            });

            this.load = function() {
                this.list.removeAll();

                if (this.node()) {
                    this.loading(true);

                    socket.emit("helper_nodeGetFilesList", { nodeId: this.node()._id }, function(error, fileList) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        console.log("find files", fileList);
                        this.list(fileList);
                    }.bind(this));
                }
            }.bind(this);

            var s1 = this.node.subscribe(this.load);

            this.load();

            this.dispose = function() {
                s1.dispose();
            };
        }
    };
});
