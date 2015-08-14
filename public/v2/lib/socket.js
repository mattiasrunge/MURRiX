"use strict";

define([
    "/socket.io/socket.io.js"
], function(socket) {
    var Me = function() {
        console.log("Connecting to MURRiX...");

        var connected = false;
        var established = false;
        var connection = socket.connect();

        connection.on("connect", function() {
            console.log("Connected to backend!");
            connected = true;
        });

        connection.on("reconnect", function() {
            console.log("Reconnected to backend!");
            connected = true;
        });

        connection.on("connect_error", function(error) {
            console.error("Error when connecting to backend, ", error);
            connected = false;
        });

        connection.on("reconnect_error", function(error) {
            console.error("Error when reconnecting to backend, ", error);
            connected = false;
        });

        connection.on("reconnect_failed", function(error) {
            console.error("Failed to reconnect to backend, ", error);
            connected = false;
        });

        connection.on("connect_timeout", function(error) {
            console.error("Connection to backend timed out, ", error);
            connected = false;
        });

        connection.on("connection_established", function(data) {
            established = data;
        }.bind(this));

        this.on = function(name, callback) {
            connection.on(name, callback);

            if (name === "connect" && connected) {
                callback();
            }

            if (name === "connection_established" && established) {
                callback(established);
            }
        };

        this.off = function(name, callback) {
            connection.removeListener(name, callback);
        };

        this.emit = function(name, data, callback) {
            connection.emit(name, data, callback);
        };
    };

    return new Me();
});
