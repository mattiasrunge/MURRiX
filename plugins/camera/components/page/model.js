"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.owners = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);
        return yield api.vfs.list(this.nodepath().path + "/owners");
    }.bind(this), (error) => {
        status.printError(error);
        return [];
    });



    this.dispose = () => {
    };
});
