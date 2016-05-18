"use strict";

const utils = require("lib/utils");
const ko = require("knockout");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.dispose = () => {
    };
});
