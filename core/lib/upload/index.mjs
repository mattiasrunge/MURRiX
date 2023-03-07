import config from "../config/index.mjs";
import handleChunk from "./handleChunk.mjs";
import handleCheck from "./handleCheck.mjs";
import processChunks from "./processChunks.mjs";

const getHandler = async (ctx) => {
    console.log("upload: GET start");
    const {
        exists,
        name,
        identifier,
        numberOfChunks,
        chunkNumber,
        abspath
    } = await handleCheck(config.uploadDirectory, ctx);

    if (!exists) {
        ctx.status = 204;

        return;
    }

    if (numberOfChunks === chunkNumber) {
        await processChunks(ctx.client, config.uploadDirectory, config.fileDirectory, name, identifier, numberOfChunks, abspath);
    }

    ctx.status = 200;
    console.log("upload: GET end");
};

const postHandler = async (ctx) => {
    console.log("upload: POST start");
    const {
        name,
        identifier,
        numberOfChunks,
        abspath
    } = await handleChunk(config.uploadDirectory, ctx);

    await processChunks(ctx.client, config.uploadDirectory, config.fileDirectory, name, identifier, numberOfChunks, abspath);

    ctx.status = 200;

    console.log("upload: POST end");
    console.log(" - name:", name);
    console.log(" - identifier:", identifier);
    console.log(" - numberOfChunks:", numberOfChunks);
    console.log(" - abspath:", abspath);
};

export {
    getHandler,
    postHandler
};
