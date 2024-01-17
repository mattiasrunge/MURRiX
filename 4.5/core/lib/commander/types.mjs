import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

class Types {
    constructor() {
        this.types = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        const dir = path.join(__dirname, "types");
        const names = await fs.readdir(dir);

        for (const filename of names) {
            const typefile = path.join(dir, filename);
            const name = path.basename(filename, ".mjs");
            const Type = await import(typefile);

            this.types[name] = Type.default;
        }
    }

    get(name) {
        return this.types[name];
    }
}

export default new Types();
