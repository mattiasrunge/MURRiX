"use strict";

const utils = require("lib/utils");
const ko = require("knockout");

module.exports = utils.wrapComponent(function*(params) {
    this.params = params.params;
    this.section = params.section;
    this.sections = params.sections;
    this.showShareSettings = params.showShareSettings || false;
    this.showUpload = ko.pureComputed(() => ko.unwrap(params.showUpload) || false);

    this.dispose = () => {
    };
});
