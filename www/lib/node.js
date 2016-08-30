"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

let lastPath = false;
let reloadFlag = ko.observable(false);

ko.nodepath = function(path, options) {
    options = options || {};

    let loading = stat.create();
    let result = ko.observable(false);
    let active = 0;
    let lastPath = false;
    let reloadFlag = ko.observable(false);
    let isReloading = false;
    let computed = ko.pureComputed(() => {
        let newPath = ko.unwrap(path);

        reloadFlag();

        if (newPath === lastPath && !isReloading) {
            return;
        }

        lastPath = newPath;

        let currentActive = ++active;

        loading(true);

        api.vfs.resolve(newPath, { nodepath: true, noerror: options.noerror })
        .then((data) => {
            if (currentActive !== active) {
                return;
            }

            isReloading = false;
            loading(false);

            if (data) {
                data.node = ko.observable(data.node);
                result(data);
            } else {
                result(false);
            }
        })
        .catch((error) => {
            if (currentActive !== active) {
                return;
            }

            isReloading = false;
            loading(false);

            stat.printError(error);

            result(false);
        });
    });

    let subscription1 = api.vfs.on("new", (event) => {
        if (event.path === lastPath) {
            pure.reload();
        }
    });

    let subscription2 = api.vfs.on("removed", (event) => {
        if (event.path === lastPath) {
            pure.reload();
        }
    });

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.dispose = () => {
        api.vfs.off(subscription1);
        api.vfs.off(subscription2);
        stat.destroy(loading);
        computed.dispose();
    };

    pure.reload = () => {
        isReloading = true;
        reloadFlag(!reloadFlag());
    };

    return pure;
};

module.exports = {
    loading: stat.create(),
    nodepath: ko.asyncComputed(false, function*(setter) {
        let path = ko.unwrap(loc.current().path);

        reloadFlag();

        if (!path || path === "") {
            lastPath = path;
            return false;
        } else if (path === lastPath && !this.triggeredByReload) {
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
    setProfilePicture: co.wrap(function*(abspath, picturePath) {
        yield api.vfs.unlink(abspath + "/profilePicture");
        yield api.vfs.symlink(picturePath, abspath + "/profilePicture");
    }),
    reload: () => {
        lastPath = "";
        reloadFlag(!reloadFlag());
    }
};
