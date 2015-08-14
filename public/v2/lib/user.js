"use strict";

define([
    "knockout",
    "lib/socket",
    "lib/notification"
], function(ko, socket, notification) {
    var Me = function() {
        this.user = ko.observable(false);
        this.loading = notification.loadObservable("lib/user", false);

        socket.on("connection_established", function(data) {
            if (data.userData) {
                console.log("Currently logged in as", data.userData);
                this.user(data.userData);
            }
        }.bind(this));

        this.login = function(username, password) {
            if (username === "" || password === "") {
                notification.error("Username and password must be entered!");
                return false;
            }

            this.loading(true);

            socket.emit("login", { username: username, password: password }, function(error, userData) {
                this.loading(false);

                if (error) {
                    notification.error(error);
                    return;
                }

                if (userData === false) {
                    notification.error("No such user found!");
                    return;
                }

                console.log("Logged in as", userData);
                this.user(userData);
            }.bind(this));
        }.bind(this);

        this.logout = function() {
            this.loading(true);

            socket.emit("logout", { }, function(error) {
                this.loading(false);

                if (error) {
                    notification.error(error);
                    return;
                }

                console.log("Logged out");
                this.user(false);
            }.bind(this));
        }.bind(this);
    };

    return new Me();
});
