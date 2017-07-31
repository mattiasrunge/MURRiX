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
    handler: async (ctx, id) => {
        if (!ctx.session.uploads || !ctx.session.uploads[id]) {
            throw new Error("Invalid upload id");
        }

        delete ctx.session.uploads[id];

        const { files } = await asyncBusboy(ctx.req);

        const filename = path.join(params.uploadDirectory, id);
        log.debug(`Will save uploading file to ${filename}...`);

        const stream = fs.createWriteStream(filename);

        files[0].pipe(stream);

        await new Promise((resolve, reject) => {
            stream.on("finish", () => {
                log.debug(`Streaming of uploaded file (${filename}) finished!`);
                resolve();
            });

            stream.on("error", (error) => {
                log.error(`Streaming of uploaded file (${filename}) failed!`);
                log.error(error);
                reject();
            });
        });

        log.debug(`Getting metadata for uploaded file ${filename}...`);
        const metadata = await api.mcs.getMetadata(filename, { noChecksums: true });

        log.debug(`Upload of file ${filename} completed successfully!`);

        ctx.type = "json";
        ctx.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    }
};
