"use strict";

const ko = require("knockout");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;
    this.filesPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/files" : false);
    this.filesNodepath = ko.nodepath(this.filesPath, { noerror: true });
    this.count = ko.pureComputed(() => {
        if (!this.filesNodepath()) {
            return 0;
        }

        return this.filesNodepath().node().properties.children.length;
    });

    this.dispose = () => {
        this.filesNodepath.dispose();
    };
});
