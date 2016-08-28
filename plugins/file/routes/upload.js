"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const parse = require("co-busboy");
const co = require("bluebird").coroutine;
const log = require("../../../core/lib/log")(module);
const api = require("api.io");

let params = {};

module.exports = {
    method: "POST",
    route: "/:id",
    init: co(function*(config) {
        params = config;
    }),
    handler: function*(id) {
        if (!this.session.uploads || !this.session.uploads[id]) {
            throw new Error("Invalid upload id");
        }

        delete this.session.uploads[id];

        let part = yield parse(this);
        let filename = path.join(params.uploadDirectory, id);
        log.debug("Saving uploaded file as " + filename);

        let stream = fs.createWriteStream(filename);

        part.pipe(stream);

        yield new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        let metadata = yield api.mcs.getMetadata(filename, { noChecksums: true });

        log.debug("Uploaded file " + filename + " saved!");

        this.type = "json";
        this.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    }
};
