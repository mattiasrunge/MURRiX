"use strict";

const stream = require("koa-stream");
const co = require("bluebird").coroutine;

let params = {};

module.exports = {
    method: "GET",
    route: "/:filename/:name",
    init: co(function*(config) {
        params = config;
    }),
    handler: function*(filename, name) {
        this.set("Content-disposition", "filename=" + name);
        yield stream.file(this, filename, {
            root: params.mcsDirectory,
            allowDownload: true
        });
    }
};
