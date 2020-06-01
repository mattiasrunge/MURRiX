"use strict";

const Node = require("../../../core/Node");
const auth = require("../../../lib/auth");
const mode = require("../../../lib/mode");

class Album extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.acl.push({
            gid: auth.GID_CUSTODIANS,
            uid: null,
            mode: mode.getMode("rwx", mode.MASKS.ACL)
        });

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "files");
        await this.createChild(client, "d", "texts");
    }
}

Album.IDENTIFIER = "a";
Album.VERSION = 1;

module.exports = Album;
