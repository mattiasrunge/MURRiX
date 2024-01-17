import WebSocket from "ws";
import cookie from "cookie";
import bus from "../bus/index.mjs";
import HttpClient, { COOKIE_NAME } from "./HttpClient.mjs";
import mb from "../mb/index.mjs";

import { createLog } from "../lib/log.mjs";
const log = createLog(import.meta.url);

const HEARTBEAT_MS = 30_000;

class Api {
    constructor() {
        this.ws = null;
        this.interval = null;

        bus.on("*", async (event, data) => {
            if (!this.ws) {
                return;
            }

            if (event.startsWith("node.")) {
                for (const { httpClient } of this.ws.clients) {
                    if (!httpClient.client.isGuest()) {
                        // TODO: Check if user has access
                        httpClient.sendEvent(event, {
                            path: data.node.path,
                            extra: data.extra
                        });
                    }
                }
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
                const sessionId = cookies[COOKIE_NAME];

                ws.httpClient = await HttpClient.create(ws, sessionId);

                ws.httpClient.clientReady();
            } catch (error) {
                log.error("Failed to create Client object for web socket connection", error);
                ws.terminate();
            }
        });

        this.interval = setInterval(() => {
            for (const { httpClient } of this.ws.clients) { httpClient.heartbeat(); }
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

export default new Api();
