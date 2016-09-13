"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");
const log = require("../../core/lib/log")(module);

const mcsApi = api.client.create();

let params = {};

let mcs = api.register("mcs", {
    deps: [],
    init: co(function*(config) {
        params = config;

        yield mcsApi.connect({
            hostname: params.mcs.host,
            port: params.mcs.port
        }, (status, message) => {
            if (status === "timeout") {
                log.error(message);
                process.exit(255);
            } else if (status === "disconnect") {
                log.error("Disconnected from server, will attempt to reconnect...");
            } else if (status === "reconnect") {
                log.info("Reconnected to server, will re-authenticate");
                mcs.authenticate();
            }
        });

        yield mcs.authenticate();
    }),
    authenticate: co(function*() {
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
    },
    getStatus: function*() {
        return mcsApi.cache.status();
    }
});

module.exports = mcs;
