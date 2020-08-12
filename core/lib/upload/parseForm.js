"use strict";

const path = require("path");
const fs = require("fs-extra");
const Busboy = require("busboy");
const { v4: uuid } = require("uuid");

const parse = async (tmpdir, ctx) => {
    const busboy = new Busboy({ headers: ctx.req.headers });
    const fields = {};
    const files = {};

    try {
        await new Promise((resolve, reject) => {
            busboy.on("file", (fieldname, file, filename) => {
                files[fieldname] = {
                    originalFilename: filename,
                    path: path.join(tmpdir, uuid()),
                    size: 0
                };

                file
                .on("data", (chunk) => {
                    files[fieldname].size += chunk.length;
                })
                .pipe(fs.createWriteStream(files[fieldname].path))
                .on("error", reject);
            });

            busboy.on("field", (name, value) => fields[name] = value);
            busboy.on("error", reject);
            busboy.on("finish", resolve);

            ctx.req.pipe(busboy);
        });
    } catch (error) {
        for (const file of Object.values(files)) {
            await fs.remove(file.path);
        }

        throw error;
    }

    return {
        fields,
        files
    };
};

module.exports = parse;
