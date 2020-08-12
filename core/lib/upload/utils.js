"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");

const cleanIdentifier = (i) => i.replace(/[^\w-]/g, "");

const validateRequest = (chunkNumber, chunkSize, totalSize, identifier, filename, fileSize) => {
    identifier = cleanIdentifier(identifier);

    assert(chunkNumber > 0, "chunk number must be larger than zero");
    assert(chunkSize > 0, "chunk size must be larger than zero");
    assert(totalSize > 0, "total size must be larger than zero");
    assert(identifier.length > 0, "identifier length must be larger than zero");
    assert(filename.length > 0, "filename length must be larger than zero");

    const numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1)), 1);

    assert(chunkNumber <= numberOfChunks, "chunk number can not be higher than the totalk number of chunks");

    if (typeof fileSize !== "undefined") {
        assert(!(chunkNumber < numberOfChunks && fileSize !== chunkSize), "file data size does not match chunk size");

        assert(!(numberOfChunks > 1 && chunkNumber === numberOfChunks && fileSize !== ((totalSize % chunkSize) + chunkSize)), "last file data chunk does not make up the total size of the file");

        assert(!(numberOfChunks === 1 && fileSize !== totalSize), "file size does not match total size");
    }

    return numberOfChunks;
};

const getChunkFilename = (tmpdir, chunkNumber, identifier) => {
    identifier = cleanIdentifier(identifier);

    return path.join(tmpdir, `murrix-${identifier}.${chunkNumber}`);
};

const isChunkAvailable = async (tmpdir, chunkNumber, identifier) => {
    const chunkFilename = getChunkFilename(tmpdir, chunkNumber, identifier);

    return await fs.pathExists(chunkFilename);
};

const isComplete = async (tmpdir, identifier, numberOfChunks) => {
    for (let n = 1; n <= numberOfChunks; n++) {
        const exists = await isChunkAvailable(tmpdir, n, identifier);

        if (!exists) {
            return false;
        }
    }

    return true;
};


module.exports = {
    cleanIdentifier,
    validateRequest,
    getChunkFilename,
    isChunkAvailable,
    isComplete
};
