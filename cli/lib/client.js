"use strict";

const url = require("url");
const socket = require("socket.io-client");
const co = require("bluebird").coroutine;

let io = null;

module.exports = {
    connected: false,
    hostname: "",
    port: 0,
    init: co(function*(config) {
        module.exports.hostname = config.hostname;
        module.exports.port = config.port;

        yield module.exports.connect();

        console.log(("Successfully connected to " + config.hostname + ":" + config.port).green + "\n");
    }),
    connect: () => {
        return new Promise((resolve, reject) => {
            let url = "ws://" + module.exports.hostname + ":" + module.exports.port;

            io = socket(url);

            io.on("connect", () => {
                module.exports.connected = true;
                resolve();
            });

            io.on("connect_error", (error) => {
                module.exports.connected = false;
                reject("Error while connecting to " + url + ", " + error);
            });

            io.on("connect_timeout", () => {
                module.exports.connected = false;
                reject("Connection timed out while connecting to " + url);
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
