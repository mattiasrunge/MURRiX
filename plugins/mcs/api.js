"use strict";

const api = require("api.io");
const log = require("../../core/lib/log")(module);

const mcsApi = api.client.create();

let params = {};

const mcs = api.register("mcs", {
    deps: [],
    init: async (config) => {
        params = config;

        await mcsApi.connect({
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

        await mcs.authenticate();
    },
    authenticate: async () => {
        let result = await mcsApi.auth.identify(params.mcs.key);

        if (!result) {
            throw new Error("Failed to identify ourselves with the MCS, is the keys set up?");
        }
    },
    getMetadata: api.export((filename, options) => {
        return mcsApi.metadata.get(filename, options);
    }),
    getFaces: api.export((filename) => {
        return mcsApi.face.detect(filename);
    }),
    compileTime: api.export((sources) => {
        return mcsApi.time.compile(sources);
    }),
    getCached: api.export((id, filename, format) => {
        return mcsApi.cache.get(id, filename, format, params.mcsDirectory);
    }),
    getStatus: api.export(async () => {
        return mcsApi.cache.status();
    })
});

module.exports = mcs;
