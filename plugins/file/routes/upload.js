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
            log.info(`Could not find upload id ${id}`);
            log.info(JSON.stringify(ctx.session.uploads, null, 2));
            throw new Error("Invalid upload id");
        }

        delete ctx.session.uploads[id];

        const { files } = await asyncBusboy(ctx.req);

        files[0].destroy();

        const filename = path.join(params.uploadDirectory, id);
        log.info(`Will move uploaded file to ${filename}...`);

        await fs.moveAsync(files[0].path, filename);

        log.info(`Getting metadata for uploaded file ${filename}...`);
        const metadata = await api.mcs.getMetadata(filename, { noChecksums: true });

        log.info(`Upload of file ${filename} completed successfully!`);

        ctx.type = "json";
        ctx.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    }
};
