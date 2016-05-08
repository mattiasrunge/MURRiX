"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.node = params.node;
    this.path = params.path;
    this.size = 95;

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
