"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const status = require("lib/status");

let lastPath = false;

module.exports = {
    loading: status.create(),
    nodepath: ko.asyncComputed(false, function*(setter) {
        let path = ko.unwrap(loc.current().path);

        ui.setTitle(false);

        if (!path || path === "") {
            lastPath = path;
            return false;
        } else if (path === lastPath) {
            return;
        }

        lastPath = path;
        setter(false);

        module.exports.loading(true);
        let node = yield api.vfs.resolve(path, true)
        module.exports.loading(false);

        if (!node) {
            return false;
        }

        ui.setTitle(node.attributes.name);

        return { path: path, node: node };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    }),
    list: ko.observableArray()
};