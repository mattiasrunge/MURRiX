"use strict";

const utils = require("lib/utils");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.user = session.user;

    this.dispose = () => {
    };
});
