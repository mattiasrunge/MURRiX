"use strict";

const configuration = require("../config");
const handleChunk = require("./handleChunk");
const handleCheck = require("./handleCheck");
const processChunks = require("./processChunks");

const getHandler = async (ctx) => {
    console.log("upload: GET start")
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
    console.log("upload: GET end")
};

const postHandler = async (ctx) => {
    console.log("upload: POST start")
    const {
        name,
        identifier,
        numberOfChunks,
        abspath
    } = await handleChunk(configuration.uploadDirectory, ctx);

    await processChunks(ctx.client, configuration.uploadDirectory, configuration.fileDirectory, name, identifier, numberOfChunks, abspath);

    ctx.status = 200;

    console.log("upload: POST end")
    console.log(" - name: ", name)
    console.log(" - identifier: ", identifier)
    console.log(" - numberOfChunks: ", numberOfChunks)
    console.log(" - abspath: ", abspath)
};

module.exports = {
    getHandler,
    postHandler
};
