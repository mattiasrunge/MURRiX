"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.itemPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path : false);
    this.item = ko.nodepath(this.itemPath, { noerror: true });

    this.dispose = () => {
        this.item.dispose();
    };
});
