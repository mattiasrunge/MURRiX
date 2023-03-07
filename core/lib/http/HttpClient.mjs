import assert from "node:assert";
import Typeson from "typeson";
import { v4 as uuid } from "uuid";
import TypesonBuiltin from "typeson-registry/dist/presets/builtin.js";
import { createLog } from "../lib/log.mjs";
import { api } from "../api/index.mjs";
import { Client } from "../auth/index.mjs";
import Terminal from "../terminal/index.mjs";
import ClientStream from "./Stream.mjs";

const log = createLog(import.meta.url);
const TSON = new Typeson().register([ TypesonBuiltin ]);
const COOKIE_NAME = "session";

class HttpClient {
    constructor(ws, client) {
        this.client = client;
        this.ws = ws;
        this.isAlive = true;

        this.ws.on("pong", this._onPong.bind(this));
        this.ws.on("message", this._onMessage.bind(this));
    }

    static async create(ws, sessionId) {
        // TODO: sessionMaxAge = 1000 * 60 * 60 * 24 * 7;
        // Session will live forever if not explicitly destroyed,
        // thus we need a timeout!
        const id = sessionId || uuid();

        assert(id !== "admin", "Invalid sessionId");

        const client = await Client.create(id);
        const httpClient = new HttpClient(ws, client);

        if (!sessionId || !httpClient.client.hasUser()) {
            await api.logout(httpClient.client);
            // TODO: Over rabbitmq! no user info returned, keep in redis!
        }

        return httpClient;
    }

    async clientReady() {
        await this.sendEvent("set-cookie", {
            name: COOKIE_NAME,
            value: this.client.getId()
        });

        return this.sendEvent("ready", {});
    }

    async sendEvent(event, data) {
        this.ws.send(TSON.stringify({
            type: "event",
            event,
            data
        }));
    }

    async sendResult(message, result) {
        this.ws.send(TSON.stringify({
            ...message,
            result
        }));
    }

    async sendError(message, error) {
        this.ws.send(TSON.stringify({
            ...message,
            error: {
                message: error.message,
                code: error.code,
                stack: error.stack
            }
        }));
    }

    heartbeat() {
        if (this.isAlive === false) {
            return this.ws.terminate();
        }

        this.isAlive = false;
        this.ws.ping(() => {});
    }

    _onPong() {
        this.isAlive = true;
    }

    async _onMessage(data) {
        try {
            const message = TSON.parse(data);

            // log.debug("Message received", message);

            this._handleMessage(message);
        } catch (error) {
            log.error("Failed to parse message", data, error);
        }
    }

    _onWrite(data) {
        this.ws.send(TSON.stringify({
            type: "term",
            data
        }));
    }

    _ensureTerminal() {
        if (!this.terminal) {
            this.stream = new ClientStream({
                onWrite: (data) => this._onWrite(data)
            });

            this.terminal = new Terminal(this.client, this.stream);

            this.terminal.initialize();
        }
    }

    async _handleMessage(message) {
        if (message.type === "api") {
            try {
                assert(api[message.name], `No command named ${message.name} found`);

                const result = await api[message.name](this.client, ...(message.args || []));

                await this.sendResult(message, result);
            } catch (error) {
                await this.sendError(message, error);
            }
        } else if (message.type === "term") {
            this._ensureTerminal();

            if (message.data) {
                this.stream.insert(message.data);
            } else if (message.size > 0) {
                this.terminal.setSize(message.size.cols, message.size.rows);
            }
        }
    }
}

export default HttpClient;
export { COOKIE_NAME };
