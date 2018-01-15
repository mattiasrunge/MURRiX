"use strict";

const sha1 = require("sha1");
const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");

class User extends Node {
    // Private

    static async _createData(session, parent, type, attributes = {}) {
        const data = await super._createData(session, parent, type, attributes);

        data.properties.mode = 0o770;
        data.attributes.uid = data.attributes.uid || (await User.generateUID());

        return data;
    }

    async _postCreate(session) {
        await this.createChild(session, "d", "groups");
    }


    // Setters

    async updateLoginTime(session) {
        await this.update(session, {
            loginTime: new Date()
        });
    }

    async setPassword(session, password) {
        await this.update(session, {
            password: sha1(password)
        });
    }

    async setActivation(session, active) {
        await this.update(session, {
            inactive: !active
        });

        return !this.attributes.inactive;
    }


    // Getters

    async serialize(session) {
        const data = await super.serialize(session);

        delete data.attributes.password;
        delete data.attributes.resetId;

        return data;
    }

    matchPassword(password) {
        return this.attributes.password === sha1(password); // TODO: Constant time compare
    }

    static async generateUID() {
        const users = await Node.list(ADMIN_SESSION, "/users");
        const uids = users.map((user) => user.attributes.uid);

        return Math.max(0, ...uids) + 1;
    }
}

User.IDENTIFIER = "u";

module.exports = User;
