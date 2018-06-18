"use strict";

const { Node } = require("../../vfs");

class Album extends Node {
    // Private

    async _postCreate(session) {
        await this.createChild(session, "d", "files");
        await this.createChild(session, "d", "texts");
    }
}

Album.IDENTIFIER = "a";
Album.VERSION = 1;

module.exports = Album;
