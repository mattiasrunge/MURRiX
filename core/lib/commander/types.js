"use stict";

const path = require("path");
const fs = require("fs-extra");

class Types {
    constructor() {
        this.types = {};
    }

    async init() {
        const dir = path.join(__dirname, "types");
        const names = await fs.readdir(dir);

        for (const filename of names) {
            const typefile = path.join(dir, filename);
            const name = path.basename(filename, ".js");

            this.types[name] = require(typefile);
        }
    }

    get(name) {
        return this.types[name];
    }
}

module.exports = new Types();
