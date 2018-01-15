"use strict";

const path = require("path");
const walk = require("walk-promise");
const fs = require("fs-extra");
const { ADMIN_SESSION } = require("./auth");
const Node = require("./Node");
const bus = require("./bus");

class VFS {
    constructor() {
        this.api = {};
        this.namespaces = {};
        this.packages = [];
    }

    register(pkgdir) {
        this.packages.push(pkgdir);
    }

    async init() {
        await bus.init();

        for (const pkgdir of this.packages) {
            await this._loadTypes(pkgdir);
            await this._loadCommands(pkgdir);
        }

        for (const pkgdir of this.packages) {
            await this._runSetup(pkgdir);
        }
    }

    async _loadCommands(pkgdir) {
        const typedir = path.join(pkgdir, "commands");
        const files = await walk(typedir);

        files
        .filter((file) => file.root === typedir)
        .forEach((file) => {
            const filename = path.join(file.root, file.name);
            const name = path.basename(file.name, ".js");
            const ns = path.basename(path.dirname(file.root));

            this.api[name] = require(filename);
            this.namespaces[ns] = this.namespaces[ns] || {};
            this.namespaces[ns][name] = this.api[name];
        });
    }

    async _loadTypes(pkgdir) {
        const typedir = path.join(pkgdir, "types");
        const files = await walk(typedir);

        files
        .filter((file) => file.root === typedir)
        .map((file) => path.join(file.root, file.name))
        .map((filename) => require(filename))
        .forEach((Type) => Node.register(Type.IDENTIFIER, Type));
    }

    async _runSetup(pkgdir) {
        const filename = path.join(pkgdir, "setup.js");
        const exists = await fs.pathExists(filename);

        if (exists) {
            const setup = require(filename);

            await setup(ADMIN_SESSION, this.api);
        }
    }
}

module.exports = VFS;
