"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.params = params.params;
    this.section = params.section;
    this.sections = params.sections;

    this.dispose = () => {
    };
});
