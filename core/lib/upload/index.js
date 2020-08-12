"use strict";

const configuration = require("../config");
const handleChunk = require("./handleChunk");
const handleCheck = require("./handleCheck");
const processChunks = require("./processChunks");

const getHandler = async (ctx) => {
    const {
        exists,
        name,
        identifier,
        numberOfChunks,
        chunkNumber,
        abspath
    } = await handleCheck(configuration.uploadDirectory, ctx);

    if (!exists) {
        ctx.status = 204;

        return;
    }

    if (numberOfChunks === chunkNumber) {
        await processChunks(ctx.client, configuration.uploadDirectory, configuration.fileDirectory, name, identifier, numberOfChunks, abspath);
    }

    ctx.status = 200;
};

const postHandler = async (ctx) => {
    const {
        name,
        identifier,
        numberOfChunks,
        abspath
    } = await handleChunk(configuration.uploadDirectory, ctx);

    await processChunks(ctx.client, configuration.uploadDirectory, configuration.fileDirectory, name, identifier, numberOfChunks, abspath);

    ctx.status = 200;
};

module.exports = {
    getHandler,
    postHandler
};
