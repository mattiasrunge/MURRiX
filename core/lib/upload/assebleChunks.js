"use strict";

const fs = require("fs-extra");
const { getChunkFilename } = require("./utils");

const assembleChunks = async (tmpdir, identifier, numberOfChunks, filename) => {
    console.log("assembleChunks start");
    console.log(" - tmpdir:", tmpdir)
    console.log(" - identifier:", identifier)
    console.log(" - numberOfChunks:", numberOfChunks)
    console.log(" - filename:", filename)

    const target = fs.createWriteStream(filename);
    const chunkFilenames = [];

    try {
        for (let n = 1; n <= numberOfChunks; n++) {
            const chunkFilename = getChunkFilename(tmpdir, n, identifier);
            chunkFilenames.push(chunkFilename);

            console.log("chunk:", n);
            console.log("chunkFilename:", chunkFilename);

            await new Promise((resolve, reject) => {
                fs.createReadStream(chunkFilename)
                .on("error", reject)
                .on("end", resolve)
                .pipe(target, {
                    end: false
                });
            });
        }
console.log("ABC")
        await new Promise((resolve) => {
            target.on("finish", resolve);
            target.end();
        });
        console.log("123")
    } catch (error) {
        console.log("assemble chunks error", error);
        await fs.remove(filename);

        throw error;
    }

    console.log("assemble chunks remove before");

    await Promise.all(chunkFilenames.map((name) => fs.remove(name)));

    console.log("assemble chunks remove after");
};

module.exports = assembleChunks;
