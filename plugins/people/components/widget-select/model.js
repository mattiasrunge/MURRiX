"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.id = params.inputId || "random";
    this.person = params.person;

    this.dispose = () => {
    };
});
