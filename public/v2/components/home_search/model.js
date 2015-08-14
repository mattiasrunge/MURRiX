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
            this.loading = notification.loadObservable("component/home_search", false); // TODO: Dispose!
            this.queryString = ko.observable("");
            this.list = ko.observableArray();
            this.type = ko.pureComputed(function() {
                return location.current().type;
            });

            this.query = ko.pureComputed(function() {
                return location.current().query;
            });

            this.submit = function() {
                location.goto({ query: this.queryString() });
            }.bind(this);

            this.load = function() {
                this.queryString(this.query() || "");
                this.list.removeAll();

                if (this.query()) {
                    this.loading(true);

                    socket.emit("helper_nodeSearch", { query: this.query(), types: [ "album", "person", "location", "camera", "vechicle" ] }, function(error, nodeDataList) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        console.log("find result", nodeDataList);
                        this.list(nodeDataList.nodeDataList);
                    }.bind(this));
                }
            }.bind(this);

            var s1 = this.query.subscribe(this.load);

            this.load();

            this.dispose = function() {
                s1.dispose();
            };
        }
    };
});
