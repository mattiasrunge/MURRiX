"use strict";

const stream = require("koa-stream");
const co = require("bluebird").coroutine;

let params = {};

module.exports = {
    method: "GET",
    route: "/:name",
    init: co(function*(config) {
        params = config;
    }),
    handler: function*(name) {
        yield stream.file(this, name, {
            root: params.mcsDirectory,
            allowDownload: true
        });
    }
};
