"use strict";

const path = require("path");
const fs = require("fs-extra-promise");

let params = {};

module.exports = {
    method: "GET",
    route: "/:filename/:name",
    init: async (config) => {
        params = config;
    },
    handler: async (ctx, filename, name) => {
        ctx.set("Content-disposition", "filename=" + encodeURIComponent(name));
        ctx.body = fs.createReadStream(path.join(params.mcsDirectory, path.basename(filename)));
    }
};
