
"use strict";

const { api } = require("../../../api");

// TODO: Should we support relative symlinks... api.symlink does not support this either
module.exports = async (client, term,
    // Create a new link or symlink
    opts, // s Create a symlink
    srcpath, // AbsolutePath
    dstpath // AbsolutePath
) => {
    if (opts.s) {
        await api.symlink(client, srcpath, dstpath);
    } else {
        await api.link(client, srcpath, dstpath);
    }
};

