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

        let filename = path.join(params.uploadDirectory, id);
        log.debug("Saving uploaded file as " + filename);

        let stream = fs.createWriteStream(filename);

        files[0].pipe(stream);

        await new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        let metadata = await api.mcs.getMetadata(filename, { noChecksums: true });

        log.debug("Uploaded file " + filename + " saved!");

        ctx.type = "json";
        ctx.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    }
};
