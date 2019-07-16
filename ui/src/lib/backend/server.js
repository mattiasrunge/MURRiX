

import Typeson from "typeson";
import TypesonBuiltin from "typeson-registry/presets/builtin";
import ReconnectingWebSocket from "reconnecting-websocket";
import Deferred from "../deferred";
import Emitter from "../emitter";

const TSON = new Typeson().register([ TypesonBuiltin ]);

class Server extends Emitter {
    constructor() {
        super();

        this.url = null;
        this.address = null;
        this.ws = null;
        this.ready = new Deferred();
    }

    _log(...args) {
        console.log(`${new Date().toISOString()} - API[${this.url}]:`, ...args);
    }

    getAddress() {
        return this.url;
    }

    async connect(url) {
        this.url = url;
        this.address = url.replace(/^http/, "ws");
        this._log(`Connecting to ${this.address}`);

        this.ws = new ReconnectingWebSocket(this.address);

        this.ws.addEventListener("open", this._onOpen.bind(this));
        this.ws.addEventListener("close", this._onClose.bind(this));
        this.ws.addEventListener("error", this._onError.bind(this));
        this.ws.addEventListener("message", this._onMessage.bind(this));

        await this.ready.promise;
    }

    onReady() {
        this.ready.resolve();
    }

    _onOpen() {
        this._log("Connected");
    }

    _onClose({ code, reason }) {
        this._log(`Disconnected, got code ${code} and reason: ${reason}`);
        this.ready = new Deferred();
    }

    _onError(error) {
        this._log(error);
    }

    async _onMessage(data) {
        try {
            const message = TSON.parse(data.data);

            // this._log("Message received", message);
            await this.emit("message", message);
        } catch (error) {
            this._log("Failed to parse message", data, error);
        }
    }

    send(message) {
        this.ws.send(TSON.stringify(message));
    }
}

export default Server;
