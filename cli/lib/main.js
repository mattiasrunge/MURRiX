"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io").client;
const session = require("./session");
const shell = require("./shell");

module.exports = {
    start: co(function*(args) {
        args.sessionId = yield session.readSessionId();

        yield api.connect(args, (status, message) => {
            if (status === "timeout") {
                console.error(message);
                process.exit(255);
            } else if (status === "disconnect") {
                console.error("Disconnected from server, will attempt to reconnect...");
            } else if (status === "reconnect") {
                // If the session was new this time the header we reconnected with
                // will be wrong and a new session will be created
                session.init()
                .then(() => {
                    console.log("Reconnected to server.");
                })
                .catch((error) => {
                    console.error("Failed to reinitialize session");
                    console.error(error);
                    process.exit(255);
                });
            }
        });
        yield session.init();
        yield shell.start();
    }),
    stop: co(function*() {
        console.log("Received shutdown signal, stoppping...");
        yield api.disconnect();
    })
};
