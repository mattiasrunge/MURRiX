"use strict";

const Node = require("../../../lib/Node");

class Symlink extends Node {
    // Getters

    async get(client, options = {}) {
        if (options.readlink) {
            return this;
        }

        const node = await Node.resolve(client, this.attributes.path, { noerror: true });

        node.extra.linkPath = this.path;

        return node;
    }


    // Setters

    async setfacl(client, ac, options = {}) {
        return super.setfacl(client, ac, { ...options, recursive: false });
    }

    async chmod(client, mode, options = {}) {
        return super.chmod(client, mode, { ...options, recursive: false });
    }

    async chown(client, user, group, options = {}) {
        return super.chown(client, user, group, { ...options, recursive: false });
    }
}

Symlink.IDENTIFIER = "s";
Symlink.VERSION = 1;

module.exports = Symlink;
