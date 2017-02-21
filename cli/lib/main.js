"use strict";

const api = require("api.io").client;
const session = require("./session");
const shell = require("./shell");
const vorpal = require("./vorpal");

module.exports = {
    start: async (args) => {
        args.sessionId = await session.readSessionId();

        await api.connect(args, (status, message) => {
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
        await session.init();
        await shell.start();
    },
    stop: async () => {
        console.log("Received shutdown signal, stoppping...");
        await api.disconnect();
    }
};
