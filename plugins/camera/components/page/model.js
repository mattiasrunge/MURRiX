"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.ownersPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/owners" : false);
    this.owners = ko.nodepathList(this.ownersPath, { noerror: true });

    this.dispose = () => {
        this.owners.dispose();
    };
});
