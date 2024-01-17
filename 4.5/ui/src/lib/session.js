
import { api, event } from "./backend";
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

    loadUser = async () => {
        this._user = await api.whoami();

        this.emit("update", this._user);

        return this._user;
    }

    _onUserUpdated = (event, { path }) => {
        if (path === this._user.path ||
            path.startsWith(`${this._user.path}/users`) ||
            path.startsWith(`${this._user.path}/groups`) ||
            path.startsWith(`${this._user.path}/stars`) ||
            path.startsWith(`${this._user.path}/person`)) {
            this.loadUser();
        }
    }

    async init() {
        await this.loadUser();

        event.on("session.updated", this.loadUser);
        event.on("node.update", this._onUserUpdated);
        event.on("node.appendChild", this._onUserUpdated);
        event.on("node.removeChild", this._onUserUpdated);
    }
}

export default new Session();
