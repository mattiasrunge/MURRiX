"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.dispose = () => {
    };
});
