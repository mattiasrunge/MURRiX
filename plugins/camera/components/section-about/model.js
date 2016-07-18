"use strict";

/* TODO:
 * Implement comments
 * Implement timeline
 * Implement labels
 * Use real images in mosaic
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;


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
//         subscription.dispose();
    };
});
