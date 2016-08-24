"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const co = require("bluebird").coroutine;

let params = {};

module.exports = {
    method: "GET",
    route: "/:name/:filename",
    init: co(function*(config) {
        params = config;
    }),
    handler: function*(filename, name) {
        this.set("Content-disposition", "attachment; filename=" + name);
        this.body = fs.createReadStream(path.join(params.fileDirectory, path.basename(filename)));
    }
};
