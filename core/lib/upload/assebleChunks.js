"use strict";

const fs = require("fs-extra");
const { getChunkFilename } = require("./utils");

const assembleChunks = async (tmpdir, identifier, numberOfChunks, filename) => {
    const target = fs.createWriteStream(filename);
    const chunkFilenames = [];

    try {
        for (let n = 1; n <= numberOfChunks; n++) {
            const chunkFilename = getChunkFilename(tmpdir, n, identifier);
            chunkFilenames.push(chunkFilename);

            await new Promise((resolve, reject) => {
                fs.createReadStream(chunkFilename)
                .on("error", reject)
                .on("end", resolve)
                .pipe(target, {
                    end: false
                });
            });
        }

        await new Promise((resolve) => {
            target.on("finish", resolve);
            target.end();
        });
    } catch (error) {
        await fs.remove(filename);

        throw error;
    }

    await Promise.all(chunkFilenames.map((name) => fs.remove(name)));
};

module.exports = assembleChunks;
