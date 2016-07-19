"use strict";

const utils = require("lib/utils");
const ko = require("knockout");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;

    this.dispose = () => {
    };
});
