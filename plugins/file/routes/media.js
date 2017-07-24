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
        const filepath = path.join(params.mcsDirectory, path.basename(filename));
        const stat = fs.statAsync(filepath);

        ctx.set("Content-disposition", "filename=" + encodeURIComponent(name));
        ctx.length = stat.size;
        ctx.body = fs.createReadStream(filepath);
    }
};
