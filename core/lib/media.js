"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const api = require("api.io");
const log = require("./log")(module);

class Media {
    constructor() {
        this.mcs = api.getClient().create();
    }

    async init(config) {
        this.config = config;

        if (!this.config.mcs) {
            throw new Error("Missing MCS configuration");
        }

        await this.mcs.connect({
            hostname: this.config.mcs.host,
            port: this.config.mcs.port
        }, (...args) => this.onStatus(...args));

        await this.authenticate();
    }

    onStatus(status, message) {
        if (status === "timeout") {
            log.error(message);
            process.exit(255);
        } else if (status === "disconnect") {
            log.error("Disconnected from server, will attempt to reconnect...");
        } else if (status === "reconnect") {
            log.info("Reconnected to server, will re-authenticate");
            this.authenticate();
        }
    }

    async authenticate() {
        const result = await this.mcs.auth.identify(this.config.mcs.key);

        if (!result) {
            throw new Error("Failed to identify ourselves with the MCS, is the keys set up?");
        }
    }

    getMetadata(filename, options) {
        return this.mcs.metadata.get(filename, options);
    }

    getCached(id, filename, format) {
        return this.mcs.cache.get(id, filename, format, this.config.mcsDirectory);
    }

    getAllCached(id, filename, format) {
        return this.mcs.cache.getAll(id, filename, format, this.config.mcsDirectory);
    }

    compileTime(sources) {
        return this.mcs.time.compile(sources);
    }

    getStatus() {
        return this.mcs.cache.status();
    }

    createCacheUrl(filename, name) {
        return `/media/cache/${filename}/${name}`;
    }

    createFileUrl(filename, name) {
        return `/media/file/${filename}/${name}`;
    }

    routes() {
        return [
            {
                method: "GET",
                route: "/media/cache/:filename/:name",
                handler: async (ctx, filename, name) => {
                    const filepath = path.join(this.config.mcsDirectory, path.basename(filename));
                    const stat = await fs.statAsync(filepath);

                    ctx.set("Content-disposition", `filename=${encodeURIComponent(name)}`);
                    ctx.compress = false;
                    ctx.length = stat.size;
                    ctx.body = fs.createReadStream(filepath);
                }
            },
            {
                method: "GET",
                route: "/media/file/:filename/:name",
                handler: async (ctx, filename, name) => {
                    const filepath = path.join(this.config.fileDirectory, path.basename(filename));
                    const stat = await fs.statAsync(filepath);

                    ctx.set("Content-disposition", `attachment; filename=${encodeURIComponent(name)}`);
                    ctx.length = stat.size;
                    ctx.body = fs.createReadStream(filepath);
                }
            }
        ];
    }

    async stop() {
        this.mcs.disconnect();
    }
}

module.exports = new Media();
