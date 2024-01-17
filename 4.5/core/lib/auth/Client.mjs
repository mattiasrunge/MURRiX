import assert from "node:assert";
import { v4 as uuid } from "uuid";
import Session from "./Session.mjs";

class Client {
    constructor(session) {
        this.session = session;
    }

    static async create(sessionId, initialData) {
        return new Client(await Session.create(sessionId, initialData));
    }

    async clone(session) {
        const id = uuid();

        return await Client.create(id, {
            ...this.session,
            session,
            id
        });
    }

    async destroy() {
        // TODO: try/catch here?
        await this.session.destroy();
    }

    async sync() {
        await this.session.sync();
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

        console.log("hu", this.hasUser());
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

    hasUser() {
        return !!this.session.user;
    }

    isAdmin() {
        return this.session.user.almighty || this.session.user.admin || this.session.user.username === "admin";
    }

    isGuest() {
        return this.session.user.username === "guest"; // TODO: Check UID?
    }

    getCurrentDirectory() {
        return this.session.cd || "/";
    }

    setCurrentDirectory(dir) {
        this.session.cd = dir;
    }
}

export default Client;
