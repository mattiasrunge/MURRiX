
"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/location",
    "lib/notification",
    "lib/socket"
], function(template, ko, location, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/group_list", false); // TODO: Dispose!
            this.groups = ko.observableArray();
            this.idList = ko.pureComputed(function() {
                return ko.unwrap(params.idList);
            });

            this.load = function() {
                this.groups.removeAll();

                if (this.idList().length === 0) {
                    return;
                }

                this.loading(true);

                socket.emit("findGroups", { query: { _id: { $in: this.idList() } } }, function(error, groupDataList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    groupDataList = Object.keys(groupDataList).map(function(id) {
                        return groupDataList[id];
                    });

                    console.log("find result", groupDataList);
                    this.groups(groupDataList);
                }.bind(this));
            }.bind(this);

            var s = this.idList.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});
