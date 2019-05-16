"use strict";

const assert = require("assert");
const Typeson = require("typeson");
const { v4: uuid } = require("uuid");
const TypesonBuiltin = require("typeson-registry/dist/presets/builtin");
const log = require("../log")(module);
const { commands } = require("../core");
const BaseClient = require("../core/client");
const jwt = require("./jwt");

const TSON = new Typeson().register([ TypesonBuiltin ]);
const COOKIE_NAME = "session";

class Client extends BaseClient {
    constructor(ws, session) {
        super(session);

        this.ws = ws;
        this.isAlive = true;

        this.ws.on("pong", this._onPong.bind(this));
        this.ws.on("message", this._onMessage.bind(this));
    }

    static async getIdFromCookie(cookie) {
        const session = await jwt.decode(cookie);

        return session.id;
    }

    static async create(ws, cookies = {}) {
        let session = {};

        // TODO: Expiration?

        if (cookies[COOKIE_NAME]) {
            session = await jwt.decode(cookies[COOKIE_NAME]);
        } else {
            session.id = uuid();
        }

        const client = new Client(ws, session);

        if (!cookies[COOKIE_NAME]) {
            await commands.logout(client);
        }

        return client;
    }

    async sessionUpdated() {
        try {
            await this.sendEvent("set-cookie", {
                name: COOKIE_NAME,
                value: await jwt.encode(this.session)
            });

            // TODO: sessionMaxAge = 1000 * 60 * 60 * 24 * 7;

            await this.sendEvent("session.updated", {});
        } catch (error) {
            log.error("Failed to update session cookie", error);
        }
    }

    async clientReady() {
        return this.sendEvent("ready", {});
    }

    async sendEvent(event, data) {
        this.ws.send(TSON.stringify({
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

            log.debug("Message received", message);

            this._handleMessage(message);
        } catch (error) {
            log.error("Failed to parse message", data, error);
        }
    }

    async _handleMessage(message) {
        try {
            assert(commands[message.name], `No command named ${message.name} found`);

            const result = await commands[message.name](this, ...(message.args || []));

            await this.sendResult(message, result);
        } catch (error) {
            await this.sendError(message, error);
        }
    }
}

Client.COOKIE_NAME = COOKIE_NAME;

module.exports = Client;

