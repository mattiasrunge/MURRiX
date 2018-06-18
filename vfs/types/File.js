"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const Node = require("../lib/Node");
const config = require("../../lib/configuration");

class File extends Node {
    // Private

    static async _createData(session, parent, type, attributes = {}) {
        const data = await super._createData(session, parent, type, attributes);

        assert(data.attributes.name, "File must have a filename attribute");
        assert(data.attributes._source, "File must have a _source attribute");

        const source = data.attributes._source;
        const ext = path.extname(data.attributes.name).toLowerCase();
        const filename = `${data._id}${ext}`;
        const filepath = path.join(config.fileDirectory, filename);

        if (source.mode === "symlink") {
            await fs.ensureSymlink(source.filename, filepath);
        } else if (source.mode === "copy") {
            await fs.copy(source.filename, filepath);
        } else if (source.mode === "link") {
            await fs.ensureLink(source.filename, filepath);
        } else if (source.mode === "rsymlink") {
            await fs.moveAsync(source.filename, filepath);
            await fs.ensureSymlink(filepath, source.filename);
        } else {
            await fs.move(source.filename, filepath);
        }

        data.attributes.diskfilename = filename;
        delete data.attributes._source;

        return data;
    }

    async _postCreate(session) {
        await this.createChild(session, "d", "tags");
    }
}

File.IDENTIFIER = "f";
File.VERSION = 1;

module.exports = File;
