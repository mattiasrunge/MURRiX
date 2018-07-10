"use strict";

const { Node, auth, mode } = require("../../vfs");

class Album extends Node {
    // Private

    static async _createData(session, parent, type, attributes = {}) {
        const data = await super._createData(session, parent, type, attributes);

        data.properties.acl.push({
            gid: auth.GID_CUSTODIANS,
            uid: null,
            mode: mode.getMode("rwx", mode.MASKS.ACL)
        });

        return data;
    }

    async _postCreate(session) {
        await this.createChild(session, "d", "files");
        await this.createChild(session, "d", "texts");
    }
}

Album.IDENTIFIER = "a";
Album.VERSION = 1;

module.exports = Album;
