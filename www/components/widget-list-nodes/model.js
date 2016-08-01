"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.list = params.list;

    this.dispose = () => {
    };
});
