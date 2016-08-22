"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");

const mcs = api.client.create();

let params = {};

module.exports = {
    init: co(function*(config) {
        params = config;

        yield mcs.connect({
            hostname: params.mcs.host,
            port: params.mcs.port
        });

        let result = yield mcs.auth.identify(params.mcs.key);

        if (!result) {
            throw new Error("Failed to identify ourselves with the MCS, is the keys set up?");
        }
    }),
    getMetadata: (filename, options) => {
        return mcs.metadata.get(filename, options);
    },
    getFaces: (filename) => {
        return mcs.face.detect(filename);
    },
    compileTime: (sources) => {
        return mcs.time.compile(sources);
    },
    getCached: (id, filename, format) => {
        return mcs.cache.get(id, filename, format);
    }
};
