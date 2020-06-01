"use strict";

const assert = require("assert");
const uuid = require("uuid");
const sha1 = require("sha1");
const bcrypt = require("bcryptjs");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../lib/auth");

class User extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.mode = 0o770;
        data.attributes.uid = data.attributes.uid || (await User.generateUID());

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "groups");
        await this.createChild(client, "d", "stars");
        await this.createChild(client, "d", "files");
    }

    async _migrateDb(client) {
        if (!this.properties.version && this.attributes.password) {
            this.attributes.password = await bcrypt.hash(this.attributes.password, 13);
        }

        return super._migrateDb(client);
    }


    // Setters

    async updateLoginTime(client) {
        await this.update(client, {
            loginTime: new Date()
        });
    }

    async setPassword(client, password) {
        await this.update(client, {
            password: await bcrypt.hash(sha1(password), 13)
        });
    }

    async setActivation(client, active) {
        await this.update(client, {
            inactive: !active
        });

        return !this.attributes.inactive;
    }

    async generatePasswordReset(client) {
        await this.update(client, {
            resetId: uuid.v4()
        });

        return this.attributes.resetId;
    }

    async resetPassword(client, resetId, password) {
        assert(this.attributes.resetId, "Invalid reset id");
        assert(this.attributes.resetId === resetId, "Invalid reset id");

        await this.update(client, {
            password: await bcrypt.hash(sha1(password), 13),
            resetId: null
        });
    }


    // Getters

    async serialize(client) {
        const data = await super.serialize(client);

        delete data.attributes.password;
        delete data.attributes.resetId;

        return data;
    }

    async matchPassword(password) {
        if (!this.attributes.password) {
            return false;
        }

        return bcrypt.compare(sha1(password), this.attributes.password);
    }

    static async generateUID() {
        const users = await Node.list(ADMIN_CLIENT, "/users");
        const uids = users.map((user) => user.attributes.uid);

        return Math.max(0, ...uids) + 1;
    }

    static getActionTypes() {
        return super.getActionTypes().concat([
            {
                name: "person",
                label: "Person",
                type: "list",
                inputs: [
                    {
                        name: "person",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getuserperson ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                add: "setuserperson ${this.node.path} ${this.person.path}", // eslint-disable-line no-template-curly-in-string
                remove: "removeuserperson ${this.node.path}" // eslint-disable-line no-template-curly-in-string
            }
        ]);
    }

    static getAttributeTypes() {
        return [
            {
                name: "name",
                label: "Name",
                type: "textline",
                required: true
            }
        ];
    }
}

User.IDENTIFIER = "u";
User.VERSION = 1;

module.exports = User;
