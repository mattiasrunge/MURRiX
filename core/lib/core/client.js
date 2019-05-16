"use strict";

const assert = require("assert");
const Session = require("../core/session");

class Client {
    constructor(session) {
        this.session = new Session(session, this);
    }

    clone(session) {
        return new Client({
            ...this.session,
            ...session
        });
    }

    setUser(user) {
        assert(user && typeof user === "object");
        assert(typeof user.username === "string");
        assert(typeof user.uid === "number");
        assert(typeof user.gid === "number");
        assert(Array.isArray(user.gids));
        user.gids.forEach((n) => assert(typeof n === "number"));

        this.session.user = {
            admin: false,
            almighty: false,
            ...user
        };
    }

    giveAdmin() {
        this.session.user = {
            ...this.session.user,
            admin: new Date()
        };
    }

    revokeAdmin() {
        this.session.user = {
            ...this.session.user,
            admin: false
        };
    }

    getId() {
        return this.session.id;
    }

    getUsername() {
        return this.session.user.username;
    }

    getUid() {
        return this.session.user.uid;
    }

    getGid() {
        return this.session.user.gid;
    }

    getGids() {
        return this.session.user.gids.slice(0);
    }

    getUmask() {
        return this.session.user.umask;
    }

    isAdmin() {
        return this.session.user.almighty || this.session.user.admin || this.session.user.username === "admin";
    }

    isGuest() {
        return this.session.user.username === "guest"; // TODO: Check UID?
    }

    async sessionUpdated() {}

    async sendEvent() {}

    async sendResult() {}

    async sendError() {}
}

module.exports = Client;
