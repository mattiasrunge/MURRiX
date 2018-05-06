"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const api = require("api.io");
const log = require("./log")(module);
const asyncBusboy = require("async-busboy");

class Media {
    constructor() {
        this.mcs = api.getClient().create();

        this.requiredSizes = [
            { width: 50, height: 50 },
            { width: 216, height: 216 },
            { width: 2000 }
        ];
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

    getAllCached(id, filename, type, options) {
        return this.mcs.cache.getAll(id, filename, type, this.config.mcsDirectory, options);
    }

    detectFaces(filename) {
        return this.mcs.face.detect(filename);
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

    onFile(filename, file, deferred) {
        const writeStream = fs.createWriteStream(filename);

        log.info(`Creating write stream for ${filename}...`);

        writeStream
        .on("open", () => file
        .pipe(writeStream)
        .on("error", deferred.reject)
        .on("finish", deferred.resolve)
        )
        .on("error", deferred.reject);
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
            },
            {
                method: "POST",
                route: "/media/upload/:id",
                handler: async (ctx, id) => {
                    // if (!ctx.session.uploads || !ctx.session.uploads[id]) {
                    //     log.info(`Could not find upload id ${id}`);
                    //     log.info(JSON.stringify(ctx.session.uploads, null, 2));
                    //     throw new Error("Invalid upload id");
                    // }
                    //
                    // delete ctx.session.uploads[id];

                    const filename = path.join(this.config.uploadDirectory, id);
                    log.info(`Will save upload file to ${filename}...`);

                    let deferred = {};
                    const promise = new Promise((resolve, reject) => deferred = { resolve, reject });

                    await asyncBusboy(ctx.req, {
                        onFile: (fieldname, file) => this.onFile(filename, file, deferred)
                    });

                    log.info(`After async busboy will await stream promise for ${filename}...`);

                    await promise;

                    log.info(`Getting metadata for uploaded file ${filename}...`);
                    const metadata = await this.getMetadata(filename, { noChecksums: true });

                    log.info(`Upload of file ${filename} completed successfully!`);

                    ctx.type = "json";
                    ctx.body = JSON.stringify({
                        status: "success",
                        metadata,
                        filename
                    }, null, 2);
                }
            }
        ];
    }

    async stop() {
        this.mcs.disconnect();
    }
}

module.exports = new Media();
