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
    getMetadata: function*(filename, options) {
        return yield mcsApi.metadata.get(filename, options);
    },
    getFaces: function*(filename) {
        return yield mcsApi.face.detect(filename);
    },
    compileTime: function*(sources) {
        return yield mcsApi.time.compile(sources);
    },
    getCached: function*(id, filename, format) {
        return yield mcsApi.cache.get(id, filename, format);
    }
});

module.exports = mcs;
