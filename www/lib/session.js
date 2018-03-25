"use strict";

import api from "api.io/api.io-client";
import Emitter from "./emitter";

class Session extends Emitter {
    constructor() {
        super();

        this._user = false;
    }

    user() {
        return this._user;
    }

    username() {
        return this._user ? this._user.name : "guest";
    }

    adminGranted() {
        return this._user && this._user.adminGranted;
    }

    async loadUser() {
        this._user = await api.vfs.whoami();

        this.emit("update", this._user);

        return this._user;
    }

    async init() {
        await this.loadUser();
        api.vfs.on("session.updated", () => this.loadUser());
    }
}

export default new Session();
