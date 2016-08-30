"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");

const mcsApi = api.client.create();

let params = {};

let mcs = api.register("mcs", {
    deps: [],
    init: co(function*(config) {
        params = config;

        yield mcsApi.connect({
            hostname: params.mcs.host,
            port: params.mcs.port
        });

        let result = yield mcsApi.auth.identify(params.mcs.key);

        if (!result) {
            throw new Error("Failed to identify ourselves with the MCS, is the keys set up?");
        }
    }),
    getMetadata: (filename, options) => {
        return mcsApi.metadata.get(filename, options);
    },
    getFaces: (filename) => {
        return mcsApi.face.detect(filename);
    },
    compileTime: (sources) => {
        return mcsApi.time.compile(sources);
    },
    getCached: (id, filename, format) => {
        return mcsApi.cache.get(id, filename, format, params.mcsDirectory);
    }
});

module.exports = mcs;
