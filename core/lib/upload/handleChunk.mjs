import assert from "node:assert";
import fs from "fs-extra";
import { cleanIdentifier, validateRequest, getChunkFilename } from "./utils.mjs";
import parseForm from "./parseForm.mjs";

const handleChunk = async (tmpdir, ctx) => {
    const {
        fields,
        files
    } = await parseForm(tmpdir, ctx);

    const chunkNumber = Number.parseInt(fields.flowChunkNumber, 10);
    const chunkSize = Number.parseInt(fields.flowChunkSize, 10);
    const totalSize = Number.parseInt(fields.flowTotalSize, 10);
    const identifier = cleanIdentifier(fields.flowIdentifier);
    const filename = fields.flowFilename;
    const abspath = fields.path;

    assert(files.file, "No file data included in form post");

    const name = files.file.originalFilename;
    const size = files.file.size;

    try {
        assert(size, "file data size must be larger than zero");

        const numberOfChunks = validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, size);
        const chunkFilename = getChunkFilename(tmpdir, chunkNumber, identifier);

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

export default handleChunk;
