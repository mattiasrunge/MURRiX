"use strict";

const path = require("path");
const fs = require("fs-extra");
const graph = require("node-resolve-dependency-graph/lib");
const commander = require("../commander");
const api = require("../api");
const { getAdminClient } = require("../auth");
const Node = require("../lib/Node");
const bus = require("../bus");
const log = require("../lib/log")(module);

class Packages {
    async init() {
        await bus.init();

        const setups = await this._loadPackages();

        for (const setup of setups) {
            await setup(await getAdminClient());
        }
    }

    async _loadPackages() {
        const dir = path.join(__dirname);
        const names = await fs.readdir(dir);
        const packages = [];

        for (const name of names.filter((name) => !name.endsWith(".js"))) {
            const pkgdir = path.join(dir, name);
            const setup = require(pkgdir);

            packages.push({
                name,
                dir: pkgdir,
                setup,
                dependencies: setup.dependencies ?? [],
                prio: 0
            });
        }

        this._prioritizePackages(packages);

        packages.sort((a, b) => a.prio - b.prio);

        for (const pkg of packages) {
            log.info(`Initializing package ${pkg.name}`);

            await this._loadTypes(pkg.dir);
            await this._loadApi(pkg.dir);
            await this._loadCommands(pkg.dir);
        }

        return packages.map(({ setup }) => setup).filter(Boolean);
    }

    _prioritizePackages(packages) {
        const depList = packages.map((pkg) => [ pkg.name, pkg.dependencies ]);
        const depMap = Object.fromEntries(depList);
        const priority = graph.flat(graph.resolve(depMap));

        packages.forEach((pkg) => pkg.prio = priority.indexOf(pkg.name));
    }

    async _loadApi(pkgdir) {
        const dir = path.join(pkgdir, "api");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);

            for (const filename of names) {
                const name = path.basename(filename, ".js");
                const fn = require(path.join(dir, filename));

                await api.register(name, fn);
            }
        }
    }

    async _loadCommands(pkgdir) {
        const dir = path.join(pkgdir, "commands");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);

            for (const filename of names) {
                const name = path.basename(filename, ".js");
                const fn = require(path.join(dir, filename));

                commander.register(name, fn);
            }
        }
    }

    async _loadTypes(pkgdir) {
        const dir = path.join(pkgdir, "types");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);

            for (const name of names) {
                const Type = require(path.join(dir, name));

                Node.register(Type.IDENTIFIER, Type);
            }
        }
    }
}

module.exports = new Packages();
