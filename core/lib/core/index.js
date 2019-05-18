"use strict";

Error.stackTraceLimit = Infinity;

const path = require("path");
const walk = require("walk-promise");
const fs = require("fs-extra");
const { ADMIN_CLIENT } = require("./auth");
const Node = require("./Node");
const bus = require("./bus");
const log = require("../log")(module);

class Core {
    constructor() {
        this.commands = {};
        this.packages = [];
    }

    register(pkgdir) {
        this.packages.push(pkgdir);
    }

    async init() {
        await bus.init();

        for (const pkgdir of this.packages) {
            log.info(`Initializing package from ${pkgdir}`);
            await this._loadTypes(pkgdir);
            await this._loadCommands(pkgdir);
        }

        await Node.runDbMigration();

        for (const pkgdir of this.packages) {
            await this._runSetup(pkgdir);
        }
    }

    async _loadCommands(pkgdir) {
        const cmddir = path.join(pkgdir, "commands");
        const files = await walk(cmddir);

        files
        .filter((file) => file.root === cmddir)
        .forEach((file) => {
            const filename = path.join(file.root, file.name);
            const name = path.basename(file.name, ".js");

            this.commands[name] = require(filename);
        });
    }

    async _loadTypes(pkgdir) {
        const typedir = path.join(pkgdir, "types");
        const files = await walk(typedir);

        files
        .filter((file) => file && file.root === typedir)
        .map((file) => path.join(file.root, file.name))
        .map((filename) => require(filename))
        .forEach((Type) => Node.register(Type.IDENTIFIER, Type));
    }

    async _runSetup(pkgdir) {
        const filename = path.join(pkgdir, "setup.js");
        const exists = await fs.pathExists(filename);

        if (exists) {
            const setup = require(filename);

            await setup(ADMIN_CLIENT, this.commands);
        }
    }
}

module.exports = new Core();