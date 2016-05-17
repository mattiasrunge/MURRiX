"use strict";

/* TODO:
 * Implement timeline
 * Implement labels
 * Use real images in mosaic
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;

    this.dispose = () => {
    };
});
