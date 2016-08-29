"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

let lastPath = false;
let reloadFlag = ko.observable(false);

module.exports = {
    loading: stat.create(),
    nodepath: ko.asyncComputed(false, function*(setter) {
        let path = ko.unwrap(loc.current().path);

        reloadFlag();

        if (!path || path === "") {
            lastPath = path;
            return false;
        } else if (path === lastPath) {
            return;
        }

        ui.setTitle(false);
        lastPath = path;
        setter(false);

        module.exports.loading(true);
        let node = yield api.vfs.resolve(path, { noerror: true });
        let editable = yield api.vfs.access(path, "w");
        module.exports.loading(false);

        if (!node) {
            return false;
        }

        ui.setTitle(node.attributes.name);

        return { path: path, node: ko.observable(node), editable: ko.observable(editable) };
    }, (error) => {
        module.exports.loading(false);
        stat.printError(error);
        return false;
    }),
    list: ko.observableArray(),
    escapeName: (name) => {
        return name.replace(/ |\//g, "_");
    },
    basename: (path) => {
        return path.split("/").reverse()[0];
    },
    getUniqueName: co.wrap(function*(parent, baseName) {
        parent = typeof parent === "string" ? yield api.vfs.resolve(parent) : parent;
        let name = module.exports.escapeName(baseName);
        let counter = 1;

        while (parent.properties.children.filter((child) => child.name === name).length > 0) {
            name = module.exports.escapeName(baseName) + "_" + counter;
            counter++;
        }

        return name;
    }),
    reload: () => {
        lastPath = "";
        reloadFlag(!reloadFlag());
    }
};
