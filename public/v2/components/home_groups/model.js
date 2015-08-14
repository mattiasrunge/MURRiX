"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket",
    "lib/location"
], function(template, ko, notification, socket, location) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/home_groups", false); // TODO: Dispose!
            this.list = ko.observableArray();
            this.group = ko.observable(false);
            this.id = ko.pureComputed(function() {
                return ko.unwrap(location.current().groupId);
            });

            this.load = function() {
                socket.emit("findGroups", { options: { sort: [ 'name' ] }}, function(error, groupDataList) {
                    if (error) {
                        notification.error(error);
                        return;
                    }

                    var list = Object.keys(groupDataList).map(function(id) {
                        return groupDataList[id];
                    });

                    this.list(list);
                    this.group(false);

                    if (this.id()) {
                        this.group(groupDataList[this.id()]);
                    }
                }.bind(this));
            }.bind(this);

            this.deleteGroup = function(data) {
                if (confirm("Are you sure you want to delete " + data.name + "?")) {
                    socket.emit("removeGroup", data._id, function(error) {
                        if (error) {
                            notification.error(error);
                            return;
                        }

                        this.load();
                    }.bind(this));
                }
            }.bind(this);

            this.createHandler = function(data) {
                location.goto({ groupId: data._id });
                this.load();
            }.bind(this);

            this.updateHandler = function(data) {
                this.load();
            }.bind(this);

            this.load();

            var s = this.id.subscribe(function() {
                this.group(this.list().filter(function(group) {
                    return group._id === this.id();
                }.bind(this))[0] || false);
            }.bind(this));

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});


