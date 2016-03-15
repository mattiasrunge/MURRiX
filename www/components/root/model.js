"use strict";

const ko = require("knockout");
const socket = require("mfw/socket");
const co = require("co");

require("lib/bindings");

module.exports = function() {
    this.response = ko.observable(false);

    let test = co(function*() {
        return yield new Promise((resolve, reject) => {
            setTimeout(() => { resolve("after"); }, 1000);
        });
    });


    console.log("Sending Ping");
    socket.emit("session", { }, (error, data) =>{
        if (error) {
            console.error(error);
            this.response(error);
            return;
        }

        console.log("before");
        test().then((value) => { console.log(value); });

        console.log("Received " + data);
        this.response(data);

        socket.emit("list", { abspath: "/" }, (error, data) => {
            console.log(data);
        });
    });
};
