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
            this.loading = notification.loadObservable("component/home_users", false); // TODO: Dispose!
            this.list = ko.observableArray();
            this.user = ko.observable(false);
            this.id = ko.pureComputed(function() {
                return ko.unwrap(location.current().userId);
            });

            this.load = function() {
                socket.emit("findUsers", { options: { sort: [ 'name' ] }}, function(error, userDataList) {
                    if (error) {
                        notification.error(error);
                        return;
                    }

                    var list = Object.keys(userDataList).map(function(id) {
                        return userDataList[id];
                    });

                    this.list(list);
                    this.user(false);

                    if (this.id()) {
                        this.user(userDataList[this.id()]);
                    }
                }.bind(this));
            }.bind(this);

            this.deleteUser = function(data) {
                if (confirm("Are you sure you want to delete " + data.name + "?")) {
                    socket.emit("removeUser", data._id, function(error) {
                        if (error) {
                            notification.error(error);
                            return;
                        }

                        this.load();
                    }.bind(this));
                }
            }.bind(this);

            this.createHandler = function(data) {
                location.goto({ userId: data._id });
                this.load();
            }.bind(this);

            this.updateHandler = function(data) {
                this.load();
            }.bind(this);

            this.load();

            var s = this.id.subscribe(function() {
                this.user(this.list().filter(function(user) {
                    return user._id === this.id();
                }.bind(this))[0] || false);
            }.bind(this));

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});

