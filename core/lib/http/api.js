"use strict";

const WebSocket = require("ws");
const cookie = require("cookie");
const log = require("../log")(module);
const bus = require("../core/bus");
const Client = require("./client");

const HEARTBEAT_MS = 30000;

class Api {
    constructor() {
        this.ws = null;
        this.interval = null;

        bus.on("*", async (event, data) => {
            if (!this.ws) {
                return;
            }

            if (event.startsWith("node.")) {
                this.ws.clients.forEach(({ client }) => client.sendEvent(event, data.node.path));
            }
        });
    }

    listen(server) {
        this.ws = new WebSocket.Server({ server });

        this.ws.on("connection", async (ws, req) => {
            try {
                const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};

                ws.client = await Client.create(ws, cookies);

                ws.client.clientReady();
            } catch (error) {
                log.error("Failed to create Client object for web socket connection", error);
                ws.terminate();
            }
        });

        this.interval = setInterval(() => {
            this.ws.clients.forEach(({ client }) => client.heartbeat());
        }, HEARTBEAT_MS);
    }

    async getClientByCookie(cookie) {
        const id = await Client.getIdFromCookie(cookie);

        return [ ...this.ws.clients ].map(({ client }) => client).find((client) => client.getId() === id);
    }

    close() {
        clearInterval(this.interval);

        this.interval = null;
    }
}

module.exports = new Api();
