"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io").client;
const session = require("./session");
const shell = require("./shell");
const vorpal = require("./vorpal");

module.exports = {
    start: co(function*(args) {
        args.sessionId = yield session.readSessionId();

        yield api.connect(args, (status, message) => {
            if (status === "timeout") {
                console.error(message);
                process.exit(255);
            } else if (status === "disconnect") {
                let message = "Disconnected from server, will attempt to reconnect...";

                if (vorpal) {
                    vorpal.log(message.red);
                } else {
                    console.error(message);
                }
            } else if (status === "reconnect") {
                // If the session was new this time the header we reconnected with
                // will be wrong and a new session will be created
                session.init()
                .then(() => {
                    let message = "Reconnected to server.";

                    if (vorpal) {
                        vorpal.log(message.green);
                    } else {
                        console.log(message);
                    }
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
