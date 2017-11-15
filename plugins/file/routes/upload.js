"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const asyncBusboy = require("async-busboy");
const log = require("../../../core/lib/log")(module);
const api = require("api.io");

let params = {};

module.exports = {
    method: "POST",
    route: "/:id",
    init: async (config) => {
        params = config;
    },
    onFile: (filename, file, deferred) => {
        const writeStream = fs.createWriteStream(filename);

        log.info(`Creating write stream for ${filename}...`);

        writeStream
            .on("open", () => file
                .pipe(writeStream)
                .on("error", deferred.reject)
                .on("finish", deferred.resolve)
            )
            .on("error", deferred.reject);
    },
    handler: async (ctx, id) => {
        if (!ctx.session.uploads || !ctx.session.uploads[id]) {
            log.info(`Could not find upload id ${id}`);
            log.info(JSON.stringify(ctx.session.uploads, null, 2));
            throw new Error("Invalid upload id");
        }

        delete ctx.session.uploads[id];

        const filename = path.join(params.uploadDirectory, id);
        log.info(`Will save upload file to ${filename}...`);

        let deferred = {};
        const promise = new Promise((resolve, reject) => deferred = { resolve, reject });

        await asyncBusboy(ctx.req, {
            onFile: (fieldname, file) => module.exports.onFile(filename, file, deferred)
        });

        log.info(`After async busboy will await stream promise for ${filename}...`);

        await promise;

        log.info(`Getting metadata for uploaded file ${filename}...`);
        const metadata = await api.mcs.getMetadata(filename, { noChecksums: true });

        log.info(`Upload of file ${filename} completed successfully!`);

        ctx.type = "json";
        ctx.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    }
};
