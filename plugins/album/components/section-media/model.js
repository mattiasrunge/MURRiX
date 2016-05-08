"use strict";

/* TODO:
 * Allow drag and drop to set profile picture
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.path = params.path;
    this.node = params.node;
    this.size = 235;

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
