"use strict";

const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");

class Group extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.mode = 0o770;
        data.attributes.gid = data.attributes.gid || (await Group.generateGID());

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "users");
    }


    // Getters

    static async generateGID() {
        const groups = await Node.list(ADMIN_CLIENT, "/groups");
        const gids = groups.map((group) => group.attributes.gid);

        return Math.max(0, ...gids) + 1;
    }
}

Group.IDENTIFIER = "g";
Group.VERSION = 1;

module.exports = Group;
