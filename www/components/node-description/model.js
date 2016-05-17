"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath

    this.dispose = () => {
    };
});
