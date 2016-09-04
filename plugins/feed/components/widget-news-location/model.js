"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.position = ko.asyncComputed(false, function*() {
        if (!this.item()) {
            return false;
        }

        if (!this.item().node().attributes.address) {
            return false;
        }

        return yield api.lookup.getPositionFromAddress(this.item().node().attributes.address.replace("<br>", "\n"));
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.itemPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path : false);
    this.item = ko.nodepath(this.itemPath, { noerror: true });

    this.dispose = () => {
        this.item.dispose();
        stat.destroy(this.loading);
    };
});
