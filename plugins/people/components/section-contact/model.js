"use strict";

/* TODO:
 * Homes should have a date interval on them, store as attributes on the symlink
 * Contact information should have icons and emails be clickable etc
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

model.nodepath = params.nodepath;
model.selectedHome = ko.observable(false);
model.locationPath = ko.observable();

model.position = ko.asyncComputed(false, function*() {
    if (!model.selectedHome()) {
        return false;
    }

    return yield api.lookup.getPositionFromAddress(model.selectedHome().node.attributes.address.replace("<br>", "\n"));
}, (error) => {
    stat.printError(error);
    return false;
});

model.homes = ko.asyncComputed(false, function*() {
    let list = yield api.vfs.list(model.nodepath().path + "/homes");

    if (list.length > 0) {
        if (!model.selectedHome()) {
            model.selectedHome(list[0]);
        }
    } else {
        model.selectedHome(false);
    }

    return list;
}, (error) => {
    stat.printError(error);
    return [];
});

model.remove = (data) => {
    // TODO: This is not really safe, the path name of the location might have changed but the link names have not changed. As after a move operation on the location. Better to find relevant links based on path they point to and remove them.

    api.vfs.unlink(model.nodepath().path + "/homes/" + node.basename(data.path))
    .then(() => {
        return api.vfs.unlink(data.path + "/residents/" + node.basename(model.nodepath().path));
    })
    .then(() => {
        model.selectedHome(false);
        model.homes.reload();
    })
    .catch((error) => {
        stat.printError(error);
    });
};

let subscription = model.locationPath.subscribe((abspath) => {
    if (!abspath) {
        return;
    }

    api.vfs.symlink(abspath, model.nodepath().path + "/homes")
    .then(() => {
        return api.vfs.symlink(model.nodepath().path, abspath + "/residents");
    })
    .then(() => {
        model.selectedHome(false);
        model.homes.reload();
        model.locationPath(false);
    })
    .catch((error) => {
        stat.printError(error);
    });
});

const dispose = () => {
    subscription.dispose();
};
