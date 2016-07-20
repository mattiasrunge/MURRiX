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
        let editable = yield api.vfs.access(path, "w");
        module.exports.loading(false);

        if (!node) {
            return false;
        }

        ui.setTitle(node.attributes.name);

        return { path: path, node: ko.observable(node), editable: ko.observable(editable) };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    }),
    list: ko.observableArray(),
    getUniqueName: co.wrap(function*(path, baseName) {
        let name = baseName.replace(/ |\//g, "_");

        let counter = 1;
        while (yield api.vfs.resolve(path + "/" + name, true)) {
            name = baseName.replace(/ |\//g, "_") + "_" + counter;
            counter++;
        };

        return name;
    })
};
