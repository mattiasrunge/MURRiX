"use strict";

import api from "api.io/api.io-client";
import Emitter from "./emitter";

class Notification extends Emitter {
    constructor() {
        super();

        this.messages = [];
    }

    add(type, message, timeout = 3000) {
        this.emit("message", {
            message,
            key: Date.now(),
            dismissAfter: timeout
        });
    }

    async loadUser() {
        this._user = await api.vfs.whoami();

        this.emit("update", this._user);

        return this._user;
    }

    async init() {
        await this.loadUser();
        api.vfs.on("Notification.updated", () => this.loadUser());
    }
}

export default new Notification();
