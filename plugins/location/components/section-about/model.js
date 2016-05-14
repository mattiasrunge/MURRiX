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
    this.node = params.node;
    this.path = params.path;

    this.partnerPath = ko.asyncComputed(false, function*() {
        let path = this.path() + "/partner";
        let node = yield api.vfs.resolve(path, true, true);

        if (node && node.properties.type === "s") {
            path = node.attributes.path;
            node = yield api.vfs.resolve(path, false, true);
        } else {
            return false;
        }

        // TODO: Replace with a vfs.readlink call when available

        return path;
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.partner = ko.asyncComputed(false, function*() {
        if (!this.partnerPath()) {
            return false;
        }

        return yield api.vfs.resolve(this.partnerPath());
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.dispose = () => {
//         subscription.dispose();
    };
});
