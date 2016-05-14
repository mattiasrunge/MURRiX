"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.node = params.node

    this.dispose = () => {
    };
});
