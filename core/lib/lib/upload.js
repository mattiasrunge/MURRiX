"use strict";

const assert = require("assert");
const path = require("path");
const { v4: uuid } = require("uuid");
const fs = require("fs-extra");
const Busboy = require("busboy");
const { api } = require("../api");
const log = require("../lib/log")(module);
const configuration = require("../config");

const handler = async (ctx) => {
    const filename = path.join(configuration.fileDirectory, uuid());

    try {
        log.info(`Will save upload file to ${filename}...`);

        const busboy = new Busboy({ headers: ctx.req.headers });

        const fields = await new Promise((resolve, reject) => {
            const fields = {};

            busboy.on("file", (fieldname, file) => {
                const stream = fs.createWriteStream(filename);

                stream.on("error", (error) => {
                    log.error("Steam error", error);
                });

                const pipe = file.pipe(stream);

                pipe.on("error", (error) => {
                    log.error("Pipe error", error);
                });
            });

            busboy.on("field", (name, value) => fields[name] = value);
            busboy.on("error", reject);
            busboy.on("finish", () => resolve(fields));

            ctx.req.pipe(busboy);
        });

        assert(fields.name, "Missing the name field");
        assert(fields.path, "Missing the path field");

        log.info(`Upload of file ${filename} completed successfully!`);

        const name = await api.uniquename(ctx.client, fields.path, fields.name);
        const node = await api.create(ctx.client, fields.path, "f", name, {
            name: fields.name,
            _source: {
                filename
            }
        });

        log.info(`Import of file ${filename} completed successfully at ${node.path}!`);

        ctx.type = "json";
        ctx.body = JSON.stringify({
            status: "success",
            path: node.path
        }, null, 2);
    } catch (error) {
        log.error(`Upload of ${filename} failed`, error);

        await fs.remove(filename);

        ctx.type = "json";
        ctx.status = 400;
        ctx.body = JSON.stringify({
            status: "error",
            text: error.message
        }, null, 2);
    }
};

module.exports = {
    handler
};
