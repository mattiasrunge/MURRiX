"use strict";

const WebSocket = require("ws");
const cookie = require("cookie");
const log = require("../lib/log")(module);
const bus = require("../bus");
const HttpClient = require("./HttpClient");
const mb = require("../mb");

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
                this.ws.clients.forEach(({ httpClient }) => {
                    if (!httpClient.client.isGuest()) {
                        // TODO: Check if user has access
                        httpClient.sendEvent(event, {
                            path: data.node.path,
                            extra: data.extra
                        });
                    }
                });
            }
        });
    }

    async _sessionUpdated({ id }) {
        const httpClient = await this.getClientById(id);

        if (httpClient) {
            await httpClient.sessionUpdated();
        }
    }

    listen(server) {
        mb.on("session-updated", this._sessionUpdated.bind(this));

        this.ws = new WebSocket.Server({ server });

        this.ws.on("connection", async (ws, req) => {
            try {
                const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
                const sessionId = cookies[HttpClient.COOKIE_NAME];

                ws.httpClient = await HttpClient.create(ws, sessionId);

                ws.httpClient.clientReady();
            } catch (error) {
                log.error("Failed to create Client object for web socket connection", error);
                ws.terminate();
            }
        });

        this.interval = setInterval(() => {
            this.ws.clients.forEach(({ httpClient }) => httpClient.heartbeat());
        }, HEARTBEAT_MS);
    }

    async getClientById(id) {
        return [ ...this.ws.clients ].map(({ httpClient }) => httpClient).find((hc) => hc.client.getId() === id);
    }

    close() {
        clearInterval(this.interval);

        this.interval = null;
    }
}

module.exports = new Api();
