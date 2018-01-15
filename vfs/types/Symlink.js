"use strict";

const Node = require("../lib/Node");

class Symlink extends Node {
    // Getters

    async get(session, options = {}) {
        if (options.readlink) {
            return this;
        }

        return Node.resolve(session, this.attributes.path, { noerror: true });
    }


    // Setters

    async setfacl(session, ac, options = {}) {
        return super.setfacl(session, ac, { ...options, recursive: false });
    }

    async chmod(session, mode, options = {}) {
        return super.chmod(session, mode, { ...options, recursive: false });
    }

    async chown(session, user, group, options = {}) {
        return super.chown(session, user, group, { ...options, recursive: false });
    }
}

Symlink.IDENTIFIER = "s";

module.exports = Symlink;
