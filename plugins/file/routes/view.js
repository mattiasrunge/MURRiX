"use strict";

const path = require("path");
const stream = require("koa-stream");
const co = require("bluebird").coroutine;

let params = {};

module.exports = {
    method: "GET",
    route: "/:filename",
    init: co(function*(config) {
        params = config;
    }),
    handler: function*(filename) {
        yield stream.file(this, path.basename(filename), {
            root: params.fileDirectory,
            allowDownload: true
        });
    }
};
