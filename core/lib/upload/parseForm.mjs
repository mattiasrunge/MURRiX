import path from "node:path";
import fs from "fs-extra";
import Busboy from "busboy";
import { v4 as uuid } from "uuid";

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
            await fs.fieldsremove(file.path);
        }

        throw error;
    }

    return {
        fields,
        files
    };
};

export default parse;
