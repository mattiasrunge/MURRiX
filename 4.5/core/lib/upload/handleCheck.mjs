import { validateRequest, isChunkAvailable } from "./utils.mjs";

const handleCheck = async (tmpdir, ctx) => {
    const abspath = ctx.request.query.path;
    const chunkNumber = Number.parseInt(ctx.request.query.flowChunkNumber ?? 0, 10);
    const chunkSize = Number.parseInt(ctx.request.query.flowChunkSize ?? 0, 10);
    const totalSize = Number.parseInt(ctx.request.query.flowTotalSize ?? 0, 10);
    const identifier = ctx.request.query.flowIdentifier ?? "";
    const filename = ctx.request.query.flowFilename ?? "";

    const numberOfChunks = validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename);

    return {
        exists: await isChunkAvailable(tmpdir, chunkNumber, identifier),
        name: filename,
        identifier,
        numberOfChunks,
        chunkNumber,
        abspath
    };
};

export default handleCheck;
