"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket"
], function(template, ko, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/user_list", false); // TODO: Dispose!
            this.users = ko.observableArray();
            this.groupId = ko.pureComputed(function() {
                return ko.unwrap(params.groupId);
            });

            this.load = function() {
                this.loading(true);
                this.users.removeAll();

                socket.emit("findUsers", { query: { _groups: ko.unwrap(params.groupId) } }, function(error, userDataList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    var list = Object.keys(userDataList).map(function(id) {
                        return userDataList[id];
                    });

                    this.users(list);
                }.bind(this));
            }.bind(this);

            var s = this.groupId.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});
