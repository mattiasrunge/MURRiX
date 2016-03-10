"use strict";

const url = require("url");
const socket = require("socket.io-client");
const co = require("bluebird").coroutine;

let io = null;

module.exports = {
    connected: false,
    url: "",
    hostname: "",
    port: 0,
    connect: (uri) => {
        let parsed = url.parse(uri);

        module.exports.url = uri;
        module.exports.hostname = parsed.hostname;
        module.exports.port = parsed.port;

        return new Promise((resolve, reject) => {
            io = socket(module.exports.url);

            io.on("connect", () => {
                module.exports.connected = true;
                resolve();
            });

            io.on("connect_error", (error) => {
                module.exports.connected = false;
                reject("Error while connecting to " + module.exports.url + ", " + error);
            });

            io.on("connect_timeout", () => {
                module.exports.connected = false;
                reject("Connection timed out while connecting to " + module.exports.url);
            });

            io.on("disconnect", () => {
                module.exports.connected = false;
                console.error("\nDisconnected from server...".red);
            });
        });
    },
    call: (method, args) => {
        return new Promise((resolve, reject) => {
            if (!module.exports.connected) {
                return reject("Not connected");
            }

            io.emit(method, args || [], (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            });
        });
    },
    stop: co(function*() {
        io.close();
    })
};
