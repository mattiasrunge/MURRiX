"use strict";

const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");

class Group extends Node {
    // Private

    static async _createData(session, parent, type, attributes = {}) {
        const data = await super._createData(session, parent, type, attributes);

        data.properties.mode = 0o770;
        data.attributes.uid = data.attributes.uid || (await Group.generateGID());

        return data;
    }

    async _postCreate(session) {
        await this.createChild(session, "d", "users");
    }


    // Getters

    static async generateGID() {
        const groups = await Node.list(ADMIN_SESSION, "/groups");
        const gids = groups.map((group) => group.attributes.gid);

        return Math.max(0, ...gids) + 1;
    }
}

Group.IDENTIFIER = "g";

module.exports = Group;
