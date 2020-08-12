"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const utils = require("./utils");
const parseForm = require("./parseForm");

const handleChunk = async (tmpdir, ctx) => {
    const {
        fields,
        files
    } = await parseForm(tmpdir, ctx);

    const chunkNumber = Number.parseInt(fields.flowChunkNumber, 10);
    const chunkSize = Number.parseInt(fields.flowChunkSize, 10);
    const totalSize = Number.parseInt(fields.flowTotalSize, 10);
    const identifier = utils.cleanIdentifier(fields.flowIdentifier);
    const filename = fields.flowFilename;
    const abspath = fields.path;

    assert(files.file, "No file data included in form post");

    const name = files.file.originalFilename;
    const size = files.file.size;

    try {
        assert(size, "file data size must be larger than zero");

        const numberOfChunks = utils.validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, size);
        const chunkFilename = utils.getChunkFilename(tmpdir, chunkNumber, identifier);

        await fs.move(files.file.path, chunkFilename, { overwrite: true });

        return {
            name,
            identifier,
            numberOfChunks,
            abspath
        };
    } catch (error) {
        await fs.remove(files.file.path);

        throw error;
    }
};

module.exports = handleChunk;
