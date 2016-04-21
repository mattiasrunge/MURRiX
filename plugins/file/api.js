"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const promisifyAll = require("bluebird").promisifyAll;
const uuid = require("node-uuid");
const octal = require("octal");
const sha1 = require("sha1");
const fs = require("fs-extra-promise");
const mime = require("mime");
const checksum = promisifyAll(require("checksum"));
const api = require("api.io");

const mcs = api.client.create();

let params = {};

let file = api.register("file", {
    deps: [],
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
    })
});

module.exports = file;
