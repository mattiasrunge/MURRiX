"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.list = params.list;

    this.dispose = () => {
    };
});
