import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import commander from "../commander/index.mjs";
import api from "../api/index.mjs";
import { getAdminClient } from "../auth/index.mjs";
import Node from "../lib/Node.mjs";
import bus from "../bus/index.mjs";
import { createLog } from "../lib/log.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const log = createLog(import.meta.url);
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

        for (const name of names.filter((name) => !name.endsWith(".mjs"))) {
            const pkgdir = path.join(dir, name);
            const setup = await import(path.join(pkgdir, "index.mjs"));

            packages.push({
                name,
                dir: pkgdir,
                setup: setup.default,
                prio: 0
            });
        }

        packages.sort((a, b) => a.name.localeCompare(b.name));

        log.info("Loading node types");
        await this._loadTypes();

        for (const pkg of packages) {
            log.info(`Initializing package ${pkg.name}`);

            await this._loadApi(pkg.dir);
            await this._loadCommands(pkg.dir);
        }

        return packages.map(({ setup }) => setup).filter(Boolean);
    }

    async _loadApi(pkgdir) {
        const dir = path.join(pkgdir, "api");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);

            for (const filename of names) {
                const name = path.basename(filename, ".mjs");
                const fn = await import(path.join(dir, filename));

                await api.register(name, fn.default);
            }
        }
    }

    async _loadCommands(pkgdir) {
        const dir = path.join(pkgdir, "commands");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);

            for (const filename of names) {
                const name = path.basename(filename, ".mjs");
                const fn = await import(path.join(dir, filename));

                commander.register(name, fn.default);
            }
        }
    }

    async _loadTypes() {
        const dir = path.join(__dirname, "..", "lib", "types");

        if (await fs.pathExists(dir)) {
            const names = await fs.readdir(dir);
            for (const name of names) {
                const Type = await import(path.join(dir, name));

                Node.register(Type.default.IDENTIFIER, Type.default);
            }
        }
    }
}

export default new Packages();
