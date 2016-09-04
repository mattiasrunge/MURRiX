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

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.selectedHome = ko.observable(false);
    this.locationPath = ko.observable();

    this.position = ko.asyncComputed(false, function*() {
        if (!this.selectedHome()) {
            return false;
        }

        return yield api.lookup.getPositionFromAddress(this.selectedHome().node.attributes.address.replace("<br>", "\n"));
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.homes = ko.asyncComputed(false, function*() {
        let list = yield api.vfs.list(this.nodepath().path + "/homes");

        if (list.length > 0) {
            if (!this.selectedHome()) {
                this.selectedHome(list[0]);
            }
        } else {
            this.selectedHome(false);
        }

        return list;
    }.bind(this), (error) => {
        stat.printError(error);
        return [];
    });

    this.remove = (data) => {
        // TODO: This is not really safe, the path name of the location might have changed but the link names have not changed. As after a move operation on the location. Better to find relevant links based on path they point to and remove them.

        api.vfs.unlink(this.nodepath().path + "/homes/" + node.basename(data.path))
        .then(() => {
            return api.vfs.unlink(data.path + "/residents/" + node.basename(this.nodepath().path));
        })
        .then(() => {
            this.selectedHome(false);
            this.homes.reload();
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    let subscription = this.locationPath.subscribe((abspath) => {
        if (!abspath) {
            return;
        }

        api.vfs.symlink(abspath, this.nodepath().path + "/homes")
        .then(() => {
            return api.vfs.symlink(this.nodepath().path, abspath + "/residents");
        })
        .then(() => {
            this.selectedHome(false);
            this.homes.reload();
            this.locationPath(false);
        })
        .catch((error) => {
            stat.printError(error);
        });
    });

    this.dispose = () => {
        subscription.dispose();
    };
});
