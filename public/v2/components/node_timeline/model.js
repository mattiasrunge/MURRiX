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

                    socket.emit("helper_nodeGetTimelineList", { nodeId: this.node()._id }, function(error, timeline) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        console.log("find timeline", timeline);

                        var hash = {};
                        var list = [];

                        for (var n = 0; n < timeline.length; n++) {
                            if (timeline[n].datestamp) {
                                timeline[n].datestamp[1]++; // We get 0-11, but want 1-12
                                timeline[n].even = n % 2 === 0;
                                timeline[n].imagesExpanded = ko.observable(false);

                                var id = timeline[n].datestamp[0] + "-" + timeline[n].datestamp[1];


                                if (!hash[id]) {
                                    hash[id] = {
                                        year: timeline[n].datestamp[0],
                                        month: timeline[n].datestamp[1],
                                        items: []
                                    };

                                    list.push(hash[id]);
                                }

                                hash[id].items.push(timeline[n]);
                            }
                        }

                        console.log("timeline", list);
                        this.list(list);
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
