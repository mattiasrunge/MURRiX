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
            this.loading = notification.loadObservable("component/node_overview", false); // TODO: Dispose!
            this.listWho = ko.observableArray();
            this.listShowing = ko.observableArray();
            this.node = ko.pureComputed(function() {
                return ko.unwrap(params.node);
            });

            this.loadWho = function() {
                this.loading(true);
                this.listWho.removeAll();

                socket.emit("helper_nodeGetWhoSuggestions", { nodeId: this.node()._id }, function(error, nodeIdList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    console.log("node who suggestions", nodeIdList);

                    this.loading(true);

                    socket.emit("find", { query: { _id: { $in: nodeIdList } }, options: { collection: "nodes" } }, function(error, nodeDataList) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        console.log("find who", nodeDataList);
                        this.listWho(nodeDataList);
                    }.bind(this));
                }.bind(this));
            }.bind(this);

            this.loadShowing = function() {
                this.loading(true);
                this.listWho.removeAll();

                socket.emit("helper_nodeGetShowingSuggestions", { nodeId: this.node()._id }, function(error, nodeIdList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    console.log("node showing suggestions", nodeIdList);

                    this.loading(true);

                    socket.emit("find", { query: { _id: { $in: nodeIdList } }, options: { collection: "nodes" } }, function(error, nodeDataList) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        console.log("find showing", nodeDataList);
                        this.listShowing(nodeDataList);
                    }.bind(this));
                }.bind(this));
            }.bind(this);

            this.load = function() {
                this.loadWho();
                this.loadShowing();
            }.bind(this);

            var s = this.node.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});
