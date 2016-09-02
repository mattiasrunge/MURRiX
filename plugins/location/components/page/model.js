"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.position = ko.asyncComputed(false, function*() {
        if (!this.nodepath()) {
            return false;
        }

        if (!this.nodepath().node().attributes.address) {
            return false;
        }

        return yield api.lookup.getPositionFromAddress(this.nodepath().node().attributes.address.replace("<br>", "\n"));
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.residentsPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/residents" : false);
    this.residents = ko.nodepathList(this.residentsPath, { noerror: true });

    this.dispose = () => {
        this.residents.dispose();
    };
});
