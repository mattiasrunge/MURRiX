"use strict";

define([
    "knockout",
    "mfw/socket",
    "lib/bindings"
], function(ko, socket) {
    return function() {
        this.response = ko.observable(false);

        console.log("Sending Ping");
        socket.emit("echo", "pong", function(error, data) {
            if (error) {
                console.error(error);
                this.response(error);
                return;
            }

            console.log("Received " + data);
            this.response(data);
        }.bind(this));
    };
});
