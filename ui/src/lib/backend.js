
import Typeson from "typeson";
import TypesonBuiltin from "typeson-registry/presets/builtin";
import ReconnectingWebSocket from "reconnecting-websocket";
import cookies from "browser-cookies";
import Deferred from "./deferred";
import Emitter from "./emitter";

const TSON = new Typeson().register([ TypesonBuiltin ]);

class Backend extends Emitter {
    constructor() {
        super();

        this.args = {};
        this.address = null;
        this.ws = null;
        this.ready = new Deferred();
    }

    _log(...args) {
        console.log(`${new Date().toISOString()} - API[${this.address}]:`, ...args);
    }

    getAddress() {
        return `${this.args.secure ? "https" : "http"}://${this.args.hostname}:${this.args.port}`;
    }

    async connect(args) {
        this.args = args;
        this.address = `${args.secure ? "wss" : "ws"}://${args.hostname}:${args.port}`;
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

            this._log("Message received", message);
            await this.emit("message", message);
        } catch (error) {
            this._log("Failed to parse message", data, error);
        }
    }

    send(message) {
        this.ws.send(TSON.stringify(message));
    }
}

class Events extends Emitter {
    constructor(backend) {
        super();

        backend.on("message", async (event, message) => {
            if (message.id) {
                return;
            }

            if (message.event === "set-cookie") {
                cookies.set(message.data.name, message.data.value);
            } else if (message.event === "ready") {
                backend.onReady();
            } else {
                await this.emit(message.event, message.data);
            }

            console.log("event", message);
        });
    }
}

class Commands {
    constructor(backend) {
        this.pending = {};

        backend.on("message", (event, message) => {
            if (!message.id) {
                return;
            }

            const operation = this.pending[message.id];

            if (!operation) {
                return console.error("No such pending operation found", message);
            }

            clearTimeout(operation.timeout);
            delete this.pending[operation.id];

            if (message.error) {
                const error = new Error(message.error.messsage);

                error.code = message.error.code;
                message.error.stack && (error.stack = message.error.stack);

                return operation.reject(error);
            }

            operation.resolve(message.result);
        });

        return new Proxy(this, {
            get: (target, name) => (...args) => new Promise((resolve, reject) => {
                let id = Date.now();

                while (this.pending[id]) {
                    id = Date.now();
                }

                const operation = {
                    id,
                    resolve,
                    reject,
                    message: {
                        id,
                        name,
                        args: [ ...args ]
                    },
                    timeout: setTimeout(() => {
                        delete this.pending[id];

                        reject();
                    }, 1000 * 60 * 10) // 10 minutes
                };

                this.pending[id] = operation;

                backend.send(operation.message);
            })
        });
    }
}

const backend = new Backend();
const event = new Events(backend);
const cmd = new Commands(backend);

export {
    backend,
    cmd,
    event
};
