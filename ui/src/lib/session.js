
import { cmd, event } from "./backend";
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

    personPath() {
        return this._user && this._user.personPath;
    }

    async loadUser() {
        this._user = await cmd.whoami();

        this.emit("update", this._user);

        return this._user;
    }

    async init() {
        await this.loadUser();

        event.on("session.updated", () => this.loadUser());
    }
}

export default new Session();
