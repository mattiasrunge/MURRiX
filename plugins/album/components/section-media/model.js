﻿"use strict";

/* TODO:
 * Allow drag and drop to set profile picture
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.size = 224;

    this.dispose = () => {
    };
});
